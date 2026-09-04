"use client";

import { useState, useEffect, useCallback } from "react";
import { ScholarshipDocument } from "@/types/scholarship";
import { apiClient } from "@/lib/api-client";

export function useDocumentChecklist(
  scholarshipId: string,
  documents: ScholarshipDocument[]
) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Storage key for this specific scholarship
  const storageKey = `scholarship_checklist_${scholarshipId}`;

  useEffect(() => {
    // Attempt to load from API, fallback to localStorage
    async function load() {
      setIsLoading(true);
      try {
        const data = await apiClient.get<{
          success: boolean;
          checklist: { documentId: string; isCompleted: boolean }[];
        }>(`/scholarships/${scholarshipId}/checklist`);

        if (data?.checklist) {
          const finished = data.checklist
            .filter((c) => c.isCompleted)
            .map((c) => c.documentId);
          setCompletedIds(finished);
          return;
        }
      } catch {
        // Fallback to local storage
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            try {
              setCompletedIds(JSON.parse(cached));
            } catch {
              setCompletedIds([]);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [scholarshipId, storageKey]);

  const toggleItem = useCallback(
    async (docId: string) => {
      setCompletedIds((prev) => {
        const isCurrentlyCompleted = prev.includes(docId);
        const next = isCurrentlyCompleted
          ? prev.filter((id) => id !== docId)
          : [...prev, docId];

        // Persist locally
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }

        // Try syncing with API in background
        apiClient
          .patch(`/scholarships/${scholarshipId}/checklist/${docId}`, {
            isCompleted: !isCurrentlyCompleted,
          })
          .catch(() => {
            // Silently persist offline
          });

        return next;
      });
    },
    [scholarshipId, storageKey]
  );

  const completedCount = completedIds.length;
  const totalCount = documents.length;
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    completedIds,
    toggleItem,
    completedCount,
    totalCount,
    progressPercentage,
    isLoading,
  };
}
