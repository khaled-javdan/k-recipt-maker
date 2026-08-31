"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowExpand02Icon,
  ArrowShrink02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { fa } from "@/lib/fa"

// Wide screens stretch a receipt's rows across the whole monitor, which makes
// the table hard to read. The toggle lets the user cap the content width and
// come back to full width; the choice is remembered in a cookie so the server
// renders the right one and the page never flashes at the wrong width.
export const LAYOUT_WIDTH_COOKIE = "layout_width"
const LAYOUT_WIDTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type LayoutWidth = "narrow" | "wide"

type LayoutWidthContextValue = {
  width: LayoutWidth
  toggleWidth: () => void
}

const LayoutWidthContext = createContext<LayoutWidthContextValue | null>(null)

function useLayoutWidth() {
  const context = useContext(LayoutWidthContext)
  if (!context) {
    throw new Error("useLayoutWidth must be used within a LayoutWidthProvider.")
  }

  return context
}

export function LayoutWidthProvider({
  defaultWidth = "wide",
  children,
}: {
  defaultWidth?: LayoutWidth
  children: React.ReactNode
}) {
  const [width, setWidth] = useState<LayoutWidth>(defaultWidth)

  const toggleWidth = useCallback(() => {
    setWidth((current) => {
      const next: LayoutWidth = current === "wide" ? "narrow" : "wide"
      document.cookie = `${LAYOUT_WIDTH_COOKIE}=${next}; path=/; max-age=${LAYOUT_WIDTH_COOKIE_MAX_AGE}`
      return next
    })
  }, [])

  return (
    <LayoutWidthContext.Provider value={{ width, toggleWidth }}>
      {children}
    </LayoutWidthContext.Provider>
  )
}

/** Hidden on phones, where the content is already as narrow as it gets. */
export function LayoutWidthToggle() {
  const { width, toggleWidth } = useLayoutWidth()
  const isNarrow = width === "narrow"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="hidden md:inline-flex"
      aria-pressed={isNarrow}
      aria-label={isNarrow ? fa.shell.expandLayout : fa.shell.narrowLayout}
      onClick={toggleWidth}
    >
      <HugeiconsIcon icon={isNarrow ? ArrowExpand02Icon : ArrowShrink02Icon} />
    </Button>
  )
}

export function LayoutWidthContainer({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { width } = useLayoutWidth()

  return (
    <div
      data-layout-width={width}
      className={cn(
        // max-width animates only between two interpolatable values, so the
        // wide state is an explicit 100% rather than `none`. Timing matches
        // the sidebar so the two shell animations read as one movement.
        "mx-auto w-full max-w-full transition-[max-width] duration-200 ease-linear",
        width === "narrow" && "md:max-w-5xl",
        "motion-reduce:transition-none print:max-w-none",
        className
      )}
    >
      {children}
    </div>
  )
}
