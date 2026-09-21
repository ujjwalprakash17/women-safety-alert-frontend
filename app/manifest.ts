import type { MetadataRoute } from "next";
import { THEME } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: THEME.name,
    short_name: THEME.shortName,
    description: THEME.description,
    start_url: "/",
    display: "standalone",
    background_color: THEME.backgroundColor,
    theme_color: THEME.brandColor,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
