import type {
  EligibilityReport,
  EligibilityRule,
  EligibilityVerdict,
  EvaluationStatus,
  RuleOperator,
  RuleResult,
  StudentProfile,
} from '../../types';

/**
 * Format currency to INR format (e.g. ₹5,00,000)
 */
function formatCurrency(amount: number): string {
  try {
    return `₹${amount.toLocaleString('en-IN')}`;
  } catch {
    return `₹${amount}`;
  }
}

/**
 * Parse expected values for list-based operators (IN)
 */
function parseExpectedList(expected: string): string[] {
  const trimmed = expected.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim().toLowerCase());
      }
    } catch {
      // fallback to comma split
    }
  }
  return trimmed
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Extract field value from student profile
 */
export function getProfileFieldValue(
  profile: Partial<StudentProfile> | null | undefined,
  fieldName: string
): { value: unknown; isMissing: boolean } {
  if (!profile) {
    return { value: null, isMissing: true };
  }

  const rawValue = (profile as Record<string, unknown>)[fieldName];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return { value: null, isMissing: true };
  }

  return { value: rawValue, isMissing: false };
}

/**
 * Format expected display value for readability
 */
function formatExpectedDisplay(field: string, operator: RuleOperator, expected: string): string {
  if (field === 'family_income' && !isNaN(Number(expected))) {
    const num = Number(expected);
    if (operator === 'LTE') return `<= ${formatCurrency(num)}`;
    if (operator === 'LT') return `< ${formatCurrency(num)}`;
    if (operator === 'GTE') return `>= ${formatCurrency(num)}`;
    if (operator === 'GT') return `> ${formatCurrency(num)}`;
    return formatCurrency(num);
  }

  if (field === 'cgpa' && !isNaN(Number(expected))) {
    if (operator === 'GTE') return `>= ${expected}`;
    if (operator === 'GT') return `> ${expected}`;
    if (operator === 'LTE') return `<= ${expected}`;
    if (operator === 'LT') return `< ${expected}`;
    return expected;
  }

  if (field === 'is_pwd') {
    return expected === '1' || expected.toLowerCase() === 'true' ? 'Yes (PwD)' : 'No';
  }

  return expected;
}

/**
 * Format actual display value for readability
 */
function formatActualDisplay(field: string, value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (field === 'family_income' && typeof value === 'number') {
    return formatCurrency(value);
  }
  if (field === 'is_pwd') {
    return value === 1 || value === true ? 'Yes' : 'No';
  }
  return value as string | number | boolean;
}

/**
 * Evaluate a single operator deterministically
 */
export function evaluateOperator(
  actualValue: unknown,
  operator: RuleOperator,
  expectedValue: string
): boolean {
  const normExpected = expectedValue.trim();

  // Boolean handling for fields like is_pwd
  if (typeof actualValue === 'boolean' || (typeof actualValue === 'number' && (actualValue === 0 || actualValue === 1) && (normExpected === '0' || normExpected === '1' || normExpected.toLowerCase() === 'true' || normExpected.toLowerCase() === 'false'))) {
    const actualBool = Boolean(actualValue);
    const expectedBool = normExpected === '1' || normExpected.toLowerCase() === 'true';
    if (operator === 'EQ') return actualBool === expectedBool;
    if (operator === 'NEQ') return actualBool !== expectedBool;
  }

  // Numeric comparisons
  const actualNum = Number(actualValue);
  const expectedNum = Number(normExpected);
  const isBothNumeric = !isNaN(actualNum) && !isNaN(expectedNum) && actualValue !== '' && normExpected !== '';

  if (isBothNumeric) {
    switch (operator) {
      case 'EQ':
        return actualNum === expectedNum;
      case 'NEQ':
        return actualNum !== expectedNum;
      case 'GTE':
        return actualNum >= expectedNum;
      case 'LTE':
        return actualNum <= expectedNum;
      case 'GT':
        return actualNum > expectedNum;
      case 'LT':
        return actualNum < expectedNum;
      default:
        break;
    }
  }

  // String comparisons
  const actualStr = String(actualValue).trim().toLowerCase();
  const expectedStr = normExpected.toLowerCase();

  switch (operator) {
    case 'EQ':
      return actualStr === expectedStr;
    case 'NEQ':
      return actualStr !== expectedStr;
    case 'IN': {
      const list = parseExpectedList(normExpected);
      // If student value matches any of expected items
      if (list.includes(actualStr)) return true;
      // Also handles if expected item is "All India" or similar wildcard
      if (list.includes('all india') || list.includes('all')) return true;
      return false;
    }
    case 'CONTAINS':
      return actualStr.includes(expectedStr) || expectedStr.includes(actualStr);
    case 'GTE':
    case 'LTE':
    case 'GT':
    case 'LT':
      return isBothNumeric ? false : false;
    default:
      return false;
  }
}

/**
 * Generate human-readable reason for evaluation outcome
 */
function generateReason(
  field: string,
  operator: RuleOperator,
  expected: string,
  actual: unknown,
  status: EvaluationStatus,
  description: string
): string {
  if (status === 'UNKNOWN') {
    return `The scholarship requires ${field}, but this information is not available in your profile. Please verify with the official notice.`;
  }

  if (field === 'family_income') {
    const actualFormatted = formatCurrency(Number(actual));
    const expectedFormatted = formatCurrency(Number(expected));
    if (status === 'PASS') {
      return `Your annual income (${actualFormatted}) is within the required limit (${operator === 'LTE' ? '<= ' : ''}${expectedFormatted}).`;
    }
    return `Your annual income (${actualFormatted}) exceeds the required limit of ${expectedFormatted}.`;
  }

  if (field === 'cgpa') {
    if (status === 'PASS') {
      return `Your CGPA (${actual}) satisfies the minimum requirement of ${expected}.`;
    }
    return `Your CGPA (${actual}) is below the required threshold of ${expected}.`;
  }

  if (field === 'domicile_state') {
    if (status === 'PASS') {
      return `Your domicile state (${actual}) satisfies the residency requirement (${expected}).`;
    }
    return `Your domicile state (${actual}) does not match the eligible states (${expected}).`;
  }

  if (field === 'category') {
    if (status === 'PASS') {
      return `Your category (${actual}) is eligible for this scholarship.`;
    }
    return `Your category (${actual}) is not among the eligible categories (${expected}).`;
  }

  if (field === 'gender') {
    if (status === 'PASS') {
      return `Your gender (${actual}) satisfies the eligibility criteria.`;
    }
    return `This scholarship is specified for ${expected} applicants (your profile: ${actual}).`;
  }

  if (field === 'is_pwd') {
    const actualLabel = actual === 1 || actual === true ? 'Yes' : 'No';
    if (status === 'PASS') {
      return `PwD status condition satisfied.`;
    }
    return `This scholarship requires PwD status (your profile: ${actualLabel}).`;
  }

  if (status === 'PASS') {
    return `Criterion met: ${description || `${field} matches ${expected}`}.`;
  }
  return `Criterion not met: ${description || `${field} must match ${expected}`}.`;
}

/**
 * Evaluate a single rule against a student profile
 */
export function evaluateRule(rule: EligibilityRule, profile: Partial<StudentProfile> | null): RuleResult {
  const { value: actualValue, isMissing } = getProfileFieldValue(profile, rule.field_name);

  const expectedDisplay = formatExpectedDisplay(rule.field_name, rule.operator, rule.expected_value);

  if (isMissing) {
    return {
      ruleId: rule.id,
      field: rule.field_name,
      description: rule.rule_description,
      expected: expectedDisplay,
      actual: null,
      status: 'UNKNOWN',
      reason: generateReason(
        rule.field_name,
        rule.operator,
        rule.expected_value,
        null,
        'UNKNOWN',
        rule.rule_description
      ),
    };
  }

  const isPassed = evaluateOperator(actualValue, rule.operator, rule.expected_value);
  const status: EvaluationStatus = isPassed ? 'PASS' : 'FAIL';
  const actualDisplay = formatActualDisplay(rule.field_name, actualValue);

  return {
    ruleId: rule.id,
    field: rule.field_name,
    description: rule.rule_description,
    expected: expectedDisplay,
    actual: actualDisplay,
    status,
    reason: generateReason(
      rule.field_name,
      rule.operator,
      rule.expected_value,
      actualValue,
      status,
      rule.rule_description
    ),
  };
}

/**
 * Aggregate evaluations into final verdict according to Phase B6.3
 */
export function evaluateEligibility(
  profile: Partial<StudentProfile> | null,
  rules: EligibilityRule[]
): EligibilityReport {
  const evaluatedAt = new Date().toISOString();

  if (!rules || rules.length === 0) {
    return {
      verdict: 'ELIGIBLE',
      summary: 'No specific restrictions are defined for this scholarship.',
      evaluatedAt,
      ruleDetails: [],
    };
  }

  const ruleDetails: RuleResult[] = [];
  let hasMandatoryFail = false;
  let hasMandatoryUnknown = false;

  for (const rule of rules) {
    const result = evaluateRule(rule, profile);
    ruleDetails.push(result);

    const isMandatory = rule.is_mandatory === 1;

    if (isMandatory) {
      if (result.status === 'FAIL') {
        hasMandatoryFail = true;
      } else if (result.status === 'UNKNOWN') {
        hasMandatoryUnknown = true;
      }
    }
  }

  let verdict: EligibilityVerdict;
  let summary: string;

  if (hasMandatoryFail) {
    verdict = 'NOT_ELIGIBLE';
    summary = 'You do not meet one or more mandatory requirements for this scholarship.';
  } else if (hasMandatoryUnknown) {
    verdict = 'POSSIBLY_ELIGIBLE';
    summary = 'You may be eligible, but some requirements could not be confirmed from your profile data. Please verify the original notice.';
  } else {
    verdict = 'ELIGIBLE';
    summary = 'You satisfy all evaluated eligibility requirements for this scholarship.';
  }

  return {
    verdict,
    summary,
    evaluatedAt,
    ruleDetails,
  };
}
