export const CURRENT_USER = {
  id: 1,
  name: "Sarah Mitchell",
  role: "SuperAdmin" as const,
  initials: "SM",
};

export const IS_SUPER_ADMIN = CURRENT_USER.role === "SuperAdmin";
