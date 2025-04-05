import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import ClientHeader from "@/components/ClientHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlashDAO",
  description: "A decentralized organization for disaster relief",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={inter.className}>
      <body>
        <ClientHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
