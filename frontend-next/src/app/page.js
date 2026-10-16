"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  // Letters of NIRVANA separated
  const letters = ["N", "I", "R", "V", "A", "N", "A"];

  return (
    <div className="relative min-h-screen w-full bg-[#060a0a] text-white overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. ANALOGUE FILM GRAIN NOISE OVERLAY (FIXED VIEWPORT) */}
      {/* ========================================================================= */}
      {/* <div
        className="fixed inset-0 pointer-events-none opacity-45 mix-blend-overlay z-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.85'/%3E%3C/svg%3E")`,
        }}
      /> */}

      {/* ========================================================================= */}
      {/* 2. ENTIRE NIRVANA & WAVY TEXTURE CANVAS (CRISP, ZERO BLUR) */}
      {/* ========================================================================= */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden opacity-95"
        style={{ transform: "translate3d(0, 0, 0)", willChange: "transform" }}
      >
        {/* MOBILE & TABLET: CLUSTERED SEPARATED NIRVANA */}
        <div className="flex lg:hidden absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center -space-x-1 sm:-space-x-3 whitespace-nowrap">
          {letters.map((letter, idx) => {
            const posX = `${(idx / (letters.length - 1)) * 100}%`;
            return (
              <span
                key={idx}
                className="font-anton text-[30vw] sm:text-[28vw] text-transparent bg-clip-text select-none"
                style={{
                  backgroundImage: "url('/grunge-overlay.png')",
                  backgroundSize: "cover",
                  backgroundPosition: `${posX} 50%`,
                  WebkitBackgroundClip: "text",
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* DESKTOP: FULL-WIDTH CINEMATIC NIRVANA WITH EACH LETTER SEPARATED (CONTINUOUS PANORAMIC GRUNGE, NO GLOW, EXACT SIZE & ALIGNMENT) */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-between overflow-hidden px-2 xl:px-6">
          {/* N */}
          <div className="absolute top-[52%] left-[-0.5%] -translate-y-1/2 whitespace-nowrap">
            <span
              className="font-anton text-[58vh] xl:text-[68vh] leading-[0.72] tracking-[-0.04em] block text-transparent bg-clip-text select-none"
              style={{
                backgroundImage: "url('/grunge-overlay.png')",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitBackgroundClip: "text",
              }}
            >
              N
            </span>
          </div>

          {/* I */}
          <div className="absolute top-[52%] left-[16%] -translate-y-1/2 whitespace-nowrap">
            <span
              className="font-anton text-[58vh] xl:text-[68vh] leading-[0.72] tracking-[-0.04em] block text-transparent bg-clip-text select-none"
              style={{
                backgroundImage: "url('/grunge-overlay.png')",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitBackgroundClip: "text",
              }}
            >
              I
            </span>
          </div>

          {/* R */}
          <div className="absolute top-[52%] left-[23%] -translate-y-1/2 whitespace-nowrap">
            <span
              className="font-anton text-[58vh] xl:text-[68vh] leading-[0.72] tracking-[-0.04em] block text-transparent bg-clip-text select-none"
              style={{
                backgroundImage: "url('/grunge-overlay.png')",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitBackgroundClip: "text",
              }}
            >
              R
            </span>
          </div>

          {/* CENTER V (CRISP FOCAL POINT) */}
          <div className="absolute top-[52%] right-[38.75%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap z-10">
            <span
              className="font-anton text-[58vh] xl:text-[68vh] leading-[0.72] tracking-[-0.04em] block text-transparent bg-clip-text select-none"
              style={{
                backgroundImage: "url('/grunge-overlay.png')",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitBackgroundClip: "text",
              }}
            >
              V
            </span>
          </div>

          {/* A */}
          <div className="absolute top-[52%] right-[32%] -translate-y-1/2 whitespace-nowrap">
            <span
              className="font-anton text-[58vh] xl:text-[68vh] leading-[0.72] tracking-[-0.04em] block text-transparent bg-clip-text select-none"
              style={{
                backgroundImage: "url('/grunge-overlay.png')",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitBackgroundClip: "text",
              }}
            >
              A
            </span>
          </div>

          {/* N */}
          <div className="absolute top-[52%] right-[15.35%] -translate-y-1/2 whitespace-nowrap">
            <span
              className="font-anton text-[58vh] xl:text-[68vh] leading-[0.72] tracking-[-0.04em] block text-transparent bg-clip-text select-none"
              style={{
                backgroundImage: "url('/grunge-overlay.png')",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitBackgroundClip: "text",
              }}
            >
              N
            </span>
          </div>

          {/* A */}
          <div className="absolute top-[52%] right-[-1%] -translate-y-1/2 whitespace-nowrap">
            <span
              className="font-anton text-[58vh] xl:text-[68vh] leading-[0.72] tracking-[-0.04em] block text-transparent bg-clip-text select-none"
              style={{
                backgroundImage: "url('/grunge-overlay.png')",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitBackgroundClip: "text",
              }}
            >
              A
            </span>
          </div>
        </div>



        {/* ========================================================================= */}
        {/* 2A. TOP WAVING FILAMENTS — ADJUST SEPARATELY VIA 'top-[...]' or 'translate-y-[...]' */}
        {/* ========================================================================= */}
       <svg
  className="absolute inset-x-0 top-[-20%] translate-y-[0%] rotate-180 w-full h-[55vh] pointer-events-none select-none z-10 overflow-visible opacity-80 sm:opacity-90 mix-blend-screen"
  viewBox="0 0 1440 500"
  preserveAspectRatio="xMidYMid slice"
>
           <defs>
            <filter id="silkFlowBgBottom" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="5" result="warp" />
              <feDisplacementMap in="SourceGraphic" in2="warp" scale="65" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="cobwebMicroBgBottom" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="4" result="microWarp" />
              <feDisplacementMap in="SourceGraphic" in2="microWarp" scale="35" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* Top Waving Bands (Darkish Bluish Stems) */}
          <g filter="url(#silkFlowBgBottom)" className="opacity-85 animate-silk-drift">
            <path d="M -80 320 C 320 140, 620 480, 1020 160 C 1250 0, 1420 380, 1620 180" stroke="#0099bb" strokeWidth="2.6" fill="none" />
            <path d="M -80 340 C 330 160, 630 500, 1030 180 C 1260 20, 1430 400, 1620 200" stroke="#0284c7" strokeWidth="2.0" fill="none" />
            <path d="M -80 360 C 340 180, 640 520, 1040 200 C 1270 40, 1440 420, 1620 220" stroke="#0369a1" strokeWidth="1.5" fill="none" />
            <path d="M -80 380 C 350 200, 650 540, 1050 220 C 1280 60, 1450 440, 1620 240" stroke="#004d66" strokeWidth="1.1" fill="none" />
          </g>

          {/* Swirling Filaments (Dark Cyan & Midnight Blue) */}
          <g filter="url(#cobwebMicroBgBottom)" className="opacity-75 animate-silk-undulate">
            <path d="M 0 50 Q 300 250, 720 120 T 1440 180" stroke="#00e5ff" strokeWidth="1.6" fill="none" />
            <path d="M 0 200 Q 500 50, 920 300 T 1440 220" stroke="#0284c7" strokeWidth="1.4" fill="none" />
            <path d="M 0 450 Q 400 250, 850 420 T 1440 380" stroke="#035388" strokeWidth="1.8" fill="none" />
          </g>
        </svg>

        {/* ========================================================================= */}
        {/* 2B. BOTTOM WAVING FILAMENTS — ADJUST SEPARATELY VIA 'bottom-[...]' or 'translate-y-[...]' */}
        {/* ========================================================================= */}
        <svg
          className="absolute inset-x-0 bottom-0 translate-y-[40%] w-full h-[60vh] pointer-events-none select-none z-10 overflow-visible opacity-85 sm:opacity-95 mix-blend-screen"
          viewBox="0 0 1440 600"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <filter id="silkFlowBgBottom" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="5" result="warp" />
              <feDisplacementMap in="SourceGraphic" in2="warp" scale="65" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="cobwebMicroBgBottom" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="4" result="microWarp" />
              <feDisplacementMap in="SourceGraphic" in2="microWarp" scale="35" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* Bottom Waving Bands (Darkish Bluish Stems) */}
          <g filter="url(#silkFlowBgBottom)" className="opacity-85 animate-silk-drift">
            <path d="M -80 320 C 320 140, 620 480, 1020 160 C 1250 0, 1420 380, 1620 180" stroke="#0099bb" strokeWidth="2.6" fill="none" />
            <path d="M -80 340 C 330 160, 630 500, 1030 180 C 1260 20, 1430 400, 1620 200" stroke="#0284c7" strokeWidth="2.0" fill="none" />
            <path d="M -80 360 C 340 180, 640 520, 1040 200 C 1270 40, 1440 420, 1620 220" stroke="#0369a1" strokeWidth="1.5" fill="none" />
            <path d="M -80 380 C 350 200, 650 540, 1050 220 C 1280 60, 1450 440, 1620 240" stroke="#004d66" strokeWidth="1.1" fill="none" />
          </g>

          {/* Swirling Filaments (Dark Cyan & Midnight Blue) */}
          <g filter="url(#cobwebMicroBgBottom)" className="opacity-75 animate-silk-undulate">
            <path d="M 0 50 Q 300 250, 720 120 T 1440 180" stroke="#00e5ff" strokeWidth="1.6" fill="none" />
            <path d="M 0 200 Q 500 50, 920 300 T 1440 220" stroke="#0284c7" strokeWidth="1.4" fill="none" />
            <path d="M 0 450 Q 400 250, 850 420 T 1440 380" stroke="#035388" strokeWidth="1.8" fill="none" />
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTER FOREGROUND: EMBLEM WITH BALANCED BLACK GLOW & GET STARTED BUTTON */}
      {/* ========================================================================= */}
      <div className="relative z-40 w-full min-h-screen flex flex-col items-center justify-center p-4 text-center pointer-events-none">
        {/* CENTER EMBLEM WITH BALANCED BLACK GLOW OVER V */}
        <div className="relative flex flex-col items-center pointer-events-auto">
          {/* Soft, balanced black glowing aura softly masking part of the V (No cyan/blue) */}
          <div
            className="absolute inset-0 -m-6 sm:-m-10 md:-m-14 rounded-full pointer-events-none z-0"
            style={{
              background: "radial-gradient(circle, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.45) 75%, transparent 100%)",
              filter: "blur(20px)",
            }}
          />

          {/* Central Lotus Meditating Figure Emblem (Balanced medium size, pure black borders) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nirvana-emblem.png"
            alt="Nirvana Emblem"
            className="relative z-10 w-[200px] sm:w-[300px] md:w-[320px] lg:w-[570px] h-auto object-contain select-none top-6"
          />

          {/* Broad, spreader dark shadow aura behind HEALTH CHAIN & Button to mask background waves and letters */}
          <div
            className="absolute -inset-x-24 bottom-[-110px] h-[260px] rounded-[50%] pointer-events-none z-10"
            style={{
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.92) 50%, rgba(0,0,0,0.5) 80%, transparent 100%)",
              filter: "blur(28px)",
            }}
          />

          {/* HEALTH CHAIN SUBTITLE & GET STARTED BUTTON DIRECTLY BELOW */}
          <div className="relative z-20 flex flex-col items-center space-y-6 mt-4  sm:mt-14">
            {/* HEALTH CHAIN Typography exactly as shown in screenshot */}
            <div className="flex items-center gap-6 sm:gap-8 tracking-[0.65em] text-sm sm:text-base md:text-5xl  font-sans uppercase font-medium">
              <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                HEALTH
              </span>
              <span className="text-[#00e5ff] font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                CHAIN
              </span>
            </div>

            {/* GET STARTED PILL BUTTON (Dark inside, crisp electric cyan border, no fuzzy outer neon blur) */}
            <Link
              href="/auth/login"
              className="inline-flex items-center sm:mt-4 justify-center gap-2.5 px-8 py-2.5 sm:px-10 sm:py-3 rounded-full border border-[#00e5ff] bg-[#020b10] hover:bg-[#00e5ff] text-white hover:text-black font-medium text-xs sm:text-sm tracking-wider transition-all duration-300 cursor-pointer group pointer-events-auto shadow-[inset_0_0_12px_rgba(0,229,255,0.2)]"
            >
              <span>Get Started</span>
              
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
