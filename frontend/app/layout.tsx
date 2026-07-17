import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Softkart — Your Ultimate Software Solutions Hub | NITECHSPARK",
  description:
    "Explore, demo, and purchase custom web, mobile, and enterprise software solutions.",
};

import { ClientAuthProvider } from "@/context/ClientAuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientAuthProvider>{children}</ClientAuthProvider>
      </body>
    </html>
  );
}
