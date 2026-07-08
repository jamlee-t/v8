// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "src/sandbox/generated-code-validator.h"

#ifdef V8_ENABLE_GENERATED_CODE_VALIDATOR

namespace v8::internal {

void GeneratedCodeValidator::Validate(Tagged<Code> code) {
  if (!v8_flags.validate_generated_code) {
    return;
  }

  // TODO(523128533): Implement generated code validation.
}

}  // namespace v8::internal

#endif  // V8_ENABLE_GENERATED_CODE_VALIDATOR
