// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//
// Flags: --allow-natives-syntax --turbofan --turbolev

// A polymorphic property access compares the receiver map against each arm in
// turn and lets the last arm fall through to a CheckMaps. Reaching that arm
// proves the receiver's map is none of the ones already compared, so those maps
// are dropped from the known maps. Every arm must still read the right field,
// and a receiver whose map is in none of the arms must still deopt.

function makeA(v) { const o = {a: v}; return o; }
function makeB(v) { const o = {b: 0, a: v}; return o; }
function makeC(v) { const o = {c: 0, d: 0, a: v}; return o; }

(function testThreeWayPolymorphicLoad() {
  function load(o) { return o.a; }

  %PrepareFunctionForOptimization(load);
  assertEquals(1, load(makeA(1)));
  assertEquals(2, load(makeB(2)));
  assertEquals(3, load(makeC(3)));
  %OptimizeFunctionOnNextCall(load);
  assertEquals(1, load(makeA(1)));
  assertEquals(2, load(makeB(2)));
  assertEquals(3, load(makeC(3)));

  // A fourth, unseen shape must still produce the right value after deopt.
  assertOptimized(load);
  assertEquals(4, load({x: 0, y: 0, z: 0, a: 4}));
  assertEquals(undefined, load({q: 1}));
})();

(function testThreeWayPolymorphicStore() {
  function store(o, v) { o.a = v; return o.a; }

  %PrepareFunctionForOptimization(store);
  assertEquals(9, store(makeA(1), 9));
  assertEquals(9, store(makeB(2), 9));
  assertEquals(9, store(makeC(3), 9));
  %OptimizeFunctionOnNextCall(store);
  const a = makeA(1), b = makeB(2), c = makeC(3);
  assertEquals(7, store(a, 7));
  assertEquals(8, store(b, 8));
  assertEquals(9, store(c, 9));
  assertEquals(7, a.a);
  assertEquals(8, b.a);
  assertEquals(9, c.a);
})();

(function testRepeatedAccessesOnSameReceiver() {
  // The pattern from delta-blue: several polymorphic reads of the same object
  // in one function, each narrowing the known maps independently.
  function sum(o) { return o.a + o.a + o.a; }

  %PrepareFunctionForOptimization(sum);
  assertEquals(3, sum(makeA(1)));
  assertEquals(6, sum(makeB(2)));
  assertEquals(9, sum(makeC(3)));
  %OptimizeFunctionOnNextCall(sum);
  assertEquals(3, sum(makeA(1)));
  assertEquals(6, sum(makeB(2)));
  assertEquals(9, sum(makeC(3)));
})();

(function testPolymorphicElementLoad() {
  // Same narrowing on the element-access dispatch: three element kinds, so the
  // last arm's CheckMaps is implied once the first two compares failed.
  function load(a, i) { return a[i]; }

  const smi = [1, 2, 3];
  const dbl = [1.5, 2.5, 3.5];
  const obj = [{v: 1}, {v: 2}, {v: 3}];

  %PrepareFunctionForOptimization(load);
  assertEquals(1, load(smi, 0));
  assertEquals(2.5, load(dbl, 1));
  assertEquals(3, load(obj, 2).v);
  %OptimizeFunctionOnNextCall(load);
  assertEquals(1, load(smi, 0));
  assertEquals(2.5, load(dbl, 1));
  assertEquals(3, load(obj, 2).v);
  // Out of bounds and an unseen elements kind must still behave.
  assertEquals(undefined, load(smi, 5));
  assertEquals("b", load(["a", "b"], 1));
})();

(function testPolymorphicElementStoreWithTransition() {
  // Storing a double into a PACKED_SMI array transitions its elements kind, so
  // the narrowing must be disabled for arms that transition.
  function store(a, i, v) { a[i] = v; return a[i]; }

  const smi = [1, 2, 3];
  const dbl = [1.5, 2.5, 3.5];

  %PrepareFunctionForOptimization(store);
  assertEquals(7, store(smi, 0, 7));
  assertEquals(7.5, store(dbl, 0, 7.5));
  %OptimizeFunctionOnNextCall(store);
  const fresh = [1, 2, 3];
  assertEquals(9.5, store(fresh, 1, 9.5));
  assertEquals([1, 9.5, 3], fresh);
  assertEquals(7.5, store(dbl, 0, 7.5));
})();

(function testDictionaryReceiverStillWorks() {
  function load(o) { return o.a; }
  const dict = makeA(5);
  %PrepareFunctionForOptimization(load);
  assertEquals(5, load(dict));
  assertEquals(2, load(makeB(2)));
  %OptimizeFunctionOnNextCall(load);
  delete dict.a;
  assertEquals(undefined, load(dict));
  assertEquals(2, load(makeB(2)));
})();
