export const CURRENT_USER = {
  id: 7,
  name: "Shaukin Phaterpekar",
  email: "Shaukin@alliancestreet.ae",
  role: "SuperAdmin" as const,
  initials: "SP",
};

export const IS_SUPER_ADMIN = CURRENT_USER.role === "SuperAdmin";
