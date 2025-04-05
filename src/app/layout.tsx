import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import ClientHeader from "@/components/ClientHeader";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlashDAO",
  description:
    "Self-organized resources and talent across borders within seconds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={inter.className}>
      <head />
      <body>
        <ClientHeader />
        <main>{children}</main>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
