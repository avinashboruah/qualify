"use client";

import { useState, useEffect, useCallback } from "react";
import { Scholarship } from "@/types/scholarship";
import { MOCK_SCHOLARSHIPS } from "@/data/mock-scholarships";
import { apiClient } from "@/lib/api-client";

const STORAGE_KEY = "admin_custom_scholarships";

export function useScholarshipStore() {
  const [scholarships, setScholarships] = useState<Scholarship[]>(MOCK_SCHOLARSHIPS);
  const [isLoading, setIsLoading] = useState(true);

  // Load custom scholarships from localStorage and merge with default MOCK_SCHOLARSHIPS
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const customData = localStorage.getItem(STORAGE_KEY);
        if (customData) {
          const parsed: Scholarship[] = JSON.parse(customData);
          // Combine mock and custom, avoiding duplicates by id
          const customIds = new Set(parsed.map((s) => s.id));
          const baseFiltered = MOCK_SCHOLARSHIPS.filter((s) => !customIds.has(s.id));
          setScholarships([...parsed, ...baseFiltered]);
        }
      }
    } catch {
      setScholarships(MOCK_SCHOLARSHIPS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addScholarship = useCallback(async (newScholarship: Scholarship) => {
    // Attempt backend save
    try {
      await apiClient.post("/admin/scholarships", newScholarship);
    } catch {
      // Offline fallback: save locally
    }

    setScholarships((prev) => {
      const updated = [newScholarship, ...prev];
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        const existingCustom: Scholarship[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify([newScholarship, ...existingCustom])
        );
      }
      return updated;
    });
  }, []);

  const deleteScholarship = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/admin/scholarships/${id}`);
    } catch {
      // Offline fallback
    }

    setScholarships((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const existingCustom: Scholarship[] = JSON.parse(stored);
          const filtered = existingCustom.filter((s) => s.id !== id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
      }
      return updated;
    });
  }, []);

  return {
    scholarships,
    addScholarship,
    deleteScholarship,
    isLoading,
  };
}
