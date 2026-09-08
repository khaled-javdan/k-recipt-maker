"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// A document being typed exists only in the tab until the server accepts it,
// and this app is used on a phone on mobile data before dawn. A save that fails
// — or a tab that closes first — used to take the work with it.
//
// So the editor state is mirrored into localStorage on every keystroke and
// offered back the next time the same editor opens. The copy is per-device and
// per-document, cleared the moment the server has the real thing.

const PREFIX = "receipt-maker:draft:"

type Stored<T> = { at: number; value: T }

export function draftKey(key: string): string {
  return `${PREFIX}${key}`
}

// Every accessor is wrapped: storage throws outright in a private window and
// on a quota, and a draft is a safety net that must never stop the editor from
// opening or a keystroke from registering.
export function readDraft<T>(key: string): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(draftKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored<T>
    if (!parsed || typeof parsed !== "object" || !("value" in parsed)) return null
    return parsed.value
  } catch {
    return null
  }
}

export function writeDraft<T>(key: string, value: T): void {
  try {
    const payload: Stored<T> = { at: Date.now(), value }
    globalThis.localStorage?.setItem(draftKey(key), JSON.stringify(payload))
  } catch {
    // Quota or a private window.
  }
}

export function clearDraft(key: string): void {
  try {
    globalThis.localStorage?.removeItem(draftKey(key))
  } catch {
    // The copy is disposable by design.
  }
}

export function useDraft<T>(key: string, value: T, dirty: boolean) {
  // Read once, before the first write can overwrite it. A draft found here is
  // work from a previous visit that never reached the server.
  const [found, setFound] = useState<T | null>(null)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    setFound(readDraft<T>(key))
  }, [key])

  // Only a dirty document is worth keeping. Writing a pristine one would
  // clobber a real draft with the very state it was meant to replace.
  useEffect(() => {
    if (!dirty || !checked.current) return
    writeDraft(key, value)
  }, [key, value, dirty])

  const clear = useCallback(() => {
    setFound(null)
    clearDraft(key)
  }, [key])

  // Keeps the stored copy but stops offering it, for when the user has just
  // restored it into the form.
  const dismiss = useCallback(() => setFound(null), [])

  // Memoised: editors depend on this object in an effect, and a fresh one each
  // render would re-fire that effect and stack a recovery toast per keystroke.
  return useMemo(() => ({ found, clear, dismiss }), [found, clear, dismiss])
}
