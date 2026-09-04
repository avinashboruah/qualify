"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Scholarship } from "@/types/scholarship";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/context/auth-context";
import {
  evaluateEligibility,
  EligibilityResult,
} from "@/lib/eligibility-evaluator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface EligibilityCheckWidgetProps {
  scholarship: Scholarship;
}

export function EligibilityCheckWidget({
  scholarship,
}: EligibilityCheckWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const { profile, completeness } = useProfile();

  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const handleCheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      const evaluation = evaluateEligibility(profile, scholarship.rules);
      setResult(evaluation);
      setIsChecking(false);
    }, 400);
  };

  const isProfileIncomplete = completeness < 50;

  return (
    <Card variant="white" className="border-3 border-black shadow-neo-lg">
      <CardHeader className="bg-[#FFF9E6] rounded-t-2xl pb-4 border-b-2 border-black">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-neo-yellow shadow-neo-sm">
              <Sparkles className="h-4 w-4 stroke-[2.5]" />
            </div>
            <CardTitle className="text-lg">Deterministic Checker</CardTitle>
          </div>
          <Badge variant="dark" size="sm">
            Live Engine
          </Badge>
        </div>
        <CardDescription className="text-xs text-neutral-700">
          Match your profile values against these exact rules. Zero estimation.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Profile Status Chip */}
        <div className="flex items-center justify-between rounded-xl border-2 border-black bg-[#FAF7F2] p-3 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-black" />
            <span className="font-bold text-neutral-800">
              Profile:{" "}
              <strong>
                {profile.fullName ? profile.fullName : "Guest Student"}
              </strong>
            </span>
          </div>
          <span className="font-mono font-black text-black">
            {completeness}% Ready
          </span>
        </div>

        {isProfileIncomplete && (
          <div className="rounded-xl border-2 border-neo-yellow bg-neo-yellow/20 p-3 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 stroke-[2.5] text-black shrink-0 mt-0.5" />
              <span className="font-bold text-black">
                Your profile is missing key details (income, domicile, or CGPA).
              </span>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 text-[11px] font-black underline text-black hover:text-neutral-800"
            >
              Update profile for accurate checking <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Evaluation Trigger Button */}
        <Button
          variant="yellow"
          size="lg"
          isLoading={isChecking}
          onClick={handleCheck}
          className="w-full text-sm font-black py-4 shadow-neo hover:shadow-neo-lg"
        >
          ⚡ Check My Eligibility
        </Button>

        {/* Verdict Results Display */}
        {result && (
          <div className="pt-4 space-y-4 animate-in fade-in duration-200 border-t-2 border-black/10">
            {/* Verdict Stamp Banner */}
            {result.verdict === "ELIGIBLE" && (
              <div className="rounded-xl border-3 border-black bg-neo-green/20 p-4 shadow-neo">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="mint" size="md">
                    ✓ ELIGIBLE
                  </Badge>
                  <span className="text-xs font-black text-black uppercase">
                    All Criteria Passed
                  </span>
                </div>
                <p className="text-xs font-bold text-neutral-800">
                  {result.summary}
                </p>
              </div>
            )}

            {result.verdict === "NOT_ELIGIBLE" && (
              <div className="rounded-xl border-3 border-black bg-neo-red/20 p-4 shadow-neo">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="fail" size="md">
                    ✗ NOT ELIGIBLE
                  </Badge>
                  <span className="text-xs font-black text-black uppercase">
                    Requirements Unmet
                  </span>
                </div>
                <p className="text-xs font-bold text-neutral-800">
                  {result.summary}
                </p>
              </div>
            )}

            {result.verdict === "POSSIBLY_ELIGIBLE" && (
              <div className="rounded-xl border-3 border-black bg-neo-yellow/30 p-4 shadow-neo">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="unknown" size="md">
                    ? POSSIBLY ELIGIBLE
                  </Badge>
                  <span className="text-xs font-black text-black uppercase">
                    Information Missing
                  </span>
                </div>
                <p className="text-xs font-bold text-neutral-800">
                  {result.summary}
                </p>
              </div>
            )}

            {/* Rule-by-Rule Breakdown Stack */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-black uppercase tracking-wider text-black block">
                Deterministic Rule Trace
              </span>

              {result.results.map((r, i) => (
                <div
                  key={r.rule.id}
                  className="rounded-xl border-2 border-black bg-white p-3 shadow-neo-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-display text-xs font-bold text-black">
                      {r.status === "PASS" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      {r.status === "FAIL" && (
                        <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      {r.status === "UNKNOWN" && (
                        <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate max-w-[200px]">
                        {r.rule.ruleDescription}
                      </span>
                    </div>

                    <Badge
                      variant={
                        r.status === "PASS"
                          ? "mint"
                          : r.status === "FAIL"
                          ? "fail"
                          : "unknown"
                      }
                      size="sm"
                    >
                      {r.status}
                    </Badge>
                  </div>

                  <div className="text-[11px] font-mono text-neutral-600 bg-[#FAF7F2] p-1.5 rounded border border-black/10">
                    Your Profile: <strong>{r.studentValueText}</strong>
                  </div>

                  <p className="text-[11px] font-medium text-neutral-700">
                    {r.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
