"use client";

import dynamic from "next/dynamic";
import { WaitlistModal } from "./components/WaitlistModal";
import { SocialFooter } from "./components/SocialFooter";

const ThreeScene = dynamic(() => import("./components/ThreeScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <ThreeScene />
      <WaitlistModal />
      <SocialFooter />
    </>
  );
}
