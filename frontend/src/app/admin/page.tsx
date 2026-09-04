"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Calendar,
  IndianRupee,
  Scale,
  FileCheck,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useScholarshipStore } from "@/hooks/use-scholarship-store";
import { AdminGuard } from "@/components/common/route-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { getDaysRemaining } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { scholarships, deleteScholarship, isLoading } = useScholarshipStore();
  const [scholarshipToDelete, setScholarshipToDelete] = useState<string | null>(null);

  const totalRules = scholarships.reduce((acc, s) => acc + s.rules.length, 0);

  const handleDeleteConfirm = () => {
    if (scholarshipToDelete) {
      deleteScholarship(scholarshipToDelete);
      setScholarshipToDelete(null);
    }
  };

  return (
    <AdminGuard>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="white" className="shadow-neo-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
                  Active Listings
                </span>
                <span className="text-3xl font-black font-display text-black">
                  {scholarships.length}
                </span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-neo-yellow shadow-neo-sm">
                <BookOpen className="h-5 w-5 stroke-[2.5]" />
              </div>
            </CardContent>
          </Card>

          <Card variant="white" className="shadow-neo-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
                  Deterministic Rules
                </span>
                <span className="text-3xl font-black font-display text-black">
                  {totalRules}
                </span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-neo-pink shadow-neo-sm">
                <Scale className="h-5 w-5 stroke-[2.5]" />
              </div>
            </CardContent>
          </Card>

          <Card variant="white" className="shadow-neo-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
                  Engine Status
                </span>
                <span className="text-xs font-black font-display text-emerald-700 flex items-center gap-1.5 mt-1">
                  <CheckCircle className="h-4 w-4 stroke-[2.5]" />
                  Deterministic Live
                </span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-neo-green shadow-neo-sm">
                <Shield className="h-5 w-5 stroke-[2.5]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scholarships Data Table */}
        <Card variant="white" className="border-3 border-black shadow-neo-lg overflow-hidden">
          <CardHeader className="bg-[#FAF7F2] border-b-2 border-black py-4 px-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <CardTitle className="text-xl font-black">Published Scholarship Listings</CardTitle>
                  <Badge variant="dark" size="sm">
                    {scholarships.length} Listings
                  </Badge>
                </div>
                <CardDescription className="text-xs font-medium text-neutral-600 mt-0.5">
                  Listings currently available to students for discovery and rule evaluation.
                </CardDescription>
              </div>

              <Link href="/admin/scholarships/new">
                <Button
                  variant="yellow"
                  size="sm"
                  className="text-xs font-black py-2 px-4 shadow-neo-sm hover:shadow-neo shrink-0"
                >
                  <Plus className="mr-1.5 h-4 w-4 stroke-[3]" />
                  Add New Scholarship
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-[#FFF9E6] text-[11px] font-black uppercase tracking-wider text-black">
                  <th className="p-4">Scholarship Name & Provider</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Amount / Benefits</th>
                  <th className="p-4">Rules</th>
                  <th className="p-4">Documents</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 text-xs">
                {scholarships.map((s) => {
                  const daysInfo = getDaysRemaining(s.deadline);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-[#FAF7F2] transition-colors font-medium text-black"
                    >
                      <td className="p-4">
                        <span className="font-bold font-display text-sm block">
                          {s.name}
                        </span>
                        <span className="text-[11px] text-neutral-600 block mt-0.5">
                          {s.provider}
                        </span>
                      </td>

                      <td className="p-4">
                        <Badge
                          variant={daysInfo.isExpired ? "fail" : "yellow"}
                          size="sm"
                        >
                          {daysInfo.label}
                        </Badge>
                        <span className="text-[10px] font-mono text-neutral-500 block mt-1">
                          {s.deadline}
                        </span>
                      </td>

                      <td className="p-4 font-bold">
                        {s.amountDescription}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 rounded-md border border-black bg-white px-2 py-0.5 font-mono text-[11px] font-bold">
                          <Scale className="h-3 w-3" />
                          {s.rules.length} rules
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 rounded-md border border-black bg-white px-2 py-0.5 font-mono text-[11px] font-bold">
                          <FileCheck className="h-3 w-3" />
                          {s.documents.length} docs
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/scholarships/${s.id}`}
                            title="View Public Page"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white shadow-neo-sm hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            onClick={() => setScholarshipToDelete(s.id)}
                            title="Delete Scholarship"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white text-neutral-700 shadow-neo-sm hover:bg-neo-red hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <Dialog
          isOpen={!!scholarshipToDelete}
          onClose={() => setScholarshipToDelete(null)}
          title="Delete Scholarship Listing"
          description="Are you sure you want to delete this scholarship listing? This action cannot be undone."
        >
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="white"
              size="sm"
              onClick={() => setScholarshipToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
            >
              Confirm Delete
            </Button>
          </div>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
