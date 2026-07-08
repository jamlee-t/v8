// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef V8_SANDBOX_GENERATED_CODE_VALIDATOR_H_
#define V8_SANDBOX_GENERATED_CODE_VALIDATOR_H_

#ifdef V8_ENABLE_GENERATED_CODE_VALIDATOR

#include "src/objects/code.h"

namespace v8::internal {

class GeneratedCodeValidator {
 public:
  static void Validate(Tagged<Code> code);
};

}  // namespace v8::internal

#endif  // V8_ENABLE_GENERATED_CODE_VALIDATOR

#endif  // V8_SANDBOX_GENERATED_CODE_VALIDATOR_H_
