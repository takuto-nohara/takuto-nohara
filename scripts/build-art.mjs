// KawaiiLogos 風のステッカー SVG（ヘッダー・見出し）を生成する
// 文字はフォントからパスに変換して埋め込むので、閲覧環境のフォントに左右されない
// 使い方: npm install && node scripts/build-art.mjs
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";

const FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/mochiypopone/MochiyPopOne-Regular.ttf";
const FONT_PATH = new URL("./fonts/MochiyPopOne-Regular.ttf", import.meta.url);

if (!existsSync(FONT_PATH)) {
  mkdirSync(new URL("./fonts/", import.meta.url), { recursive: true });
  const res = await fetch(FONT_URL);
  writeFileSync(FONT_PATH, Buffer.from(await res.arrayBuffer()));
}
const font = opentype.loadSync(FONT_PATH.pathname.replace(/^\/([A-Z]:)/, "$1"));

// アイコン（夜空・三日月・星）に合わせた配色
const C = {
  ink: "#0a2150",     // 夜空の紺: 影・小さい文字
  sky: "#2f6fe0",     // 夜空の明るい青
  moon: "#f5a43a",    // 三日月の琥珀色
  star: "#ffd56b",    // 星の黄色
  white: "#ffffff",
  night: "url(#night)", // 名前・見出し用の青グラデーション
  amber: "url(#amber)",
};

const DEFS = `<defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5c9bff"/><stop offset=".55" stop-color="#2f6fe0"/><stop offset="1" stop-color="#1b45a8"/>
    </linearGradient>
    <linearGradient id="amber" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffc35a"/><stop offset="1" stop-color="#ec8a24"/>
    </linearGradient>
  </defs>`;

// 白フチ・影用に、文字の穴（o や a の内側）を除いた外側の輪郭だけを返す
// TrueType は外側と内側で輪郭の向きが逆なので、面積の符号で見分ける
function outerOnly(path) {
  const contours = [];
  let cur = null;
  for (const c of path.commands) {
    if (c.type === "M") contours.push((cur = [c]));
    else cur.push(c);
  }
  const area = (cmds) => {
    let a = 0;
    const pts = cmds.filter((c) => c.type !== "Z").map((c) => [c.x, c.y]);
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      a += x1 * y2 - x2 * y1;
    }
    return a / 2;
  };
  const areas = contours.map(area);
  const sign = Math.sign(areas.reduce((m, a) => (Math.abs(a) > Math.abs(m) ? a : m), 0));
  const p = new opentype.Path();
  contours.forEach((cmds, i) => {
    if (Math.sign(areas[i]) === sign) p.commands.push(...cmds);
  });
  return p.toPathData(2);
}

// 1 文字ずつパスにする（アニメーションを文字単位でかけるため）
function glyphs(text, x, y, size, spacing = 0) {
  const out = [];
  let cx = x;
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (ch !== " ") {
      const path = g.getPath(cx, y, size);
      out.push({ full: path.toPathData(2), outer: outerOnly(path) });
    }
    cx += (g.advanceWidth / font.unitsPerEm) * size + spacing;
  }
  return { paths: out, width: cx - x - spacing };
}

function measure(text, size, spacing = 0) {
  return glyphs(text, 0, 0, size, spacing).width;
}

// ステッカー 1 パーツ: 濃い影 → 白フチ → 塗り を文字ごとに同期して重ねる
function sticker(text, { x, y, size, fill, spacing = 0, outline, shadow, anim = "", delay = 0, step = 0.06 }) {
  const { paths } = glyphs(text, x, y, size, spacing);
  const o = outline ?? size * 0.22;
  const s = shadow ?? size * 0.08;
  const layer = (key, attrs) =>
    paths
      .map((p, i) => `<path class="${anim}" style="animation-delay:${(delay + i * step).toFixed(2)}s" d="${p[key]}" ${attrs}/>`)
      .join("");
  // translate を path に付けると CSS の transform で上書きされるので、影はグループでずらす
  return `<g>
    <g transform="translate(${s * 0.4} ${s})">${layer("outer", `fill="${C.ink}" stroke="${C.ink}" stroke-width="${o * 2}" stroke-linejoin="round"`)}</g>
    <g>${layer("outer", `fill="${C.white}" stroke="${C.white}" stroke-width="${o * 2}" stroke-linejoin="round"`)}</g>
    <g>${layer("full", `fill="${fill}"`)}</g>
  </g>`;
}

// アイコンと同じ三日月（外側の円から内側の円をくり抜いた形）
function crescent(cx, cy, r, delay) {
  const ix = cx + r * 0.42;
  const iy = cy - r * 0.3;
  const ir = r * 0.82;
  const d = `M${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Z`;
  const hole = `M${ix + ir} ${iy}A${ir} ${ir} 0 1 0 ${ix - ir} ${iy}A${ir} ${ir} 0 1 0 ${ix + ir} ${iy}Z`;
  return `<g class="sway" style="animation-delay:${delay}s">
    <mask id="moon-cut"><rect x="${cx - r * 2}" y="${cy - r * 2}" width="${r * 4}" height="${r * 4}" fill="#fff"/><path d="${hole}" fill="#000"/></mask>
    <g mask="url(#moon-cut)">
      <path d="${d}" fill="${C.ink}" stroke="${C.ink}" stroke-width="${r * 0.5}" transform="translate(3 6)"/>
      <path d="${d}" fill="${C.white}" stroke="${C.white}" stroke-width="${r * 0.5}"/>
      <path d="${d}" fill="${C.amber}"/>
    </g>
  </g>`;
}

// 4 方向にとがったキラキラ
function sparkle(cx, cy, r, fill, delay) {
  const k = r * 0.28;
  const d = `M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`;
  return `<g class="twinkle" style="animation-delay:${delay}s">
    <path d="${d}" fill="${C.white}" stroke="${C.white}" stroke-width="${r * 0.5}" stroke-linejoin="round"/>
    <path d="${d}" fill="${fill}"/>
  </g>`;
}

const STYLE = `<style>
    .pop { transform-box: fill-box; transform-origin: 50% 80%; animation: pop .55s cubic-bezier(.34,1.7,.5,1) both, wave 4s ease-in-out 2s infinite; }
    .fade { animation: fade .5s ease-out both; }
    .slide { animation: slide .6s cubic-bezier(.34,1.5,.5,1) both; }
    @keyframes slide { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: none; } }
    .sway { transform-box: fill-box; transform-origin: center; animation: sway 5s ease-in-out infinite; }
    @keyframes sway { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
    .twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 2.4s ease-in-out infinite; }
    @keyframes pop { from { transform: scale(0) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes wave { 0%, 12%, 100% { transform: none; } 6% { transform: translateY(-10%) rotate(-4deg); } }
    @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes twinkle { 0%, 100% { transform: scale(1) rotate(0); } 50% { transform: scale(.6) rotate(45deg); } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>`;

function svgDoc(w, h, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
  <title>${title}</title>
  ${STYLE}
  ${DEFS}
  ${body}
</svg>
`;
}

// ---------- ヘッダー ----------
function header() {
  const W = 1100;
  const H = 420;
  const nameSize = 112;
  const nameSpacing = -4;
  const name = "Takuto Nohara";
  const nameW = measure(name, nameSize, nameSpacing);
  const nx = (W - nameW) / 2;
  const ny = 250;

  const body = `<g transform="rotate(-4 ${W / 2} ${H / 2})">
    ${sticker("</>", { x: nx - 10, y: ny - 128, size: 46, fill: C.amber, anim: "pop", delay: 0.1 })}
    ${sticker("のはら たくと", { x: nx + 120, y: ny - 128, size: 40, fill: C.ink, spacing: 2, anim: "pop", delay: 0.2, step: 0.05 })}
    ${sticker(name, { x: nx, y: ny, size: nameSize, fill: C.night, spacing: nameSpacing, anim: "pop", delay: 0.5, step: 0.07 })}
    <g class="fade" style="animation-delay:1.5s">
      ${sticker("Web Developer", { x: nx + 10, y: ny + 80, size: 40, fill: C.amber })}
    </g>
    <g class="fade" style="animation-delay:1.8s">
      ${sticker("欲しいものは、自分で作る！", { x: nx + nameW - measure("欲しいものは、自分で作る！", 34) - 10, y: ny + 128, size: 34, fill: C.ink })}
    </g>
  </g>
  ${crescent(W - 90, 78, 44, 0)}
  ${sparkle(W - 170, 40, 16, C.star, 0.4)}
  ${sparkle(W - 30, 160, 13, C.star, 1.1)}
  ${sparkle(40, 390, 18, C.star, 1.6)}
  ${sparkle(90, 60, 11, C.star, 0.9)}`;
  return svgDoc(W, H, "Takuto Nohara（のはら たくと）Web Developer 欲しいものは、自分で作る！", body);
}

// ---------- 見出し ----------
function heading(title, kana, color) {
  const size = 64;
  const titleW = measure(title, size, -1);
  const kanaW = measure(kana, 30);
  const pad = 28;
  const W = Math.ceil(Math.max(titleW, kanaW + 40) + pad * 2);
  const H = 150;
  const body = `<g transform="rotate(-2 ${W / 2} ${H / 2})">
    ${sticker(kana, { x: pad + 40, y: 48, size: 30, fill: C.ink, spacing: 1, anim: "pop", step: 0.04 })}
    ${sticker(title, { x: pad, y: 120, size, fill: color, spacing: -1, anim: "pop", delay: 0.3, step: 0.06 })}
  </g>`;
  return svgDoc(W, H, `${title}（${kana}）`, body);
}

// ---------- 自己紹介 ----------
// ラベル（がっこう など）の札。白抜き文字の角丸ステッカー
function tag(text, x, y, size, fill) {
  const w = measure(text, size, 1) + size * 1.1;
  const h = size * 1.7;
  const top = y - size * 1.22;
  const rect = (attrs) => `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${h / 2}" ${attrs}/>`;
  const { paths } = glyphs(text, x + size * 0.55, y, size, 1);
  return {
    width: w,
    svg: `${rect(`fill="${C.ink}" stroke="${C.ink}" stroke-width="10" transform="translate(2 5)"`)}
    ${rect(`fill="${C.white}" stroke="${C.white}" stroke-width="10"`)}
    ${rect(`fill="${fill}"`)}
    ${paths.map((p) => `<path d="${p.full}" fill="${C.white}"/>`).join("")}`,
  };
}

// 1 行 = ラベル + 文（強調したい語だけ青にする）
function aboutRow(label, parts, y, delay) {
  const size = 40;
  const t = tag(label, 30, y, 26, C.amber);
  let x = 30 + 175;
  const segs = parts.map(([text, fill]) => {
    const svg = sticker(text, { x, y, size, fill, outline: size * 0.18 });
    x += measure(text, size) + 6;
    return svg;
  });
  return {
    width: x,
    svg: `<g class="slide" style="animation-delay:${delay}s">${t.svg}${segs.join("")}</g>`,
  };
}

function about() {
  const rows = [
    aboutRow("がっこう", [["工学院大学", C.night], ["の学生です", C.ink]], 72, 0.2),
    aboutRow("しごと", [["株式会社Zequt", C.night], ["でWeb開発をしています", C.ink]], 164, 0.5),
    aboutRow("はじまり", [["動画編集", C.night], ["からものづくりを始めました", C.ink]], 256, 0.8),
  ];
  const W = Math.ceil(Math.max(...rows.map((r) => r.width)) + 30);
  const H = 296;
  const body = `<g transform="rotate(-1 ${W / 2} ${H / 2})">${rows.map((r) => r.svg).join("")}</g>`;
  return svgDoc(W, H, "工学院大学の学生です。株式会社ZequtでWeb開発をしています。動画編集からものづくりを始めました。", body);
}

const out = (name) => new URL(`../assets/${name}`, import.meta.url);
writeFileSync(out("about.svg"), about());
writeFileSync(out("kawaii-header.svg"), header());
writeFileSync(out("heading-about.svg"), heading("About Me", "じこしょうかい", C.night));
writeFileSync(out("heading-stack.svg"), heading("Tech Stack", "つかっているぎじゅつ", C.amber));
console.log("done");
