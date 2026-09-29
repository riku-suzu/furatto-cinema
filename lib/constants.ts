// "今すぐ観れる映画" only searches this radius — a cinema further than this
// isn't reachable "right now", so there's no point listing it.
export const NOW_RADIUS_METERS = 5000;

/** 映画館一覧で選べる検索範囲 */
export const CINEMA_RADII_METERS = [5000, 10000, 15000];
