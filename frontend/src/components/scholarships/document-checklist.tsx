"use client";

import React from "react";
import { FileCheck, AlertCircle, Info } from "lucide-react";
import { ScholarshipDocument } from "@/types/scholarship";
import { useDocumentChecklist } from "@/hooks/use-document-checklist";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface DocumentChecklistProps {
  scholarshipId: string;
  documents: ScholarshipDocument[];
}

export function DocumentChecklist({
  scholarshipId,
  documents,
}: DocumentChecklistProps) {
  const {
    completedIds,
    toggleItem,
    completedCount,
    totalCount,
    progressPercentage,
  } = useDocumentChecklist(scholarshipId, documents);

  return (
    <Card variant="white" className="shadow-neo border-2 border-black">
      <CardHeader className="bg-[#FAF7F2] rounded-t-2xl pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-neo-yellow shadow-neo-sm">
              <FileCheck className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <CardTitle className="text-xl">Required Document Checklist</CardTitle>
              <CardDescription>
                Track your document preparation progress before applying.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={progressPercentage === 100 ? "pass" : "yellow"}
              size="md"
            >
              {completedCount} of {totalCount} Ready ({progressPercentage}%)
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-3">
          <div className="h-3 w-full rounded-full border-2 border-black bg-neutral-100 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-neo-green transition-all duration-300 border border-black/20"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Document Items */}
        <div className="space-y-3">
          {documents.map((doc, idx) => {
            const isDone = completedIds.includes(doc.id);

            return (
              <div
                key={doc.id}
                onClick={() => toggleItem(doc.id)}
                className={`flex items-start justify-between gap-3 p-4 rounded-xl border-2 border-black transition-all cursor-pointer select-none ${
                  isDone
                    ? "bg-[#E6FCF0] shadow-neo-sm"
                    : "bg-white shadow-neo-sm hover:bg-neutral-50 hover:shadow-neo"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => toggleItem(doc.id)}
                    aria-label={`Toggle ${doc.documentName}`}
                    className="mt-0.5"
                  />
                  <div>
                    <span
                      className={`text-sm font-bold block ${
                        isDone
                          ? "line-through text-neutral-500"
                          : "text-black"
                      }`}
                    >
                      {idx + 1}. {doc.documentName}
                    </span>
                    {doc.instructions && (
                      <p className="text-xs text-neutral-600 mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0 text-neutral-500" />
                        {doc.instructions}
                      </p>
                    )}
                  </div>
                </div>

                <Badge
                  variant={doc.isMandatory ? "dark" : "default"}
                  size="sm"
                  className="shrink-0 text-[10px]"
                >
                  {doc.isMandatory ? "Mandatory" : "Optional"}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Disclaimer Notice */}
        <div className="flex items-start gap-2.5 rounded-xl border-2 border-black bg-[#FFF9E6] p-3 text-xs font-bold text-black shadow-neo-sm mt-4">
          <AlertCircle className="h-4 w-4 shrink-0 stroke-[2.5] text-black mt-0.5" />
          <p>
            <strong>Personal Preparation Only:</strong> This checklist helps you organize required certificates. The portal does not collect, store, or submit your documents to the scholarship provider.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
