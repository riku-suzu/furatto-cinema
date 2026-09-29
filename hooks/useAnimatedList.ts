"use client";

import { useEffect, useLayoutEffect, useState } from "react";

export interface AnimatedItem<T> {
  key: string;
  item: T;
  /** enter: 出現アニメーション中 / stay: 表示済み / exit: 消える途中 */
  state: "enter" | "stay" | "exit";
  /** 出現アニメーションの開始を遅らせる時間（少しずつずらして出す） */
  delayMs: number;
  /** 出現を始めた時刻（出現しきる前に消されたかの判定に使う） */
  since: number;
}

interface Options {
  enterMs?: number;   // 出現アニメーションの長さ（CSSと合わせる）
  exitMs?: number;    // 消えるアニメーションの長さ（CSSと合わせる）
  staggerMs?: number; // 1件ごとのずらし幅
  maxStagger?: number; // ずらすのは先頭から何件目まで
  exitStaggerMs?: number; // 消えるときの1件ごとのずらし幅
}

/**
 * リストの差分に出入りの状態を付ける。
 * - 追加された項目は少しずつずらして出現させる
 * - 消えた項目はexitMsの間だけ元の位置に残し、フェードアウトさせてから取り除く
 * - まだ見えていない（出現待ち・出現途中の）項目が消えた場合は、一瞬見せたりせずにすぐ取り除く
 */
export function useAnimatedList<T>(
  items: T[],
  getKey: (item: T) => string,
  { enterMs = 800, exitMs = 650, staggerMs = 70, maxStagger = 12, exitStaggerMs = 55 }: Options = {}
): AnimatedItem<T>[] {
  const [entries, setEntries] = useState<AnimatedItem<T>[]>([]);

  // 描画前に差分を反映する（useEffectだと消えるはずの項目が1〜2フレーム見えてしまう）
  useLayoutEffect(() => {
    const now = performance.now();
    setEntries((prev) => {
      const prevByKey = new Map(prev.filter((e) => e.state !== "exit").map((e) => [e.key, e]));
      const nextKeys = new Set(items.map(getKey));
      const stillEntering = (e: AnimatedItem<T>) => e.state === "enter" && now < e.since + e.delayMs + enterMs;

      let added = 0;
      const next: AnimatedItem<T>[] = items.map((item) => {
        const key = getKey(item);
        const old = prevByKey.get(key);
        if (old) {
          // 出現途中のものはそのままアニメーションを続けさせる
          return stillEntering(old) ? { ...old, item } : { key, item, state: "stay", delayMs: 0, since: old.since };
        }
        const delayMs = Math.min(added++, maxStagger) * staggerMs;
        return { key, item, state: "enter", delayMs, since: now };
      });

      // 消えた項目を、元の並び順を保ったまま差し込む
      const merged: AnimatedItem<T>[] = [];
      const pushed = new Set<string>();
      let ni = 0;
      let exiting = 0;
      for (const e of prev) {
        if (nextKeys.has(e.key)) {
          if (pushed.has(e.key)) continue;
          // 前にあった項目の位置まで、新しいリストを進める
          while (ni < next.length) {
            const n = next[ni++];
            merged.push(n);
            pushed.add(n.key);
            if (n.key === e.key) break;
          }
        } else if (e.state === "exit") {
          merged.push(e); // 消える途中のものはそのまま続ける
        } else if (!stillEntering(e)) {
          // 上から順に少しずつずらして消す
          merged.push({ ...e, state: "exit", delayMs: Math.min(exiting++, maxStagger) * exitStaggerMs, since: now });
        }
        // 出現しきる前に消された項目は、一瞬見せたりせずにすぐ捨てる
      }
      while (ni < next.length) merged.push(next[ni++]);
      return merged;
    });
    // getKey は呼び出し側で毎回作られうるので依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, enterMs, staggerMs, maxStagger, exitStaggerMs]);

  // 消えるアニメーションが終わった項目から取り除く
  const exitDoneAt = Math.max(-Infinity, ...entries.filter((e) => e.state === "exit").map((e) => e.since + e.delayMs + exitMs));
  useEffect(() => {
    if (!Number.isFinite(exitDoneAt)) return;
    const t = setTimeout(
      () => setEntries((prev) => prev.filter((e) => e.state !== "exit" || e.since + e.delayMs + exitMs > performance.now())),
      Math.max(0, exitDoneAt - performance.now())
    );
    return () => clearTimeout(t);
  }, [exitDoneAt, exitMs]);

  return entries;
}
