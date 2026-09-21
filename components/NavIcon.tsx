const PATHS: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9",
  pin: "M12 21s7-6.6 7-11.5A7 7 0 0 0 5 9.5C5 14.4 12 21 12 21Z",
  users:
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5M17 11a3 3 0 1 0 0-6M21 20c0-2.5-2-4.6-4.5-5.3",
};

export default function NavIcon({
  name,
  size = 20,
}: {
  name: keyof typeof PATHS;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
      {name === "pin" && <circle cx="12" cy="9.5" r="2.2" />}
    </svg>
  );
}
