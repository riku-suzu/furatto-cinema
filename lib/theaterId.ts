// アプリ内の映画館ID（= eiga.comの映画館ページのURLの3セグメントを繋いだもの）
//   "/theater/13/130301/3035/" ⇔ "13-130301-3035"
// クライアントからも使うので、ここではサーバー専用のモジュールをimportしない。

const THEATER_ID = /^(\d{1,2})-(\d+)-(\d+)$/;
const THEATER_PATH = /^\/theater\/(\d+)\/(\d+)\/(\d+)\/$/;

/** eiga.comの館ID（"13-130201-3263"）か。旧形式のGoogle place_idならfalse */
export function isTheaterId(id: string): boolean {
  return THEATER_ID.test(id);
}

/** "13-130301-3035" → "/theater/13/130301/3035/"（形式が不正ならnull） */
export function theaterPathFromId(id: string): string | null {
  const m = id.match(THEATER_ID);
  return m ? `/theater/${Number(m[1])}/${m[2]}/${m[3]}/` : null;
}

/** "/theater/13/130301/3035/" → "13-130301-3035"（映画館ページのパスでなければnull） */
export function theaterIdFromPath(path: string): string | null {
  const m = path.match(THEATER_PATH);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** 館IDの都道府県コード（2桁ゼロ埋め） */
export function prefCodeFromTheaterId(id: string): string {
  return id.split("-")[0].padStart(2, "0");
}
