"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function MobileLandingPage() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/passenger/trip-lists");
  };

  return (
    <main className="rida-mobile-shell relative flex min-h-screen flex-col items-center overflow-hidden bg-[#0141c5] px-8 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(178,223,255,0.22),transparent_30%)]" />

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center pb-8">
        <div className="flex -translate-y-6 flex-col items-center">
          <Image
            src="/assets/rida-dashboard-icon.png"
            alt="Rida icon"
            width={124}
            height={124}
            className="mb-8 rounded-full"
            priority
          />
          <Image
            src="/assets/rida-dashboard-logo.png"
            alt="Rida"
            width={186}
            height={74}
            className="h-auto w-44 object-contain"
            priority
          />
        </div>
      </section>

      <div className="relative z-10 rida-safe-bottom w-full space-y-4 pb-3 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-black leading-tight">Ride Ready?</h1>
          <p className="text-lg font-bold text-white/88">We made it easy.</p>
        </div>
        <Button
          onClick={handleClick}
          className="group mt-6 h-14 w-full rounded-full bg-white text-base font-black text-[#0141c5] shadow-2xl shadow-[#0e2865]/30 hover:bg-[#b2dfff]"
          size="lg"
        >
          Get Started
          <ArrowRight className="h-5 w-5 text-[#0141c5] transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      </div>
    </main>
  );
}
