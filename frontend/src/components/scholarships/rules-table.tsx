import React from "react";
import { Scale, CheckCircle, AlertTriangle } from "lucide-react";
import { EligibilityRule } from "@/types/scholarship";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface RulesTableProps {
  rules: EligibilityRule[];
}

export function RulesTable({ rules }: RulesTableProps) {
  const getOperatorLabel = (op: string) => {
    switch (op) {
      case "EQ":
        return "=";
      case "NEQ":
        return "≠";
      case "GTE":
        return "≥";
      case "LTE":
        return "≤";
      case "GT":
        return ">";
      case "LT":
        return "<";
      case "IN":
        return "One of";
      case "CONTAINS":
        return "Contains";
      default:
        return op;
    }
  };

  const formatExpectedValue = (val: string | number | boolean | string[]) => {
    if (Array.isArray(val)) {
      return val.join(", ");
    }
    if (typeof val === "boolean") {
      return val ? "Yes" : "No";
    }
    if (typeof val === "number" && val >= 1000) {
      return `₹${val.toLocaleString("en-IN")}`;
    }
    return String(val);
  };

  return (
    <Card variant="white" className="shadow-neo border-2 border-black">
      <CardHeader className="bg-[#FAF7F2] rounded-t-2xl pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-neo-pink shadow-neo-sm">
            <Scale className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <CardTitle className="text-xl">Visible Eligibility Rules</CardTitle>
            <CardDescription>
              Deterministic criteria defined by the scholarship provider.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-3">
        <div className="space-y-2.5">
          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border-2 border-black bg-white shadow-neo-sm hover:bg-neutral-50 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-neutral-500">
                    Rule #{idx + 1}
                  </span>
                  <span className="font-display font-black text-sm text-black">
                    {rule.ruleDescription}
                  </span>
                </div>

                {/* Structured condition definition */}
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-neutral-700 pt-0.5">
                  <span className="bg-[#FAF7F2] px-2 py-0.5 rounded border border-black/20">
                    {String(rule.fieldName)}
                  </span>
                  <span className="bg-neo-yellow/30 px-1.5 py-0.5 rounded border border-black/20 font-black">
                    {getOperatorLabel(rule.operator)}
                  </span>
                  <span className="bg-neutral-100 px-2 py-0.5 rounded border border-black/20 font-black text-black">
                    {formatExpectedValue(rule.expectedValue)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <Badge
                  variant={rule.isMandatory ? "dark" : "default"}
                  size="sm"
                  className="text-[10px]"
                >
                  {rule.isMandatory ? "Mandatory Requirement" : "Preferred"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
