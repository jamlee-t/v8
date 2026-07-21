// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --allow-natives-syntax --turbolev --maglev-assert --no-concurrent-recompilation

function test() {
  let cases = Array.from({ length: 80000 }, (_, i) => `case ${i}:`);
  let f = Function('x', `switch(x){${cases.join(' ')} default:0;}`);

  for (let i = 0; i < 5000; i++) {
    if (i == 2000) %OptimizeOsr();
    f();
  }
}
%PrepareFunctionForOptimization(test);
test();
