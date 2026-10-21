// ヘッダー画像（ターミナル風）をライト／ダーク2種類生成する
// 使い方: node scripts/build-header.mjs
import { writeFileSync } from "node:fs";

const content = {
  user: "takuto-nohara",
  nameJa: "野原 拓人",
  nameEn: "Takuto Nohara",
  role: "Webエンジニアをめざす大学生",
  affiliation: "工学院大学 / 株式会社Zequt",
  motto: "欲しいものが見当たらないなら、自分で作る。",
};

// GitHub のライト／ダークそれぞれで十分なコントラストが出る配色
const themes = {
  dark: {
    page: "#0d1117", window: "#161b22", bar: "#21262d", border: "#30363d",
    text: "#f0f6fc", muted: "#b1bac4", prompt: "#3fb950", accent: "#ffa657",
  },
  light: {
    page: "#ffffff", window: "#f6f8fa", bar: "#eaeef2", border: "#d0d7de",
    text: "#1f2328", muted: "#4b535d", prompt: "#1a7f37", accent: "#bc4c00",
  },
};

const MONO = "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace";
const SANS = "'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic UI', 'Meiryo', system-ui, sans-serif";

const W = 720;
const H = 380;

function svg(t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">${content.nameJa}（${content.nameEn}）</title>
  <desc id="desc">${content.role}。${content.affiliation}。モットー：${content.motto}</desc>
  <style>
    .mono { font-family: ${MONO}; }
    .sans { font-family: ${SANS}; }
    .type { transform-box: fill-box; transform-origin: left; animation: type 0.7s steps(10) both; }
    .t2 { animation-delay: 1.6s; }
    .fade { animation: fade 0.5s ease-out both; }
    .d1 { animation-delay: 0.9s; } .d2 { animation-delay: 1.15s; } .d3 { animation-delay: 2.5s; }
    .cursor { animation: blink 1.1s step-end infinite; }
    @keyframes type { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
  <defs>
    <clipPath id="c1"><rect class="type" x="56" y="78" width="150" height="34"/></clipPath>
    <clipPath id="c2"><rect class="type t2" x="56" y="268" width="240" height="34"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="${t.page}"/>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="12" fill="${t.window}" stroke="${t.border}"/>
  <path d="M8 20a12 12 0 0 1 12-12h${W - 40}a12 12 0 0 1 12 12v24H8z" fill="${t.bar}"/>
  <line x1="8" y1="44" x2="${W - 8}" y2="44" stroke="${t.border}"/>
  <circle cx="32" cy="26" r="6" fill="#ff5f57"/>
  <circle cx="52" cy="26" r="6" fill="#febc2e"/>
  <circle cx="72" cy="26" r="6" fill="#28c840"/>
  <text x="${W / 2}" y="31" text-anchor="middle" class="mono" font-size="14" fill="${t.muted}">${content.user} — profile</text>

  <g clip-path="url(#c1)">
    <text x="56" y="104" class="mono" font-size="22"><tspan fill="${t.prompt}" font-weight="700">$</tspan><tspan fill="${t.text}"> whoami</tspan></text>
  </g>
  <g class="fade d1">
    <text x="56" y="168" class="sans" font-size="50" font-weight="700" fill="${t.text}">${content.nameJa}<tspan dx="20" class="mono" font-size="26" font-weight="400" fill="${t.muted}">${content.nameEn}</tspan></text>
  </g>
  <g class="fade d2">
    <text x="56" y="210" class="sans" font-size="24" fill="${t.text}">${content.role}</text>
    <text x="56" y="244" class="sans" font-size="20" fill="${t.muted}">${content.affiliation}</text>
  </g>

  <g clip-path="url(#c2)">
    <text x="56" y="294" class="mono" font-size="22"><tspan fill="${t.prompt}" font-weight="700">$</tspan><tspan fill="${t.text}"> cat motto.txt</tspan></text>
  </g>
  <g class="fade d3">
    <text x="56" y="340" class="sans" font-size="26" font-weight="700" fill="${t.accent}">${content.motto}<tspan class="cursor" fill="${t.prompt}"> ▍</tspan></text>
  </g>
</svg>
`;
}

for (const [name, theme] of Object.entries(themes)) {
  const out = new URL(`../assets/header-${name}.svg`, import.meta.url);
  writeFileSync(out, svg(theme));
  console.log(`wrote ${out.pathname}`);
}
