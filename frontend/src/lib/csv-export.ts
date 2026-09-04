import { Scholarship } from "@/types/scholarship";
import { getDaysRemaining } from "./utils";

export function exportScholarshipsToCSV(scholarships: Scholarship[]) {
  const headers = [
    "Scholarship Name",
    "Provider / Institution",
    "Amount / Benefits",
    "Application Deadline",
    "Status / Days Left",
    "Field of Study",
    "Education Level",
    "Income Ceiling (INR)",
    "Gender Eligibility",
    "Social Category",
    "Rules Count",
    "Required Documents",
    "Official Notice Reference",
  ];

  const escapeCSV = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return '""';
    const stringVal = String(value).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = scholarships.map((s) => {
    const daysInfo = getDaysRemaining(s.deadline);
    const rulesSummary = s.rules.map((r) => r.ruleDescription).join(" | ");
    const docsSummary = s.documents.map((d) => d.documentName).join(" | ");

    return [
      escapeCSV(s.name),
      escapeCSV(s.provider),
      escapeCSV(s.amountDescription),
      escapeCSV(s.deadline),
      escapeCSV(daysInfo.label),
      escapeCSV(s.fieldOfStudy.join(", ")),
      escapeCSV(s.educationLevel.join(", ")),
      escapeCSV(s.incomeLimit ? `₹${s.incomeLimit.toLocaleString("en-IN")}` : "No Limit"),
      escapeCSV(s.genderRestriction === "all" ? "Open to All" : s.genderRestriction),
      escapeCSV(s.categoryRestriction),
      escapeCSV(s.rules.length),
      escapeCSV(docsSummary),
      escapeCSV(s.officialNoticeUrl),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");

  // Trigger browser download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `scholarships_directory_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
