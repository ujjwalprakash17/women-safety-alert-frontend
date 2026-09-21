import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Women Safety SOS",
  description:
    "A personal safety app — trigger an SOS and alert nearby verified responders and trusted contacts.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#c8102e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
