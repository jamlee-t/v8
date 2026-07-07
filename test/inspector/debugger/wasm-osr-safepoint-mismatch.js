// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --liftoff --no-wasm-tier-up --no-debug-code

utils.load('test/inspector/protocol-test.js');
utils.load('test/inspector/wasm-inspector-test.js');

let {session, contextGroup, Protocol} =
    InspectorTest.start('Verifies OSR safepoint consistency on ARM64');

var builder = new WasmModuleBuilder();
// 26 externref parameters to force register pressure on ARM64.
// Liftoff uses 24 GP registers for caching. The kWithBreakpoints path
// performs a function-entry break check which requests a register.
// If all registers are full, this causes a spill, which is absent in
// the kForStepping path (omitting the entry check).
let num_params = 26;
let sig = {params: Array(num_params).fill(kWasmExternRef), results: []};
builder.addFunction('main', sig).addBody([kExprNop, kExprNop]).exportAs('main');

var module_bytes = builder.toArray();

Protocol.Debugger.enable();
Protocol.Runtime.enable();

InspectorTest.runAsyncTestSuite([async function test() {
  WasmInspectorTest.instantiate(module_bytes, 'instance');
  const [, {params: wasmScript}] = await Protocol.Debugger.onceScriptParsed(2);

  // Set breakpoint on the second instruction.
  await Protocol.Debugger.setBreakpoint({
    location: {
      scriptId: wasmScript.scriptId,
      lineNumber: 0,
      columnNumber: builder.functions[0].body_offset + 1
    }
  });

  InspectorTest.log('Calling main...');
  // Trigger kWithBreakpoints code.
  Protocol.Runtime.evaluate(
      {expression: `instance.exports.main(...Array(${num_params}).fill({}))`});

  await Protocol.Debugger.oncePaused();
  InspectorTest.log('Paused at breakpoint');

  InspectorTest.log('Stepping into (triggers OSR to kForStepping)...');
  // If the safepoint validation logic is active, this will hit a DCHECK
  // on ARM64 (or other non-x64 architectures) due to the spill divergence.
  Protocol.Debugger.stepInto();

  await Protocol.Debugger.oncePaused();
  InspectorTest.log('Paused after stepInto');
  InspectorTest.completeTest();
}]);
