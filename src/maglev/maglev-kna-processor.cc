// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "src/maglev/maglev-kna-processor.h"

#include "src/maglev/maglev-ir-inl.h"
#include "src/maglev/maglev-reducer-inl.h"
#include "src/numbers/conversions-inl.h"

namespace v8::internal::maglev {

ProcessResult RecomputeKnownNodeAspectsProcessor::RecordType(ValueNode* node,
                                                             NodeType type) {
  if (known_node_aspects().EnsureType(broker(), node, type) ==
      EnsureTypeResult::kContradiction) {
    ReduceResult result = ReduceResult::Done();
    if (current_node()->properties().can_eager_deopt()) {
      // TODO(marja): Ideally, we would detect the empty type already when
      // MaglevGraphOptimizer processes the node and just insert an Abort here.
      // However, the current MaglevGraphOptimizer is incomplete, and sometimes
      // this is where empty types pop up the first time, thus we need to deopt
      // gracefully.
      result = reducer_.EmitUnconditionalDeopt(DeoptimizeReason::kWrongValue);
    } else {
      // We should never have AssumeType produce an empty type but still
      // execute the code we generate after.
      CHECK_EQ(current_node()->opcode(), Opcode::kAssumeType);
      result = reducer_.BuildAbort(AbortReason::kUnreachable);
    }
    CHECK(result.IsDoneWithAbort());
    return ProcessResult::kTruncateBlock;
  }
  return ProcessResult::kContinue;
}

ProcessResult RecomputeKnownNodeAspectsProcessor::ProcessNode(AssumeMap* node) {
  auto merger = KnownMapsMerger<compiler::ZoneRefSet<Map>>(broker(), zone(),
                                                           node->maps());
  merger.IntersectWithKnownNodeAspects(node->ObjectInput().node(),
                                       known_node_aspects());
  if (!merger.UpdateKnownNodeAspects(node->ObjectInput().node(),
                                     known_node_aspects())) {
    ReduceResult result = reducer_.BuildAbort(AbortReason::kUnreachable);
    CHECK(result.IsDoneWithAbort());
    return ProcessResult::kTruncateBlock;
  }
  return ProcessResult::kContinue;
}

#define DEFINE_PROCESS_SAFE_CONV(Node, Alt, Type)                              \
  ProcessResult RecomputeKnownNodeAspectsProcessor::ProcessNode(Node* node) {  \
    NodeInfo* info = GetOrCreateInfoFor(node->input_node(0));                  \
    if (!info->alternative().Alt()) {                                          \
      /* TODO(victorgomes): What happens if we we have an alternative already? \
       * Should we remove this one as well? */                                 \
      info->alternative().set_##Alt(node);                                     \
    }                                                                          \
    info->IntersectType(NodeType::k##Type);                                    \
    if (info->type() == NodeType::kNone) {                                     \
      if constexpr (Node::kProperties.can_eager_deopt()) {                     \
        ReduceResult result =                                                  \
            reducer_.EmitUnconditionalDeopt(DeoptimizeReason::kWrongValue);    \
        CHECK(result.IsDoneWithAbort());                                       \
        return ProcessResult::kTruncateBlock;                                  \
      } else {                                                                 \
        /* These safe conversion nodes cannot deopt, but they shouldn't        \
         * produce empty types either.*/                                       \
        CHECK(node->opcode() == Opcode::kChangeInt32ToFloat64 ||               \
              node->opcode() == Opcode::kChangeInt32ToHoleyFloat64);           \
        UNREACHABLE();                                                         \
      }                                                                        \
    }                                                                          \
    return ProcessResult::kContinue;                                           \
  }

SAFE_CONVERSION_LIST(DEFINE_PROCESS_SAFE_CONV)

#undef DEFINE_PROCESS_SAFE_CONV

template ReduceResult
    MaglevReducer<RecomputeKnownNodeAspectsProcessor>::EmitUnconditionalDeopt(
        DeoptimizeReason);

}  // namespace v8::internal::maglev
