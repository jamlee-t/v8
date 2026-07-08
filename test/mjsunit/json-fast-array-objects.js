// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Test homogeneous object arrays parse correctly via Direct Layout Allocation fast path.
(function TestHomogeneousObjectArray() {
  const items = [
    { id: 1, name: "foo", active: true, score: 95.5 },
    { id: 2, name: "bar", active: false, score: 88.25 },
    { id: 3, name: "baz", active: true, score: 100.0 }
  ];
  const json = JSON.stringify(items);
  const parsed = JSON.parse(json);
  assertEquals(items.length, parsed.length);
  for (let i = 0; i < items.length; i++) {
    assertEquals(items[i].id, parsed[i].id);
    assertEquals(items[i].name, parsed[i].name);
    assertEquals(items[i].active, parsed[i].active);
    assertEquals(items[i].score, parsed[i].score);
  }
})();

// Test heterogeneous/mismatched object arrays fall back correctly.
(function TestHeterogeneousObjectArray() {
  const items = [
    { id: 1, name: "foo" },
    { id: 2, name: "bar", extra: true },
    { id: 3, different: "key" }
  ];
  const json = JSON.stringify(items);
  const parsed = JSON.parse(json);
  assertEquals(items.length, parsed.length);
  assertEquals(items[0], parsed[0]);
  assertEquals(items[1], parsed[1]);
  assertEquals(items[2], parsed[2]);
})();

// Test reviver with homogeneous array.
(function TestReviverHomogeneousArray() {
  const items = [
    { a: 10, b: 20 },
    { a: 30, b: 40 }
  ];
  const json = JSON.stringify(items);
  const parsed = JSON.parse(json, (key, val) => {
    if (typeof val === "number") return val * 2;
    return val;
  });
  assertEquals(20, parsed[0].a);
  assertEquals(40, parsed[0].b);
  assertEquals(60, parsed[1].a);
  assertEquals(80, parsed[1].b);
})();
