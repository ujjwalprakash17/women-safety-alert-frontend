// Single source of truth for brand values needed OUTSIDE app/globals.css —
// i.e. anywhere that can't read a CSS custom property (browser chrome
// theme-color, the web manifest). Everything else should reference the CSS
// variables in globals.css (var(--primary), var(--sos), etc.), not these.
export const THEME = {
  name: "Women Safety SOS",
  shortName: "SOS",
  description:
    "A personal safety app — trigger an SOS and alert nearby verified responders and trusted contacts.",
  brandColor: "#6b3fa0", // matches --primary in app/globals.css (light mode)
  backgroundColor: "#faf9fb", // matches --background in app/globals.css (light mode)
} as const;
