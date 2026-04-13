import { useState } from "react";

const LOGO_COLORS = [
  "#4F46E5", "#7C3AED", "#2563EB", "#0891B2",
  "#059669", "#DC2626", "#D97706", "#0F766E",
];

function colorFor(name: string) {
  return LOGO_COLORS[name.charCodeAt(0) % LOGO_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
}

function domainFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

interface CompanyLogoProps {
  name: string;
  website?: string;
  size?: number;
  className?: string;
}

export function CompanyLogo({ name, website, size = 48, className = "" }: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);
  const domain = domainFromUrl(website);
  const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}` : null;
  const bg = colorFor(name);
  const inits = initials(name);
  const fontSize = Math.round(size * 0.3);
  const borderRadius = Math.round(size * 0.2);

  if (clearbitUrl && !imgError) {
    return (
      <img
        src={clearbitUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius }}
        className={`object-contain bg-white border border-gray-100 p-1 flex-shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: bg, borderRadius, fontSize }}
      className={`flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
    >
      {inits}
    </div>
  );
}
