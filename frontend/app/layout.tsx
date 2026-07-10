import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Softcomerce — AI Proposal & Budgeting | NITECHSPARK",
  description:
    "Get an instant AI-generated project proposal and budget estimate for web, mobile, and custom software development.",
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
