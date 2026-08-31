"use client"

import { useEffect } from "react"

// Warns before a full page unload with unsaved edits. In-app navigation is
// handled by the editors' own confirmation, since the App Router has no
// blocker equivalent to the old react-router one.
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Browsers ignore custom text now, but returnValue still triggers the
      // native prompt.
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])
}
