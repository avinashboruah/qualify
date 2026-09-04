import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { AuthProvider } from "@/context/auth-context";

export const metadata: Metadata = {
  title: "Qualify — Deterministic Scholarship Eligibility Portal",
  description:
    "Transparent, deterministic rule-based scholarship eligibility checker for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neo-bg text-black font-sans antialiased flex flex-col justify-between selection:bg-neo-pink selection:text-black">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
