"use client";

import dynamic from "next/dynamic";
import { WaitlistModal } from "./components/WaitlistModal";

const ThreeScene = dynamic(() => import("./components/ThreeScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <ThreeScene />
      <WaitlistModal />
    </>
  );
}
