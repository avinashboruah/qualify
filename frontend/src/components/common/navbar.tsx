"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight, User as UserIcon, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";

export function Navbar() {
  const { user, isAuthenticated, logout, role } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-[#F4F0EA]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-lg font-black tracking-tight text-black transition-transform hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-neo-yellow shadow-neo-sm">
            <GraduationCap className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight">Qualify</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
              Deterministic Portal
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/scholarships"
            className="rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-black/5"
          >
            Directory
          </Link>
          {isAuthenticated && user && role === "student" && (
            <Link
              href="/profile"
              className="rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-black/5"
            >
              My Profile
            </Link>
          )}
          {isAuthenticated && user && role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-black/5"
            >
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Actions / Auth Badge */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-white px-3 py-1.5 shadow-neo-sm">
                <UserIcon className="h-3.5 w-3.5 stroke-[2.5] text-neutral-600" />
                <span className="text-xs font-bold text-black max-w-[120px] truncate sm:max-w-[180px]">
                  {user.name || user.email.split("@")[0]}
                </span>
                <Badge
                  variant={user.role === "admin" ? "pink" : "yellow"}
                  size="sm"
                  className="ml-1"
                >
                  {user.role}
                </Badge>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white shadow-neo-sm transition-all hover:bg-neutral-100 hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <LogOut className="h-4 w-4 stroke-[2.5] text-black" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border-2 border-black bg-white px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-black shadow-neo-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-neo-yellow px-4 py-1.5 text-xs font-black uppercase tracking-wider text-black shadow-neo-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Sign Up
                <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
