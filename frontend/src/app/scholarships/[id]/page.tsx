import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  ExternalLink,
  IndianRupee,
  ShieldCheck,
  Building,
  GraduationCap,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { MOCK_SCHOLARSHIPS } from "@/data/mock-scholarships";
import { RulesTable } from "@/components/scholarships/rules-table";
import { DocumentChecklist } from "@/components/scholarships/document-checklist";
import { OfficialNoticeCard } from "@/components/scholarships/official-notice-card";
import { EligibilityCheckWidget } from "@/components/scholarships/eligibility-check-widget";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getDaysRemaining } from "@/lib/utils";

interface ScholarshipDetailsPageProps {
  params: {
    id: string;
  };
}

export function generateStaticParams() {
  return MOCK_SCHOLARSHIPS.map((scholarship) => ({
    id: scholarship.id,
  }));
}

import { CustomScholarshipLoader } from "@/components/scholarships/custom-scholarship-loader";

export default function ScholarshipDetailsPage({
  params,
}: ScholarshipDetailsPageProps) {
  const scholarship = MOCK_SCHOLARSHIPS.find((s) => s.id === params.id);

  if (!scholarship) {
    return <CustomScholarshipLoader id={params.id} />;
  }

  const daysInfo = getDaysRemaining(scholarship.deadline);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-bold text-neutral-600">
        <Link href="/scholarships" className="hover:text-black hover:underline">
          Scholarships
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-black font-black truncate max-w-xs sm:max-w-md">
          {scholarship.name}
        </span>
      </nav>

      {/* Top Hero Section */}
      <div className="rounded-2xl border-3 border-black bg-white p-6 sm:p-8 shadow-neo-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#FAF7F2] px-3 py-1 text-xs font-black uppercase tracking-wider text-black shadow-neo-sm">
                <Building className="h-3.5 w-3.5" />
                {scholarship.provider}
              </span>
              <Badge variant="mint" size="sm">
                Verified Listing
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-display text-black leading-tight">
              {scholarship.name}
            </h1>

            <p className="text-sm sm:text-base font-medium text-neutral-700 leading-relaxed">
              {scholarship.description}
            </p>
          </div>

          {/* Deadline & Official Notice Block */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  daysInfo.isExpired
                    ? "fail"
                    : daysInfo.days <= 10
                    ? "yellow"
                    : "yellow"
                }
                size="md"
                className="text-xs px-3 py-1.5"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                {daysInfo.label}
              </Badge>
            </div>
            <span className="text-xs font-bold text-neutral-500">
              Deadline: {new Date(scholarship.deadline).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Key Information Highlight Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t-2 border-black/10">
          <div className="rounded-xl border-2 border-black bg-[#FFF9E6] p-3 shadow-neo-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
              Grant Amount
            </span>
            <span className="font-display text-sm sm:text-base font-black text-black">
              {scholarship.amountDescription}
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white p-3 shadow-neo-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
              Education Level
            </span>
            <span className="font-display text-sm sm:text-base font-black text-black capitalize">
              {scholarship.educationLevel.join(", ")}
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white p-3 shadow-neo-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
              Income Ceiling
            </span>
            <span className="font-display text-sm sm:text-base font-black text-black">
              {scholarship.incomeLimit
                ? `≤ ₹${scholarship.incomeLimit.toLocaleString("en-IN")}`
                : "No Income Limit"}
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white p-3 shadow-neo-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
              Gender Quota
            </span>
            <span className="font-display text-sm sm:text-base font-black text-black capitalize">
              {scholarship.genderRestriction === "all"
                ? "Open to All"
                : scholarship.genderRestriction}
            </span>
          </div>
        </div>
      </div>

      {/* Main Body Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Rules & Document Checklist */}
        <div className="lg:col-span-7 space-y-8">
          {/* Structured Eligibility Rules */}
          <RulesTable rules={scholarship.rules} />

          {/* Interactive Document Checklist */}
          <DocumentChecklist
            scholarshipId={scholarship.id}
            documents={scholarship.documents}
          />
        </div>

        {/* Right Column (Sticky): Eligibility Checker & Official Notice */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          {/* Interactive Eligibility Evaluation Trigger Card */}
          <EligibilityCheckWidget scholarship={scholarship} />

          {/* Official Notice Link Box */}
          <OfficialNoticeCard
            officialNoticeUrl={scholarship.officialNoticeUrl}
            provider={scholarship.provider}
            scholarshipName={scholarship.name}
          />
        </div>
      </div>
    </div>
  );
}
