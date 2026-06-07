import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConfirmationProvider } from "@/components/ui/confirmation-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vyse — Your financial Advyser and tracker",
  description: "A premium, state-of-the-art personal finance tracker built on Next.js, Supabase, and Tailwind CSS, featuring advanced debt models, recurring bills, and ledger charts.",
  icons: {
    icon: "/vyse-logo.jpeg",
    apple: "/vyse-logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConfirmationProvider>
          {children}
        </ConfirmationProvider>
      </body>
    </html>
  );
}
