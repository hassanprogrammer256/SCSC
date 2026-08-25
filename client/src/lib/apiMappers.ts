import type { Role, User } from "@/types";

// The backend returns the User model's real (snake_case) field names —
// mapped here, once, at the API boundary rather than adding a
// camelCase-conversion dependency (context/code-standards.md's approved
// list). Shared by auth, officer, and directing-staff registration/listing,
// since all three receive a nested `user` object of this same shape.
export type ApiUser = {
  id: string;
  army_number: string;
  role: Role;
  rank: string;
  full_name: string;
  country: string;
  phone_number: string;
  email: string;
  avatar_url?: string | null;
  must_change_password: boolean;
};

export function mapApiUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    armyNumber: apiUser.army_number,
    role: apiUser.role,
    rank: apiUser.rank,
    fullName: apiUser.full_name,
    country: apiUser.country,
    phoneNumber: apiUser.phone_number,
    email: apiUser.email,
    avatarUrl: apiUser.avatar_url ?? undefined,
    mustChangePassword: apiUser.must_change_password,
  };
}
