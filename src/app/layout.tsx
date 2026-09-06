import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arada HQ",
  description: "Create agents and recharge bingo wallets"
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
