// Single source for primary navigation — Topbar renders these as text links
// (desktop) and BottomNav renders the same list as icon+label (mobile), so
// adding/renaming a destination only happens in one place.
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "home" as const },
  { href: "/nearby", label: "Nearby", icon: "pin" as const },
  { href: "/contacts", label: "Contacts", icon: "users" as const },
];
