"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  ExternalLink,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-neo-pink px-4 py-1.5 shadow-neo-sm">
          <Sparkles className="h-4 w-4 stroke-[2.5]" />
          <span className="text-xs font-black uppercase tracking-wider">
            Qualify — Deterministic Eligibility Portal
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-black leading-none">
          Find Scholarships. Understand The Rules.{" "}
          <span className="bg-neo-yellow px-2.5 py-0.5 rounded-lg border-2 border-black inline-block shadow-neo-sm transform -rotate-1 mt-2">
            Zero Guesswork.
          </span>
        </h1>

        <p className="text-lg sm:text-xl font-medium text-neutral-700 max-w-2xl mx-auto leading-relaxed">
          No black-box scoring algorithms or arbitrary points. Transparent, rule-by-rule eligibility checking with verified official notices and document preparation tracking.
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/scholarships">
            <Button variant="yellow" size="lg" className="text-sm sm:text-base">
              Explore Scholarships
              <ArrowRight className="ml-2 h-5 w-5 stroke-[3]" />
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="pink" size="lg" className="text-sm sm:text-base">
              Complete Student Profile
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="white" size="lg" className="text-sm sm:text-base">
              Admin Portal
            </Button>
          </Link>
        </div>
      </section>

      {/* Highlights Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-neo-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-neo-yellow shadow-neo-sm shrink-0">
            <Scale className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-black font-display text-black block">
              100% Deterministic
            </span>
            <span className="text-xs font-semibold text-neutral-600">
              Evaluated strictly as PASS, FAIL, or UNKNOWN.
            </span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-neo-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-neo-pink shadow-neo-sm shrink-0">
            <FileText className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-black font-display text-black block">
              Document Checklist
            </span>
            <span className="text-xs font-semibold text-neutral-600">
              Prepare required certificates before applying.
            </span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-neo-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-neo-green shadow-neo-sm shrink-0">
            <ExternalLink className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-black font-display text-black block">
              Official Notices
            </span>
            <span className="text-xs font-semibold text-neutral-600">
              Direct verification links to institutional circulars.
            </span>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Card variant="white">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl border-2 border-black bg-neo-yellow flex items-center justify-center shadow-neo-sm mb-2">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <CardTitle>Deterministic Transparency</CardTitle>
            <CardDescription>
              Never guess why you didn&apos;t qualify. Every visible rule produces a mathematical PASS, FAIL, or UNKNOWN trace with complete reasoning.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card variant="white">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl border-2 border-black bg-neo-pink flex items-center justify-center shadow-neo-sm mb-2">
              <FileText className="h-6 w-6 stroke-[2.5]" />
            </div>
            <CardTitle>Preparation Checklists</CardTitle>
            <CardDescription>
              Track your required certificates, affidavits, marksheets, and bank records before applying so you never miss a deadline unprepared.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card variant="white">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl border-2 border-black bg-neo-green flex items-center justify-center shadow-neo-sm mb-2">
              <ExternalLink className="h-6 w-6 stroke-[2.5]" />
            </div>
            <CardTitle>Original Source Guarantee</CardTitle>
            <CardDescription>
              Direct links to official circulars and government gazettes ensure you always have the authority to verify every single eligibility term.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Call to Action Banner */}
      <section className="rounded-3xl border-3 border-black bg-neo-yellow p-8 sm:p-12 shadow-neo-lg text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-black font-display text-black">
          Ready to Discover Your Eligible Scholarships?
        </h2>
        <p className="text-sm sm:text-base font-bold text-neutral-800 max-w-xl mx-auto">
          Explore all verified listings or set up your student profile to evaluate criteria across every scholarship instantly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/scholarships">
            <Button variant="dark" size="lg">
              Browse Scholarship Directory
              <ArrowRight className="ml-2 h-4 w-4 stroke-[3]" />
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="white" size="lg">
              Set Up My Profile
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
