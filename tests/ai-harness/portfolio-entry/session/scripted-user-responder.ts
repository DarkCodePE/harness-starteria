import type { QuestionRecord, ScriptedResponseResult } from './session-types';

export type ScriptedResponseRule = {
  id?: string;
  when_resolves_any: string[];
  response: string;
  once?: boolean;
};

type ResponderState = {
  consumedRuleIds: Set<string>;
};

export function createScriptedResponderState(): ResponderState {
  return { consumedRuleIds: new Set<string>() };
}

export function respondToQuestions(
  questions: QuestionRecord[],
  rules: ScriptedResponseRule[],
  state: ResponderState = createScriptedResponderState(),
): ScriptedResponseResult {
  const fallback = rules.find((rule) => rule.when_resolves_any.includes('*'));
  const responses: string[] = [];
  const matchedQuestionIds = new Set<string>();
  const responseRuleIdsUsed = new Set<string>();
  const respondedResolves = new Set<string>();
  const consumedOnceRuleIds = new Set<string>();
  const unmatchedQuestions: QuestionRecord[] = [];
  let fallbackUsed = false;

  for (const question of questions) {
    const matchingRule = rules.find((rule) => {
      const ruleId = getRuleId(rule);
      if (rule.once && state.consumedRuleIds.has(ruleId)) return false;
      if (rule.when_resolves_any.includes('*')) return false;
      return question.resolves.some((resolve) => rule.when_resolves_any.includes(resolve));
    });
    const selectedRule = matchingRule ?? fallback;

    if (!selectedRule) {
      unmatchedQuestions.push(question);
      continue;
    }

    if (!matchingRule) {
      fallbackUsed = true;
      unmatchedQuestions.push(question);
    } else {
      matchedQuestionIds.add(question.id);
      for (const resolve of question.resolves) respondedResolves.add(resolve);
    }

    const ruleId = getRuleId(selectedRule);
    responseRuleIdsUsed.add(ruleId);
    if (!responses.includes(selectedRule.response)) responses.push(selectedRule.response);
    if (selectedRule.once) {
      state.consumedRuleIds.add(ruleId);
      consumedOnceRuleIds.add(ruleId);
    }
  }

  return {
    response: responses.length > 0 ? responses.join(' ') : null,
    matched_question_ids: [...matchedQuestionIds],
    response_rule_ids_used: [...responseRuleIdsUsed],
    responded_resolves: [...respondedResolves],
    unmatched_questions: unmatchedQuestions,
    fallback_used: fallbackUsed,
    consumed_once_rule_ids: [...consumedOnceRuleIds],
  };
}

function getRuleId(rule: ScriptedResponseRule): string {
  return rule.id ?? `anonymous:${rule.when_resolves_any.join('|')}:${rule.response}`;
}
