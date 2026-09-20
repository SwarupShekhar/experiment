import type { Metadata } from "next";
import PartyGame from "@/components/party/PartyGame";
import { notFound } from "next/navigation";
export const metadata: Metadata = { title: "Party room", robots: { index: false } };
export default function Room({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  if (code === "PRACTICE") return <PartyGame code="PRACTICE" online={false} />;
  if (!/^[A-Z0-9]{5}$/.test(code)) notFound();
  return <PartyGame code={code} online />;
}
