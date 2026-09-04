"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Building,
  Calendar,
  IndianRupee,
  Link2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { AdminGuard } from "@/components/common/route-guard";
import { useScholarshipStore } from "@/hooks/use-scholarship-store";
import { Scholarship, EligibilityRule, ScholarshipDocument } from "@/types/scholarship";
import { FIELDS_OF_STUDY, EDUCATION_LEVELS, SOCIAL_CATEGORIES } from "@/types/profile";
import { RuleBuilder } from "@/components/admin/rule-builder";
import { DocumentEditor } from "@/components/admin/document-editor";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SAMPLE_NEW_SCHOLARSHIP = {
  name: "State STEM Excellence Fellowship",
  provider: "State Higher Education Council",
  description:
    "Merit fellowship designed to incentivize high-performing students pursuing undergraduate courses in Science, Technology, Engineering, and Mathematics.",
  amountDescription: "₹60,000 per annum",
  amountValue: 60000,
  deadline: "2026-11-30",
  officialNoticeUrl: "https://highereducation.gov.in/fellowships/stem-excellence",
  fieldOfStudy: ["Engineering & Technology", "Pure & Applied Sciences"],
  educationLevel: ["undergraduate"] as ("undergraduate" | "postgraduate" | "diploma" | "school")[],
  incomeLimit: 600000,
  genderRestriction: "all" as const,
  categoryRestriction: "All" as const,
  rules: [
    {
      id: "rule-sample-1",
      fieldName: "cgpa",
      operator: "GTE" as const,
      expectedValue: 7.5,
      isMandatory: true,
      ruleDescription: "Current CGPA must be ≥ 7.5 / 10.0",
    },
    {
      id: "rule-sample-2",
      fieldName: "familyIncome",
      operator: "LTE" as const,
      expectedValue: 600000,
      isMandatory: true,
      ruleDescription: "Annual family income must not exceed ₹6,00,000",
    },
    {
      id: "rule-sample-3",
      fieldName: "fieldOfStudy",
      operator: "IN" as const,
      expectedValue: ["Engineering & Technology", "Pure & Applied Sciences"],
      isMandatory: true,
      ruleDescription: "Enrolled in STEM disciplines",
    },
  ],
  documents: [
    {
      id: "doc-sample-1",
      documentName: "Income Certificate (Current FY)",
      isMandatory: true,
      instructions: "Issued by Tehsildar or competent Revenue Officer",
    },
    {
      id: "doc-sample-2",
      documentName: "College Bonafide Certificate",
      isMandatory: true,
      instructions: "Certified by College Registrar",
    },
    {
      id: "doc-sample-3",
      documentName: "Previous Semester Marksheet",
      isMandatory: true,
    },
  ],
};

export default function CreateScholarshipPage() {
  const router = useRouter();
  const { addScholarship } = useScholarshipStore();

  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [amountDescription, setAmountDescription] = useState("");
  const [amountValue, setAmountValue] = useState<number | "">("");
  const [deadline, setDeadline] = useState("");
  const [officialNoticeUrl, setOfficialNoticeUrl] = useState("");
  const [incomeLimit, setIncomeLimit] = useState<number | "">("");
  const [genderRestriction, setGenderRestriction] = useState<"all" | "female" | "male">("all");
  const [categoryRestriction, setCategoryRestriction] = useState<"All" | "General" | "OBC" | "SC" | "ST" | "EWS">("All");
  const [selectedFields, setSelectedFields] = useState<string[]>(["Engineering & Technology"]);
  const [selectedLevels, setSelectedLevels] = useState<("undergraduate" | "postgraduate" | "diploma" | "school")[]>(["undergraduate"]);

  const [rules, setRules] = useState<EligibilityRule[]>([
    {
      id: "rule-1",
      fieldName: "cgpa",
      operator: "GTE",
      expectedValue: 7.0,
      isMandatory: true,
      ruleDescription: "Current CGPA must be ≥ 7.0",
    },
    {
      id: "rule-2",
      fieldName: "familyIncome",
      operator: "LTE",
      expectedValue: 500000,
      isMandatory: true,
      ruleDescription: "Family Annual Income must be ≤ ₹5,00,000",
    },
  ]);

  const [documents, setDocuments] = useState<ScholarshipDocument[]>([
    {
      id: "doc-1",
      documentName: "Income Certificate",
      isMandatory: true,
      instructions: "Issued by authorized revenue official",
    },
    {
      id: "doc-2",
      documentName: "Previous Exam Marksheet",
      isMandatory: true,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreFill = () => {
    setName(SAMPLE_NEW_SCHOLARSHIP.name);
    setProvider(SAMPLE_NEW_SCHOLARSHIP.provider);
    setDescription(SAMPLE_NEW_SCHOLARSHIP.description);
    setAmountDescription(SAMPLE_NEW_SCHOLARSHIP.amountDescription);
    setAmountValue(SAMPLE_NEW_SCHOLARSHIP.amountValue);
    setDeadline(SAMPLE_NEW_SCHOLARSHIP.deadline);
    setOfficialNoticeUrl(SAMPLE_NEW_SCHOLARSHIP.officialNoticeUrl);
    setIncomeLimit(SAMPLE_NEW_SCHOLARSHIP.incomeLimit);
    setGenderRestriction(SAMPLE_NEW_SCHOLARSHIP.genderRestriction);
    setCategoryRestriction(SAMPLE_NEW_SCHOLARSHIP.categoryRestriction);
    setSelectedFields(SAMPLE_NEW_SCHOLARSHIP.fieldOfStudy);
    setSelectedLevels(SAMPLE_NEW_SCHOLARSHIP.educationLevel);
    setRules(SAMPLE_NEW_SCHOLARSHIP.rules);
    setDocuments(SAMPLE_NEW_SCHOLARSHIP.documents);
    setError(null);
  };

  const toggleFieldOfStudy = (fld: string) => {
    setSelectedFields((prev) =>
      prev.includes(fld) ? prev.filter((f) => f !== fld) : [...prev, fld]
    );
  };

  const toggleEducationLevel = (lvl: "undergraduate" | "postgraduate" | "diploma" | "school") => {
    setSelectedLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !provider.trim() || !description.trim() || !deadline || !officialNoticeUrl.trim()) {
      setError("Please fill in all required basic fields.");
      return;
    }

    if (rules.length === 0) {
      setError("Please define at least one eligibility rule.");
      return;
    }

    if (documents.length === 0) {
      setError("Please add at least one required document.");
      return;
    }

    setIsSubmitting(true);
    const newScholarship: Scholarship = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      provider: provider.trim(),
      description: description.trim(),
      amountDescription: amountDescription.trim() || "Financial Grant",
      amountValue: typeof amountValue === "number" ? amountValue : 50000,
      deadline,
      officialNoticeUrl: officialNoticeUrl.trim(),
      fieldOfStudy: selectedFields.length > 0 ? selectedFields : ["All Disciplines"],
      educationLevel: selectedLevels.length > 0 ? selectedLevels : ["undergraduate"],
      incomeLimit: typeof incomeLimit === "number" ? incomeLimit : undefined,
      genderRestriction,
      categoryRestriction,
      rules,
      documents,
      createdAt: new Date().toISOString().split("T")[0],
    };

    await addScholarship(newScholarship);
    setIsSubmitting(false);
    router.push("/admin");
  };

  return (
    <AdminGuard>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-neutral-600 hover:text-black"
          >
            <ChevronLeft className="h-4 w-4 stroke-[3]" />
            Back to Admin Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
            <div>
              <h1 className="text-3xl font-black font-display text-black">
                Add New Scholarship Listing
              </h1>
              <p className="text-xs font-medium text-neutral-600">
                Define the listing details, structured deterministic rules, and required checklist.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePreFill}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-neo-green px-3.5 py-2 text-xs font-black uppercase tracking-wider text-black shadow-neo-sm hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all self-start sm:self-auto"
            >
              <Zap className="h-3.5 w-3.5 stroke-[3]" />
              1-Click Pre-fill Sample
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border-2 border-neo-red bg-neo-red/15 p-4 shadow-neo-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 stroke-[2.5] text-neo-red shrink-0" />
            <span className="text-xs font-bold text-black">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Information */}
          <Card variant="white" className="border-2 border-black shadow-neo">
            <CardHeader className="bg-[#FAF7F2] rounded-t-2xl pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-neo-yellow shadow-neo-sm">
                  <Building className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <CardTitle className="text-lg">1. Basic Scholarship Details</CardTitle>
                  <CardDescription>
                    Public information visible to all searching students.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Scholarship Name"
                  placeholder="e.g. State STEM Excellence Fellowship"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Providing Organization / Institution"
                  placeholder="e.g. State Higher Education Council"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black font-display mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain the background, purpose, and key provisions of this scholarship..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border-2 border-black bg-white p-3 text-sm font-medium text-black shadow-neo-sm focus:outline-none focus:shadow-neo"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Grant Amount / Benefits (Text)"
                  placeholder="e.g. ₹60,000 per annum"
                  value={amountDescription}
                  onChange={(e) => setAmountDescription(e.target.value)}
                  required
                />

                <Input
                  label="Approx. Annual Value (INR for Sorting)"
                  type="number"
                  placeholder="e.g. 60000"
                  value={amountValue}
                  onChange={(e) =>
                    setAmountValue(e.target.value ? Number(e.target.value) : "")
                  }
                  required
                />

                <Input
                  label="Application Deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Circular / Notice Reference URL"
                  type="url"
                  placeholder="https://scholarships.gov.in/notice.pdf"
                  value={officialNoticeUrl}
                  onChange={(e) => setOfficialNoticeUrl(e.target.value)}
                  required
                />

                <Input
                  label="Maximum Annual Family Income Ceiling (INR, optional)"
                  type="number"
                  placeholder="e.g. 600000"
                  value={incomeLimit}
                  onChange={(e) =>
                    setIncomeLimit(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>

              {/* Gender and Category Quotas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/10">
                <Select
                  label="Gender Restriction"
                  value={genderRestriction}
                  onChange={(e) =>
                    setGenderRestriction(e.target.value as "all" | "female" | "male")
                  }
                >
                  <option value="all">Open to All Genders</option>
                  <option value="female">Exclusively for Female Students</option>
                  <option value="male">Exclusively for Male Students</option>
                </Select>

                <Select
                  label="Social Category Quota"
                  value={categoryRestriction}
                  onChange={(e) =>
                    setCategoryRestriction(
                      e.target.value as "All" | "General" | "OBC" | "SC" | "ST" | "EWS"
                    )
                  }
                >
                  <option value="All">All Categories Eligible</option>
                  {SOCIAL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Education Levels Checkboxes */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-black uppercase tracking-wider text-black font-display">
                  Eligible Education Levels
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["undergraduate", "Undergraduate"],
                      ["postgraduate", "Postgraduate"],
                      ["diploma", "Diploma"],
                      ["school", "Higher Secondary"],
                    ] as const
                  ).map(([lvlKey, lvlLabel]) => (
                    <button
                      key={lvlKey}
                      type="button"
                      onClick={() => toggleEducationLevel(lvlKey)}
                      className={`rounded-lg border-2 border-black py-1.5 px-3 text-xs font-black transition-all ${
                        selectedLevels.includes(lvlKey)
                          ? "bg-neo-yellow text-black shadow-neo-sm -translate-y-0.5"
                          : "bg-white text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {lvlLabel}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Structured Eligibility Rules */}
          <Card variant="white" className="border-2 border-black shadow-neo">
            <CardContent className="pt-6">
              <RuleBuilder rules={rules} onChange={setRules} />
            </CardContent>
          </Card>

          {/* Section 3: Required Documents */}
          <Card variant="white" className="border-2 border-black shadow-neo">
            <CardContent className="pt-6">
              <DocumentEditor documents={documents} onChange={setDocuments} />
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-black">
            <Link
              href="/admin"
              className="text-xs font-black uppercase text-neutral-600 hover:text-black hover:underline"
            >
              Cancel
            </Link>

            <Button
              type="submit"
              variant="yellow"
              size="lg"
              isLoading={isSubmitting}
              className="w-full sm:w-auto text-base px-8 py-4 shadow-neo-lg"
            >
              Publish Scholarship Listing ⚡
              <ArrowRight className="ml-2 h-5 w-5 stroke-[3]" />
            </Button>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}
