import axios from "axios";
import type { GradeBand } from "@/types";

// DRF's standard error shape is either {"detail": "..."} or field-keyed
// validation arrays — both are already human-readable domain language (see
// context/code-standards.md), so this just picks the first one out to show
// as a toast, never a raw exception string.
export function extractApiError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length) {
      return String(data.non_field_errors[0]);
    }
    if (data) {
      const firstField = Object.values(data).find((value) => Array.isArray(value) && value.length);
      if (Array.isArray(firstField)) return String(firstField[0]);
    }
  }
  return fallback;
}

// Mirrors server/assessments/services/grading.py ACTIVITY_GRADE_BANDS for
// display only — the backend's computed value is the source of truth once
// an activity is actually marked (see context/code-standards.md).
export function getGradeBand(score: number): GradeBand {
  if (score >= 80) return "distinction";
  if (score >= 70) return "merit";
  if (score >= 50) return "pass";
  return "fail";
}

export const gradeBandLabel: Record<GradeBand, string> = {
  distinction: "Distinction",
  merit: "Merit",
  pass: "Pass",
  fail: "Fail",
};

// Mirrors server/assessments/services/grading.py DEGREE_CLASS_BANDS —
// display-only projection ahead of every mandatory activity being marked.
export function getDegreeClassBand(weightedAverage: number): GradeBand {
  if (weightedAverage >= 80) return "distinction";
  if (weightedAverage >= 65) return "merit";
  if (weightedAverage >= 50) return "pass";
  return "fail";
}

export const degreeClassLabel: Record<GradeBand, string> = {
  distinction: "Pass with Distinction",
  merit: "Pass with Merit",
  pass: "Pass",
  fail: "Fail / Not Completed",
};

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = new Date(iso);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((target.getTime() - now.getTime()) / msPerDay);
}

export function countdownLabel(iso: string, now: Date = new Date()): string {
  const days = daysUntil(iso, now);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days left`;
}
