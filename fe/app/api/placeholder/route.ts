import { NextRequest } from "next/server";

const productStyles: Record<
  string,
  { name: string; accent: string; sole: string; bg: string }
> = {
  "1": {
    name: "Classic Air Max",
    accent: "#0066cc",
    sole: "#1d1d1d",
    bg: "#edf5ff",
  },
  "1-2": {
    name: "Classic Air Max",
    accent: "#1d1d1d",
    sole: "#0066cc",
    bg: "#f5f5f7",
  },
  "1-3": {
    name: "Classic Air Max",
    accent: "#0f766e",
    sole: "#111827",
    bg: "#ecfdf5",
  },
  "2": {
    name: "Urban Street Style",
    accent: "#111827",
    sole: "#0066cc",
    bg: "#f4f4f5",
  },
  "3": {
    name: "Performance Court",
    accent: "#dc2626",
    sole: "#1d1d1d",
    bg: "#fff1f2",
  },
};

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "1";
  const style = productStyles[id] || productStyles["1"];

  const svg = `
    <svg width="900" height="900" viewBox="0 0 900 900" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${style.name}">
      <rect width="900" height="900" fill="${style.bg}"/>
      <circle cx="720" cy="150" r="170" fill="#ffffff" opacity="0.7"/>
      <circle cx="140" cy="760" r="220" fill="#ffffff" opacity="0.55"/>
      <g transform="translate(120 270)">
        <path d="M92 290C156 196 236 126 345 92c55-17 91-8 131 29l73 68c39 36 87 58 140 63 36 3 58 31 56 68-2 42-36 74-78 74H121c-44 0-68-54-39-87l10-17Z" fill="#fff"/>
        <path d="M126 292c69-81 145-137 243-166 30-9 51-4 73 16l79 73c46 43 103 69 166 76 15 2 25 14 24 29-1 17-15 30-32 30H128c-33 0-52-38-30-63l28 5Z" fill="${style.accent}" opacity="0.16"/>
        <path d="M93 289C157 195 237 126 346 92c54-17 90-7 130 29l74 68c39 36 87 58 140 63 36 3 58 31 56 68-2 42-36 74-78 74H121c-44 0-68-54-39-87l11-18Z" fill="none" stroke="${style.sole}" stroke-width="18" stroke-linejoin="round"/>
        <path d="M92 394h578c45 0 82-32 91-75l8 41c9 49-29 94-79 94H88c-35 0-64-29-64-64h68Z" fill="${style.sole}"/>
        <path d="M260 166l125 117M345 128l120 112M432 129l101 95" stroke="${style.sole}" stroke-width="18" stroke-linecap="round"/>
        <path d="M229 241h221" stroke="${style.accent}" stroke-width="20" stroke-linecap="round"/>
        <path d="M164 453h470" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity="0.35"/>
      </g>
      <text x="64" y="105" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#1d1d1d">${style.name}</text>
    </svg>
  `;

  return new Response(svg.trim(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
