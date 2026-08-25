import type { RosterMember, User } from "@/types";
import { avatars } from "./avatars";

// Demo sign-in accounts — no backend yet, so login matches on army number
// alone (see features/auth/authSlice.ts). All three skip the forced
// password-change flow for this preview pass.
export const demoUsers: Record<User["role"], User> = {
  admin: {
    id: "user-admin-1",
    armyNumber: "UPDF-A1002",
    role: "admin",
    rank: "Colonel",
    fullName: "Grace Nakato",
    country: "Uganda",
    phoneNumber: "",
    email: "",
    avatarUrl: avatars.admin,
    mustChangePassword: false,
  },
  directing_staff: {
    id: "user-ds-1",
    armyNumber: "UPDF-D2004",
    role: "directing_staff",
    rank: "Lt. Colonel",
    fullName: "Peter Okello",
    country: "Uganda",
    phoneNumber: "",
    email: "",
    avatarUrl: avatars.directingStaff,
    mustChangePassword: false,
  },
  officer: {
    id: "user-officer-1",
    armyNumber: "UPDF-O3006",
    role: "officer",
    rank: "Major",
    fullName: "Aisha Byaruhanga",
    country: "Uganda",
    phoneNumber: "",
    email: "",
    avatarUrl: avatars.officer,
    mustChangePassword: false,
  },
};

export const mockDirectingStaff = [
  { id: "ds-1", armyNumber: "UPDF-D2004", rank: "Lt. Colonel", fullName: "Peter Okello", avatarUrl: avatars.directingStaff },
  { id: "ds-2", armyNumber: "KDF-D1145", rank: "Lt. Colonel", fullName: "James Mwangi", avatarUrl: avatars.pool[0] },
  { id: "ds-3", armyNumber: "RDF-D2231", rank: "Colonel", fullName: "Eric Habimana", avatarUrl: avatars.pool[1] },
  { id: "ds-4", armyNumber: "SSPDF-D0871", rank: "Lt. Colonel", fullName: "Nyandeng Deng", avatarUrl: avatars.pool[2] },
  { id: "ds-5", armyNumber: "UPDF-D2107", rank: "Major", fullName: "Ruth Adong", avatarUrl: avatars.pool[3] },
  { id: "ds-6", armyNumber: "TPDF-D0932", rank: "Colonel", fullName: "Daudi Mrema", avatarUrl: avatars.pool[4] },
];

export const mockOfficers: RosterMember[] = [
  { id: "off-1", armyNumber: "UPDF-O3006", rank: "Major", fullName: "Aisha Byaruhanga", landGroup: "red", avatarUrl: avatars.officer, statusLabel: "On Track" },
  { id: "off-2", armyNumber: "KDF-O1187", rank: "Major", fullName: "Brian Kiptoo", landGroup: "red", avatarUrl: avatars.pool[5], statusLabel: "On Track" },
  { id: "off-3", armyNumber: "RDF-O2098", rank: "Captain", fullName: "Claudine Uwase", landGroup: "red", avatarUrl: avatars.pool[6], statusLabel: "Deadline Due" },
  { id: "off-4", armyNumber: "BDF-O0456", rank: "Major", fullName: "Desire Nkurunziza", landGroup: "red", avatarUrl: avatars.pool[7], statusLabel: "On Track" },
  { id: "off-5", armyNumber: "UPDF-O3091", rank: "Major", fullName: "Edwin Ssemakula", landGroup: "blue", avatarUrl: avatars.pool[0], statusLabel: "On Track" },
  { id: "off-6", armyNumber: "SSPDF-O0654", rank: "Captain", fullName: "Farida Achieng", landGroup: "blue", avatarUrl: avatars.pool[1], statusLabel: "On Track" },
  { id: "off-7", armyNumber: "TPDF-O1290", rank: "Major", fullName: "Godfrey Massawe", landGroup: "blue", avatarUrl: avatars.pool[2], statusLabel: "Overdue" },
  { id: "off-8", armyNumber: "DRC-O0788", rank: "Major", fullName: "Huguette Kabongo", landGroup: "blue", avatarUrl: avatars.pool[3], statusLabel: "On Track" },
];
