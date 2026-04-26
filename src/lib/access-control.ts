import { Role, User } from "@/types";

const fallbackAdminEmails = [
  "rajdeep@safestay.ai",
  "suraj@safestay.ai",
  "nabiha@safestay.ai",
];

export const ADMIN_EMAIL_ALLOWLIST = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean) || []
).slice(0, 3);

export const effectiveAdminAllowlist =
  ADMIN_EMAIL_ALLOWLIST.length === 3 ? ADMIN_EMAIL_ALLOWLIST : fallbackAdminEmails;

export function isAdminAllowlisted(email?: string | null) {
  return !!email && effectiveAdminAllowlist.includes(email.toLowerCase());
}

export function normalizePublicSignupRole(role?: Role): Role {
  return role === "staff" ? "staff" : "guest";
}

export function roleHome(role?: Role) {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "responder":
      return "/dashboard/responder";
    case "staff":
      return "/dashboard/staff";
    default:
      return "/dashboard/guest";
  }
}

export function canAccessDashboard(user: User | null, pathname: string) {
  if (!user || user.status === "suspended") return false;

  const role = user.role;
  if (pathname.startsWith("/dashboard/admin")) return role === "admin";
  if (pathname.startsWith("/dashboard/responder")) return role === "responder" || role === "admin";
  if (pathname.startsWith("/dashboard/staff")) return role === "staff" || role === "admin";
  if (pathname.startsWith("/dashboard/guest")) return true;
  return true;
}
