import type { Metadata } from "next";
import { buildPageMetadata, NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "付款流程",
  description: "晟心誠藝劇團線上付款與報名流程頁面。",
  path: "/payment",
  robots: NOINDEX_ROBOTS,
});

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
