// APIルートの共通レスポンス

import { NextResponse } from "next/server";

/** `{ error: message }` のJSONでエラーを返す */
export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** 例外のメッセージ。Error以外が投げられたときはfallback */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
