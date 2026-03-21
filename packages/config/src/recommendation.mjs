const WEIGHTS = {
  primaryGoalMatch: 100,
  underPracticedCategoryBonus: 25,
  repeatedMistakeRelevanceBonus: 15,
};

const normalizeArray = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
    .filter(Boolean);
};

export const deterministicHash = (value) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export const tieBreakerValue = (userId, date, scenarioId) => {
  const seed = deterministicHash(`${userId}:${date}`);
  return deterministicHash(`${seed}:${scenarioId}`);
};

export const scoreScenario = (scenario, context) => {
  const scenarioGoals = normalizeArray(scenario.goal_tags);
  const scenarioMistakes = normalizeArray(scenario.mistake_keys);
  const underPracticed = new Set(normalizeArray(context.under_practiced_categories));
  const repeatedMistakes = new Set(normalizeArray(context.repeated_mistake_keys));

  const goalKey = typeof context.primary_goal === 'string'
    ? context.primary_goal.trim().toLowerCase()
    : '';

  let total = 0;
  const breakdown = {
    primaryGoalMatch: 0,
    underPracticedCategoryBonus: 0,
    repeatedMistakeRelevanceBonus: 0,
  };

  if (goalKey && scenarioGoals.includes(goalKey)) {
    breakdown.primaryGoalMatch = WEIGHTS.primaryGoalMatch;
    total += WEIGHTS.primaryGoalMatch;
  }

  const normalizedCategory = typeof scenario.category === 'string'
    ? scenario.category.trim().toLowerCase()
    : '';
  if (normalizedCategory && underPracticed.has(normalizedCategory)) {
    breakdown.underPracticedCategoryBonus = WEIGHTS.underPracticedCategoryBonus;
    total += WEIGHTS.underPracticedCategoryBonus;
  }

  const hasRepeatedMistake = scenarioMistakes.some((mistake) => repeatedMistakes.has(mistake));
  if (hasRepeatedMistake) {
    breakdown.repeatedMistakeRelevanceBonus = WEIGHTS.repeatedMistakeRelevanceBonus;
    total += WEIGHTS.repeatedMistakeRelevanceBonus;
  }

  return {
    scenario,
    score: total,
    breakdown,
  };
};

export const buildScenarioRecommendation = (scenarios, context) => {
  const candidateScenarios = Array.isArray(scenarios) ? scenarios : [];

  const filtered = candidateScenarios.filter((scenario) => {
    if (context.is_premium_user) return true;
    return scenario.is_premium !== true;
  });

  const ranked = filtered
    .map((scenario) => {
      const scored = scoreScenario(scenario, context);
      return {
        ...scored,
        tieBreaker: tieBreakerValue(context.user_id, context.date, scenario.id),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.tieBreaker - right.tieBreaker;
    });

  return {
    selected: ranked[0] ?? null,
    ranked,
  };
};
