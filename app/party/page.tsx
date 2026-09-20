import type { Metadata } from "next";
import PartyLobby from "@/components/party/PartyLobby";
export const metadata: Metadata = { title: "Party mode", description: "Play Block 9 with 2 to 12 friends. Random roles, simulated players fill empty cells, hidden ledgers revealed at dawn.", alternates: { canonical: "/party" } };
export default function Party() { return <PartyLobby />; }
