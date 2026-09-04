import { StudentProfile } from "@/types/profile";
import { EligibilityRule } from "@/types/scholarship";

export type RuleStatus = "PASS" | "FAIL" | "UNKNOWN";
export type Verdict = "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE";

export interface EvaluatedRuleResult {
  rule: EligibilityRule;
  status: RuleStatus;
  studentValueText: string;
  reason: string;
}

export interface EligibilityResult {
  verdict: Verdict;
  summary: string;
  evaluatedAt: string;
  results: EvaluatedRuleResult[];
}

export function evaluateEligibility(
  profile: StudentProfile,
  rules: EligibilityRule[]
): EligibilityResult {
  const evaluatedRules: EvaluatedRuleResult[] = rules.map((rule) => {
    const rawStudentVal = profile[rule.fieldName as keyof StudentProfile];

    // Check if missing / unknown
    if (
      rawStudentVal === undefined ||
      rawStudentVal === null ||
      rawStudentVal === ""
    ) {
      return {
        rule,
        status: "UNKNOWN",
        studentValueText: "Not provided in profile",
        reason: `Your profile does not specify ${String(rule.fieldName)}. Please verify your eligibility with the official notice.`,
      };
    }

    let isPassed = false;
    let studentValueDisplay = String(rawStudentVal);

    switch (rule.operator) {
      case "EQ": {
        if (typeof rawStudentVal === "boolean") {
          isPassed = rawStudentVal === (rule.expectedValue === true || rule.expectedValue === "true");
          studentValueDisplay = rawStudentVal ? "Yes" : "No";
        } else {
          isPassed =
            String(rawStudentVal).trim().toLowerCase() ===
            String(rule.expectedValue).trim().toLowerCase();
        }
        break;
      }

      case "NEQ": {
        isPassed =
          String(rawStudentVal).trim().toLowerCase() !==
          String(rule.expectedValue).trim().toLowerCase();
        break;
      }

      case "GTE": {
        const studentNum = Number(rawStudentVal);
        const expectedNum = Number(rule.expectedValue);
        isPassed = studentNum >= expectedNum;
        studentValueDisplay = String(studentNum);
        break;
      }

      case "LTE": {
        const studentNum = Number(rawStudentVal);
        const expectedNum = Number(rule.expectedValue);
        isPassed = studentNum <= expectedNum;
        if (studentNum >= 1000) {
          studentValueDisplay = `₹${studentNum.toLocaleString("en-IN")}`;
        }
        break;
      }

      case "GT": {
        isPassed = Number(rawStudentVal) > Number(rule.expectedValue);
        break;
      }

      case "LT": {
        isPassed = Number(rawStudentVal) < Number(rule.expectedValue);
        break;
      }

      case "IN": {
        const expectedList = Array.isArray(rule.expectedValue)
          ? rule.expectedValue.map((v) => String(v).trim().toLowerCase())
          : String(rule.expectedValue)
              .split(",")
              .map((v) => v.trim().toLowerCase());

        const studentValStr = String(rawStudentVal).trim().toLowerCase();
        isPassed = expectedList.includes(studentValStr);
        break;
      }

      case "CONTAINS": {
        isPassed = String(rawStudentVal)
          .toLowerCase()
          .includes(String(rule.expectedValue).toLowerCase());
        break;
      }

      default:
        isPassed = false;
    }

    const status: RuleStatus = isPassed ? "PASS" : "FAIL";

    let reason = "";
    if (status === "PASS") {
      reason = `Satisfies requirement (${rule.ruleDescription}).`;
    } else {
      if (rule.operator === "GTE") {
        reason = `Your value (${studentValueDisplay}) is below the required minimum (${rule.expectedValue}).`;
      } else if (rule.operator === "LTE") {
        reason = `Your value (${studentValueDisplay}) exceeds the maximum permissible limit (${rule.expectedValue}).`;
      } else {
        reason = `Your profile value (${studentValueDisplay}) does not match the requirement.`;
      }
    }

    return {
      rule,
      status,
      studentValueText: studentValueDisplay,
      reason,
    };
  });

  // Calculate overall verdict
  const hasMandatoryFail = evaluatedRules.some(
    (r) => r.rule.isMandatory && r.status === "FAIL"
  );
  const hasMandatoryUnknown = evaluatedRules.some(
    (r) => r.rule.isMandatory && r.status === "UNKNOWN"
  );

  let verdict: Verdict = "ELIGIBLE";
  let summary = "You satisfy all evaluated mandatory eligibility criteria.";

  if (hasMandatoryFail) {
    verdict = "NOT_ELIGIBLE";
    summary = "You do not meet one or more mandatory eligibility requirements.";
  } else if (hasMandatoryUnknown) {
    verdict = "POSSIBLY_ELIGIBLE";
    summary =
      "You may qualify, but some requirements could not be definitively determined from your profile data. Please verify the official notice.";
  }

  return {
    verdict,
    summary,
    evaluatedAt: new Date().toISOString(),
    results: evaluatedRules,
  };
}
