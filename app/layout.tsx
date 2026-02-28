import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "MeetSplit — Friends meet. Bills split.",
  description: "Find a date that works for everyone and split trip expenses without the headache. No signup required.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://meetsplit.vercel.app"),
  openGraph: {
    title: "MeetSplit — Friends meet. Bills split.",
    description: "Find a date that works for everyone and split trip expenses without the headache.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MeetSplit — Friends meet. Bills split.",
    description: "Find a date that works for everyone and split trip expenses without the headache.",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
