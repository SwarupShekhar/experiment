import type { Metadata } from "next";
import SoloGame from "@/components/solo/SoloGame";
export const metadata: Metadata = { title: "Solo story", description: "Play one night on Block 9 against simulated guards and prisoners. About 10 minutes, no sign-up.", alternates: { canonical: "/play" } };
export default function Play() { return <SoloGame />; }
