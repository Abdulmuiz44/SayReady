import test from 'node:test';
import assert from 'node:assert/strict';

import { buildScenarioRecommendation } from './recommendation.mjs';

const scenarios = [
  {
    id: 'scenario-a',
    title: 'Difficult customer follow-up',
    category: 'objection_handling',
    is_premium: false,
    goal_tags: ['closing', 'confidence'],
    mistake_keys: ['filler_words'],
  },
  {
    id: 'scenario-b',
    title: 'Discovery call setup',
    category: 'discovery',
    is_premium: false,
    goal_tags: ['discovery'],
    mistake_keys: ['weak_opening'],
  },
  {
    id: 'scenario-c',
    title: 'Executive stakeholder presentation',
    category: 'executive_presence',
    is_premium: true,
    goal_tags: ['closing'],
    mistake_keys: ['filler_words'],
  },
];

test('returns deterministic ordering with stable tie-breaker for a user/date', () => {
  const context = {
    user_id: 'f24980d1-6e7c-45a1-a70f-f06860f146f1',
    date: '2026-03-21',
    is_premium_user: true,
    primary_goal: 'closing',
    under_practiced_categories: ['discovery'],
    repeated_mistake_keys: ['filler_words'],
  };

  const first = buildScenarioRecommendation(scenarios, context);
  const second = buildScenarioRecommendation(scenarios, context);

  assert.deepEqual(first.ranked.map((item) => item.scenario.id), second.ranked.map((item) => item.scenario.id));
  assert.equal(first.selected?.scenario.id, second.selected?.scenario.id);
});

test('filters premium scenarios for free users while preserving ranked output', () => {
  const context = {
    user_id: 'f24980d1-6e7c-45a1-a70f-f06860f146f1',
    date: '2026-03-21',
    is_premium_user: false,
    primary_goal: 'closing',
    under_practiced_categories: ['discovery'],
    repeated_mistake_keys: ['filler_words'],
  };

  const recommendation = buildScenarioRecommendation(scenarios, context);

  assert.equal(recommendation.ranked.some((item) => item.scenario.id === 'scenario-c'), false);
  assert.notEqual(recommendation.selected?.scenario.id, 'scenario-c');
});
