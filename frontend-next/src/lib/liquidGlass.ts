/**
 * Liquid Glass Optical Engine
 * Apple-style liquid glass refraction with SVG displacement maps & chromatic aberration.
 */

export interface LiquidGlassOptions {
  scale?: number;       // Displacement strength; negative = magnifying bulge (-60 to -160)
  chroma?: number;      // Per-channel RGB prism dispersion stagger (0 = disabled, default: 4)
  border?: number;      // Neutral interior inset fraction (default: 0.12)
  mapBlur?: number;     // Bulge curvature: small = hard rim, large = soft dome (default: 8)
  blur?: number;        // Backdrop blur inside glass (default: 2)
  saturate?: number;    // Backdrop saturation boost (default: 1.4)
  radius?: number | null; // Corner radius in px, or null to auto-read from element
}

export interface LiquidGlassInstance {
  supported: boolean;
  refresh: () => void;
  destroy: () => void;
}

let uid = 0;
let svgDefs: SVGDefsElement | null = null;

export const isLiquidGlassSupported = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|Arc|Brave/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  if (isSafari || isFirefox) return false;
  if (!CSS.supports("backdrop-filter", "url(#lg-test)")) return false;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 4;
    return !!c.getContext("2d");
  } catch (_) {
    return false;
  }
};

function ensureDefs(): SVGDefsElement {
  if (svgDefs && document.body.contains(svgDefs.ownerSVGElement)) {
    return svgDefs;
  }
  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "fixed";
  svg.style.top = "-9999px";
  svg.style.left = "-9999px";
  svg.style.pointerEvents = "none";
  svg.style.opacity = "0";
  svg.style.zIndex = "-1";

  svgDefs = document.createElementNS(SVG_NS, "defs");
  svg.appendChild(svgDefs);
  document.body.appendChild(svg);
  return svgDefs;
}

/**
 * Generate displacement map:
 * Red -> X displacement ramp
 * Blue -> Y displacement ramp (difference-blended)
 * 50% neutral gray (128,128,128) blurred center -> 0 displacement inside
 */
function makeMap(w: number, h: number, radius: number, border: number, mapBlur: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(16, Math.floor(w));
  canvas.height = Math.max(16, Math.floor(h));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Red X gradient
  const gx = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gx.addColorStop(0, "rgb(0,0,0)");
  gx.addColorStop(1, "rgb(255,0,0)");
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Blue Y gradient difference-blended
  const gy = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gy.addColorStop(0, "rgb(0,0,0)");
  gy.addColorStop(1, "rgb(0,0,255)");
  ctx.globalCompositeOperation = "difference";
  ctx.fillStyle = gy;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Neutralize the center with 50% gray (128,128,128) blurred rounded rect
  ctx.globalCompositeOperation = "source-over";
  const inset = border * Math.min(canvas.width, canvas.height);
  ctx.filter = `blur(${mapBlur}px)`;
  ctx.fillStyle = "rgb(128,128,128)";

  const rx = Math.max(2, radius - inset);
  const rw = Math.max(4, canvas.width - inset * 2);
  const rh = Math.max(4, canvas.height - inset * 2);

  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(inset, inset, rw, rh, rx);
  } else {
    ctx.rect(inset, inset, rw, rh);
  }
  ctx.fill();

  return canvas.toDataURL("image/png");
}

export function applyLiquidGlass(
  el: HTMLElement,
  options: LiquidGlassOptions = {}
): LiquidGlassInstance {
  const opts: Required<LiquidGlassOptions> = {
    scale: options.scale ?? -85,
    chroma: options.chroma ?? 4,
    border: options.border ?? 0.12,
    mapBlur: options.mapBlur ?? 8,
    blur: options.blur ?? 2,
    saturate: options.saturate ?? 1.4,
    radius: options.radius ?? null,
  };

  const isSupported = isLiquidGlassSupported();

  // High-fidelity fallback for Safari / Firefox
  if (!isSupported) {
    el.style.backdropFilter = `blur(16px) saturate(${opts.saturate})`;
    el.classList.add("liquid-glass-fallback");
    return {
      supported: false,
      refresh: () => {},
      destroy: () => {
        el.style.backdropFilter = "";
        el.classList.remove("liquid-glass-fallback");
      },
    };
  }

  const defs = ensureDefs();
  const filterId = `lg-filter-${++uid}`;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", filterId);
  filter.setAttribute("x", "-20%");
  filter.setAttribute("y", "-20%");
  filter.setAttribute("width", "140%");
  filter.setAttribute("height", "140%");
  filter.setAttribute("color-interpolation-filters", "sRGB");
  defs.appendChild(filter);

  const feImage = document.createElementNS(SVG_NS, "feImage");
  feImage.setAttribute("result", "map");
  feImage.setAttribute("preserveAspectRatio", "none");
  filter.appendChild(feImage);

  if (opts.chroma > 0) {
    // Red channel displacement
    const feDispR = document.createElementNS(SVG_NS, "feDisplacementMap");
    feDispR.setAttribute("in", "SourceGraphic");
    feDispR.setAttribute("in2", "map");
    feDispR.setAttribute("scale", String(opts.scale - opts.chroma));
    feDispR.setAttribute("xChannelSelector", "R");
    feDispR.setAttribute("yChannelSelector", "B");
    feDispR.setAttribute("result", "dispR");
    filter.appendChild(feDispR);

    const feColorR = document.createElementNS(SVG_NS, "feColorMatrix");
    feColorR.setAttribute("in", "dispR");
    feColorR.setAttribute("type", "matrix");
    feColorR.setAttribute("values", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0");
    feColorR.setAttribute("result", "redOnly");
    filter.appendChild(feColorR);

    // Green channel displacement
    const feDispG = document.createElementNS(SVG_NS, "feDisplacementMap");
    feDispG.setAttribute("in", "SourceGraphic");
    feDispG.setAttribute("in2", "map");
    feDispG.setAttribute("scale", String(opts.scale));
    feDispG.setAttribute("xChannelSelector", "R");
    feDispG.setAttribute("yChannelSelector", "B");
    feDispG.setAttribute("result", "dispG");
    filter.appendChild(feDispG);

    const feColorG = document.createElementNS(SVG_NS, "feColorMatrix");
    feColorG.setAttribute("in", "dispG");
    feColorG.setAttribute("type", "matrix");
    feColorG.setAttribute("values", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0");
    feColorG.setAttribute("result", "greenOnly");
    filter.appendChild(feColorG);

    // Blue channel displacement
    const feDispB = document.createElementNS(SVG_NS, "feDisplacementMap");
    feDispB.setAttribute("in", "SourceGraphic");
    feDispB.setAttribute("in2", "map");
    feDispB.setAttribute("scale", String(opts.scale + opts.chroma));
    feDispB.setAttribute("xChannelSelector", "R");
    feDispB.setAttribute("yChannelSelector", "B");
    feDispB.setAttribute("result", "dispB");
    filter.appendChild(feDispB);

    const feColorB = document.createElementNS(SVG_NS, "feColorMatrix");
    feColorB.setAttribute("in", "dispB");
    feColorB.setAttribute("type", "matrix");
    feColorB.setAttribute("values", "0 0 0 0 0  0 0 0 0 0  0 0 0 1 0  0 0 0 1 0");
    feColorB.setAttribute("result", "blueOnly");
    filter.appendChild(feColorB);

    // Recombine channels
    const feCompRG = document.createElementNS(SVG_NS, "feComposite");
    feCompRG.setAttribute("in", "redOnly");
    feCompRG.setAttribute("in2", "greenOnly");
    feCompRG.setAttribute("operator", "lighter");
    feCompRG.setAttribute("result", "compRG");
    filter.appendChild(feCompRG);

    const feCompRGB = document.createElementNS(SVG_NS, "feComposite");
    feCompRGB.setAttribute("in", "compRG");
    feCompRGB.setAttribute("in2", "blueOnly");
    feCompRGB.setAttribute("operator", "lighter");
    feCompRGB.setAttribute("result", "refracted");
    filter.appendChild(feCompRGB);
  } else {
    const feDisp = document.createElementNS(SVG_NS, "feDisplacementMap");
    feDisp.setAttribute("in", "SourceGraphic");
    feDisp.setAttribute("in2", "map");
    feDisp.setAttribute("scale", String(opts.scale));
    feDisp.setAttribute("xChannelSelector", "R");
    feDisp.setAttribute("yChannelSelector", "B");
    feDisp.setAttribute("result", "refracted");
    filter.appendChild(feDisp);
  }

  const updateMap = () => {
    if (!el || !document.body.contains(el)) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let r = opts.radius;
    if (r === null) {
      const computedRadius = window.getComputedStyle(el).borderRadius;
      r = parseFloat(computedRadius) || 16;
    }

    const dataUrl = makeMap(rect.width, rect.height, r, opts.border, opts.mapBlur);
    feImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataUrl);
    feImage.setAttribute("href", dataUrl);

    let backdropStr = `url(#${filterId})`;
    if (opts.blur > 0) backdropStr += ` blur(${opts.blur}px)`;
    if (opts.saturate > 1) backdropStr += ` saturate(${opts.saturate})`;

    el.style.backdropFilter = backdropStr;
    (el.style as any).webkitBackdropFilter = backdropStr;
  };

  // Cursor-tracked glare coordinates
  const handleMouseMove = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--gx", `${x}%`);
    el.style.setProperty("--gy", `${y}%`);
  };

  const handleMouseLeave = () => {
    el.style.setProperty("--gx", "50%");
    el.style.setProperty("--gy", "20%");
  };

  el.addEventListener("mousemove", handleMouseMove, { passive: true });
  el.addEventListener("mouseleave", handleMouseLeave, { passive: true });

  updateMap();

  const ro = new ResizeObserver(() => updateMap());
  ro.observe(el);

  return {
    supported: true,
    refresh: updateMap,
    destroy: () => {
      ro.disconnect();
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.style.backdropFilter = "";
      (el.style as any).webkitBackdropFilter = "";
      if (filter.parentNode) {
        filter.parentNode.removeChild(filter);
      }
    },
  };
}
