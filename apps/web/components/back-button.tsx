"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"

import { useT } from "@/components/i18n-provider"

// Back climbs one level of the URL rather than replaying browser history:
// after saving a new receipt the previous history entry is the blank form,
// and on a deep link opened fresh there is no history at all. The parent
// route is what people mean by "back" in both cases.
function parentPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null
  return "/" + segments.slice(0, -1).join("/")
}

export function BackButton() {
  const t = useT()
  const pathname = usePathname()
  const href = parentPath(pathname)

  if (!href) return null

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t.actions.back}
      render={<Link href={href} />}
      nativeButton={false}
    >
      {/* Back is rightward in an RTL page, so the arrow flips with direction. */}
      <HugeiconsIcon icon={ArrowLeft01Icon} className="rtl:rotate-180" />
    </Button>
  )
}
