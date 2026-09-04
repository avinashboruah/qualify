"use client";

import { useState, useEffect, useCallback } from "react";
import { StudentProfile } from "@/types/profile";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";

export const EMPTY_PROFILE: StudentProfile = {
  fullName: "",
  age: "",
  gender: "",
  familyIncome: "",
  educationLevel: "",
  currentCourse: "",
  fieldOfStudy: "",
  cgpa: "",
  domicileState: "",
  areaType: "",
  category: "",
  isPwd: false,
  previousInstitution: "",
  previousMarksPercentage: "",
};

// Meritorious demo profile for quick 1-click test populating
export const DEMO_STUDENT_PROFILE: StudentProfile = {
  fullName: "Aarav Sharma",
  age: 20,
  gender: "male",
  familyIncome: 320000,
  educationLevel: "undergraduate",
  currentCourse: "B.Tech Computer Science & Engineering",
  fieldOfStudy: "Engineering & Technology",
  cgpa: 8.4,
  domicileState: "Assam",
  areaType: "rural",
  category: "OBC",
  isPwd: false,
  previousInstitution: "Cotton University, Guwahati",
  previousMarksPercentage: 89.5,
};

export function calculateProfileCompleteness(profile: StudentProfile): number {
  const coreFields: (keyof StudentProfile)[] = [
    "fullName",
    "age",
    "gender",
    "familyIncome",
    "educationLevel",
    "currentCourse",
    "fieldOfStudy",
    "cgpa",
    "domicileState",
    "areaType",
    "category",
  ];

  const filledCount = coreFields.filter((field) => {
    const val = profile[field];
    return val !== "" && val !== undefined && val !== null;
  }).length;

  return Math.round((filledCount / coreFields.length) * 100);
}

export function useProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile from API with localStorage fallback
  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        // Attempt backend fetch
        const data = await apiClient.get<{
          success: boolean;
          profile: StudentProfile;
        }>("/profile/me");

        if (mounted && data.profile) {
          setProfile(data.profile);
          localStorage.setItem(
            "scholarship_profile",
            JSON.stringify(data.profile)
          );
          return;
        }
      } catch {
        // Fallback: Read local cache
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("scholarship_profile");
          if (cached) {
            try {
              setProfile(JSON.parse(cached));
            } catch {
              setProfile(EMPTY_PROFILE);
            }
          } else if (user?.email === "student1@test.com") {
            // Default demo profile for primary test user
            setProfile(DEMO_STUDENT_PROFILE);
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const saveProfile = useCallback(
    async (updatedData: StudentProfile) => {
      setIsSaving(true);
      setError(null);
      try {
        // Try backend save
        await apiClient.put("/profile/me", updatedData);
      } catch {
        // Offline mode: proceed with local persistence
      } finally {
        setProfile(updatedData);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "scholarship_profile",
            JSON.stringify(updatedData)
          );
        }
        updateUser({ hasProfile: true, name: updatedData.fullName });
        setIsSaving(false);
      }
    },
    [updateUser]
  );

  return {
    profile,
    setProfile,
    saveProfile,
    isLoading,
    isSaving,
    error,
    completeness: calculateProfileCompleteness(profile),
  };
}
