export function fmt(n: number | null | undefined, dp = 2): string {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: 0 });
}

export function fmtEur(n: number | null | undefined, compact = false): string {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (compact || abs >= 1e6) {
    if (abs >= 1e9) return "EUR " + (n / 1e9).toFixed(2) + "B";
    if (abs >= 1e6) return "EUR " + (n / 1e6).toFixed(2) + "M";
    if (abs >= 1e3) return "EUR " + (n / 1e3).toFixed(0) + "k";
  }
  return "EUR " + fmt(n, 0);
}

export function fmtPct(n: number | null | undefined, dp = 2): string {
  if (n == null || isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(dp) + "%";
}

export function deltaClass(pct: number) {
  return pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
}

export function deltaTri(pct: number) {
  return pct > 0 ? "▲" : pct < 0 ? "▼" : "●";
}

export function synthSeries(start: number, end: number, points: number, vol: number): number[] {
  const arr = [start];
  const r = (end / start) ** (1 / (points - 1)) - 1;
  for (let i = 1; i < points; i++) {
    const shock = (Math.sin(i * 0.7) + Math.cos(i * 1.3) + Math.sin(i * 0.31)) * vol * 0.01;
    arr.push(arr[i - 1] * (1 + r + shock));
  }
  arr[points - 1] = end;
  return arr.map((v) => +v.toFixed(2));
}

export function monthlyLabels(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(d.getMonth() === 0 ? d.getFullYear().toString() : "");
  }
  return out;
}

export function synthPortrait(seed: number): string {
  const palettes = [["#241810","#3e2818","#62402a","#87603e"],["#181c20","#2d3942","#4f6878","#7a93a3"]];
  const p = palettes[seed % palettes.length];
  return `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
    <rect width="200" height="200" fill="${p[0]}"/>
    <ellipse cx="100" cy="80" rx="40" ry="48" fill="${p[2]}"/>
    <path d="M60,200 Q60,140 100,135 Q140,140 140,200 Z" fill="${p[1]}"/>
    <ellipse cx="100" cy="78" rx="34" ry="42" fill="${p[3]}" opacity="0.55"/>
  </svg>`;
}

export function synthPainting(seed: number): string {
  let s = (seed * 31 + 7) | 0;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const palettes = [
    ["#3a2410","#7a3a1a","#c47636","#e3a052","#f0c890","#1a1410"],
    ["#102338","#1d4565","#3a7ba8","#7eb0d1","#c4d8e8","#0a1620"],
    ["#3a1228","#6e2545","#a44871","#cf78a0","#e8a8c8","#1a0a14"],
    ["#1f2818","#3e5230","#6b8852","#9bbc7a","#cae0a8","#0c1208"],
    ["#1a1d2a","#2c3445","#5d6d8a","#94a4bd","#c4d0e0","#0e1018"],
  ];
  const palette = palettes[Math.abs(seed) % palettes.length];
  const w = 400, h = 500;
  let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">`;
  svg += `<rect width="${w}" height="${h}" fill="${palette[5]}"/>`;
  for (let i = 0; i < 14; i++) {
    const cx = rand() * w, cy = rand() * h;
    const rx = 60 + rand() * 180, ry = 50 + rand() * 150;
    const c = palette[Math.floor(rand() * 5)];
    const op = 0.18 + rand() * 0.32;
    svg += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="${c}" opacity="${op.toFixed(2)}"/>`;
  }
  for (let i = 0; i < 22; i++) {
    const x1 = rand() * w, y1 = rand() * h;
    const x2 = x1 + (rand() - 0.5) * 200, y2 = y1 + (rand() - 0.5) * 220;
    const cx1 = (x1 + x2) / 2 + (rand() - 0.5) * 80, cy1 = (y1 + y2) / 2 + (rand() - 0.5) * 80;
    const c = palette[Math.floor(rand() * 5)];
    const sw = 1.5 + rand() * 6;
    const op = 0.4 + rand() * 0.4;
    svg += `<path d="M${x1.toFixed(0)},${y1.toFixed(0)} Q${cx1.toFixed(0)},${cy1.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)}" stroke="${c}" stroke-width="${sw.toFixed(1)}" fill="none" opacity="${op.toFixed(2)}" stroke-linecap="round"/>`;
  }
  svg += `</svg>`;
  return svg;
}
