// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --allow-natives-syntax --turbolev

function foo(a, b) {
  var x = b[0];
  var y = a[0];
  b[0] = 0.3;
}
%PrepareFunctionForOptimization(foo);

var tagged = new Array(1);
tagged[0] = 'tagged';
foo(tagged, [tagged]);

var doubles = new Array(1);
doubles[0] = 0.1;
foo(doubles, doubles);

%OptimizeFunctionOnNextCall(foo);
foo(doubles, doubles);

assertEquals(0.3, doubles[0]);
