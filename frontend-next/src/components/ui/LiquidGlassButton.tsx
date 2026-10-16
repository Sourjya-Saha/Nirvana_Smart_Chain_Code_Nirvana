"use client";

import React, { useRef, useEffect, ReactNode, CSSProperties } from "react";
import { applyLiquidGlass, LiquidGlassOptions } from "@/lib/liquidGlass";

interface LiquidGlassButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  target?: string;
  rel?: string;
  download?: boolean | string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  variant?: "default" | "accent" | "subtle" | "dark";
  size?: "sm" | "md" | "lg";
  options?: LiquidGlassOptions;
  as?: "button" | "a" | "div";
  type?: "button" | "submit" | "reset";
  [key: string]: any;
}

export default function LiquidGlassButton({
  children,
  onClick,
  href,
  target,
  rel,
  download,
  disabled = false,
  className = "",
  style = {},
  variant = "default",
  size = "md",
  options = {},
  as = "button",
  type = "button",
  ...restProps
}: LiquidGlassButtonProps) {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const instance = applyLiquidGlass(el, {
      scale: options.scale ?? -70,
      chroma: options.chroma ?? 3.5,
      border: options.border ?? 0.1,
      mapBlur: options.mapBlur ?? 6,
      blur: options.blur ?? 2,
      saturate: options.saturate ?? 1.35,
      radius: options.radius ?? null,
    });

    return () => {
      instance.destroy();
    };
  }, [options.scale, options.chroma, options.border, options.mapBlur, options.blur, options.saturate, options.radius]);

  // Optical layers with realistic glass bevels and inner reflections
  const variantStyles: Record<string, string> = {
    default:
      "bg-gradient-to-b from-white/[0.14] to-white/[0.04] text-white hover:from-white/[0.22] hover:to-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-4px_12px_rgba(255,255,255,0.04),inset_0_0_0_1px_rgba(255,255,255,0.15)]",
    accent:
      "bg-gradient-to-b from-[#C3E41D]/[0.08] to-white/[0.03] text-white hover:from-[#C3E41D]/[0.15] hover:to-white/[0.06] border border-[#C3E41D]/25 hover:border-[#C3E41D]/50 shadow-[0_12px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-4px_12px_rgba(195,228,29,0.06),inset_0_0_0_1px_rgba(195,228,29,0.2)]",
    subtle:
      "bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-white/90 hover:from-white/[0.15] hover:to-white/[0.05] shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_0_0_1px_rgba(255,255,255,0.1)]",
    dark:
      "bg-gradient-to-b from-zinc-950/80 to-black/90 text-white hover:from-zinc-900/90 hover:to-black shadow-[0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_0_0_1px_rgba(255,255,255,0.06)]",
    light:
      "bg-gradient-to-b from-white/90 to-neutral-100/90 text-neutral-900 hover:from-white hover:to-neutral-200/90 border border-neutral-300 shadow-[0_6px_20px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(0,0,0,0.04)]",
  };


  const sizeStyles: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs rounded-full gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-full gap-2",
    lg: "px-7 py-3.5 text-base rounded-full gap-2.5 font-medium",
  };

  const isOverflowVisible = className.includes("overflow-visible");

  const baseClasses = `
    relative inline-flex items-center justify-center select-none cursor-pointer
    transition-all duration-300 active:scale-[0.98] group ${isOverflowVisible ? "overflow-visible" : "overflow-hidden"}
    ${variantStyles[variant] || variantStyles.default}
    ${sizeStyles[size] || sizeStyles.md}
    ${className}
  `.trim();

  // Dynamic cursor-tracked subtle specular highlight (decreased glowing effect)
  const glareOverlay = (
    <span
      className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300 opacity-25 group-hover:opacity-45"
      style={{
        background: `radial-gradient(90px circle at var(--gx, 50%) var(--gy, 20%), rgba(255,255,255,0.22), rgba(255,255,255,0.02) 45%, transparent 70%)`,
      }}
      aria-hidden="true"
    />
  );


  if (href || as === "a") {
    return (
      <a
        ref={ref}
        href={href}
        onClick={onClick}
        target={target}
        rel={rel || (target === "_blank" ? "noopener noreferrer" : undefined)}
        download={download}
        className={baseClasses}
        style={style}
        {...restProps}
      >
        {glareOverlay}
        <span className="relative z-10 inline-flex items-center gap-[inherit]">{children}</span>
      </a>
    );
  }

  if (as === "div") {
    return (
      <div ref={ref} onClick={onClick} className={baseClasses} style={style} {...restProps}>
        {glareOverlay}
        <span className="relative z-10 inline-flex items-center gap-[inherit]">{children}</span>
      </div>
    );
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={baseClasses}
      style={style}
      {...restProps}
    >
      {glareOverlay}
      <span className="relative z-10 inline-flex items-center gap-[inherit]">{children}</span>
    </button>
  );
}
