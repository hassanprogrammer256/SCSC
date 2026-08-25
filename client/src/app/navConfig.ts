import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  Calendar,
  Archive as ArchiveIcon,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import type { Role } from "@/types";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navConfigByRole: Record<Role, NavGroup[]> = {
  admin: [
    {
      label: "Main",
      items: [{ label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Courses",
      items: [{ label: "Courses", path: "/admin/courses", icon: GraduationCap }],
    },
    {
      label: "Personnel",
      items: [
        { label: "Officers", path: "/admin/officers", icon: Users },
        { label: "Directing Staff", path: "/admin/directing-staff", icon: ShieldCheck },
      ],
    },
    {
      label: "Academic",
      items: [
        { label: "Land Groups", path: "/admin/land-groups", icon: FileText },
        { label: "Activities", path: "/admin/activities", icon: ClipboardList },
        { label: "Assignments", path: "/admin/assignments", icon: UsersRound },
        { label: "Timetable", path: "/admin/timetable", icon: Calendar },
        { label: "Assessments", path: "/admin/assessments", icon: ClipboardCheck },
      ],
    },
    {
      label: "Announcements",
      items: [{ label: "Announcements", path: "/admin/announcements", icon: Megaphone }],
    },
    {
      label: "Reports",
      items: [{ label: "Reports", path: "/admin/reports", icon: Award }],
    },
    {
      label: "User Management",
      items: [{ label: "Users", path: "/admin/users", icon: UserCog }],
    },
    {
      label: "Archive",
      items: [{ label: "Archive", path: "/admin/archive", icon: ArchiveIcon }],
    },
  ],
  directing_staff: [
    {
      label: "Main",
      items: [{ label: "Dashboard", path: "/ds/dashboard", icon: LayoutDashboard }],
    },
    {
      label: "My Officers",
      items: [{ label: "My Officers", path: "/ds/officers", icon: Users }],
    },
    {
      label: "My Activities",
      items: [{ label: "My Activities", path: "/ds/activities", icon: ClipboardList }],
    },
    {
      label: "Assessments & Marking",
      items: [{ label: "Assessments & Marking", path: "/ds/assessments", icon: ClipboardCheck }],
    },
  
    {
      label: "Announcements",
      items: [{ label: "Announcements", path: "/ds/announcements", icon: Megaphone }],
    },
    {
      label: "Reports",
      items: [{ label: "Submit Report", path: "/ds/reports/submit", icon: FileCheck2 }],
    },
  ],
  officer: [
    {
      label: "Main",
      items: [{ label: "Dashboard", path: "/officer/dashboard", icon: LayoutDashboard }],
    },
    {
      label: "My Activities",
      items: [{ label: "My Activities", path: "/officer/activities", icon: ClipboardList }],
    },
    {
      label: "Submissions",
      items: [{ label: "Submissions", path: "/officer/submissions", icon: FileText }],
    },
    {
      label: "Marks & Remarks",
      items: [{ label: "Marks & Remarks", path: "/officer/marks", icon: Award }],
    },
    {
      label: "Academic Progress",
      items: [{ label: "Academic Progress", path: "/officer/progress", icon: GraduationCap }],
    },
    {
      label: "Announcements",
      items: [{ label: "Announcements", path: "/officer/announcements", icon: Bell }],
    },
    {
      label: "Profile",
      items: [{ label: "Profile", path: "/officer/profile", icon: IdCard }],
    },
  ],
};

export const roleHomePath: Record<Role, string> = {
  admin: "/admin/dashboard",
  directing_staff: "/ds/dashboard",
  officer: "/officer/dashboard",
};

export const roleDataAttr: Record<Role, string> = {
  admin: "admin",
  directing_staff: "directing-staff",
  officer: "officer",
};

export const roleLabel: Record<Role, string> = {
  admin: "Admin",
  directing_staff: "Directing Staff",
  officer: "Officer",
};
