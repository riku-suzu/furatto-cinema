// 映画館名のあいまい一致。Google Placesの名前（英語表記のこともある）と
// eiga.comの館名を対応付けるのに使う。

// 英語チェーン名 → eiga.com表記への正規化マップ
const CHAIN_ALIASES: [RegExp, string][] = [
  [/\baeon\s*cinema\b/i, "イオンシネマ"],
  [/\b109\s*cinemas?\b/i, "109シネマズ"],
  [/\btoho\s*cinemas?\b/i, "TOHOシネマズ"],
  [/\bunited\s*cinemas?\b/i, "ユナイテッドシネマ"],
  [/\bmovix\b/i, "ムービックス"],
  [/\bcine\s*citta\b/i, "チネチッタ"],
  [/\bkino\s*cinema\b/i, "キノシネマ"],
];

// 「シネマ」「シアター」などはほぼ全館に含まれるので、比較前に取り除いて
// 館名の固有部分（地名・ブランド名）だけで比べる。残すと "Cinema 77" と
// "CINEMA NEKO" のような無関係な館同士が高スコアになってしまう。
const GENERIC_WORDS = /シネマズ|シネマ|シアター|cinemas?|theat(?:er|re)s?|映画館|劇場|スクリーン/gi;

/** これ未満の類似度は別の映画館とみなす */
const MATCH_THRESHOLD = 0.4;

/** 比較用に名前を正規化: 全角→半角、アクセント除去、英語チェーン名→日本語、汎用語・記号除去 */
function normalizeName(name: string, keepGeneric = false): string {
  let s = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // "cinéma" → "cinema"
    .normalize("NFKC");                // "１０９" → "109"
  for (const [pattern, ja] of CHAIN_ALIASES) s = s.replace(pattern, ja);
  if (!keepGeneric) s = s.replace(GENERIC_WORDS, "");
  return s.replace(/[\s・()「」【】\-－'’&]/g, "").toLowerCase();
}

/** 完全一致1、包含0.9、それ以外はbigramのDice係数 */
function diceSimilarity(na: string, nb: string): number {
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const bigrams = (s: string) => new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)));
  const sa = bigrams(na);
  const sb = bigrams(nb);
  if (sa.size === 0 || sb.size === 0) return 0;
  const intersection = [...sa].filter((x) => sb.has(x)).length;
  return (2 * intersection) / (sa.size + sb.size);
}

/**
 * 映画館名の類似度（0〜1強）。汎用語を除いた固有部分で比べ、
 * 同点を崩すため、汎用語込みの一致度を小さく加点する
 * （商業施設「なんばパークス」より「なんばパークスシネマ」を優先させる）。
 */
function nameSimilarity(a: string, b: string): number {
  const core = diceSimilarity(normalizeName(a), normalizeName(b));
  if (core === 0) return 0;
  return core + 0.01 * diceSimilarity(normalizeName(a, true), normalizeName(b, true));
}

/** 名前が最も近い候補を返す（同点なら先にあるもの。閾値未満ならnull） */
export function findClosestByName<T extends { name: string }>(name: string, candidates: T[]): T | null {
  let best: T | null = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = nameSimilarity(name, candidate.name);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return bestScore >= MATCH_THRESHOLD ? best : null;
}
