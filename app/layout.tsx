import type { Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F5EFE0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
