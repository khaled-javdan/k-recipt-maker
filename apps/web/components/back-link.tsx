"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"

import { useT } from "@/components/i18n-provider"

// The way out of a sub-page, back to whatever it hangs off: the list for a
// document, the document for its editor. The destination is explicit rather
// than browser history, which after a save would lead back to the blank form.
export function BackLink({
  href,
  onClick,
}: {
  href: string
  /** Intercepts the navigation; call preventDefault to stop it. */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  const t = useT()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ms-2 print:hidden"
      render={<Link href={href} onClick={onClick} />}
      nativeButton={false}
    >
      {/* Back is rightward in an RTL page, so the arrow flips with direction. */}
      <HugeiconsIcon icon={ArrowLeft01Icon} className="rtl:rotate-180" />
      {t.actions.back}
    </Button>
  )
}
