"use client"

import { useTransition } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Globe02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { setLocale } from "@/actions/locale"
import { useLocale, useT } from "@/components/i18n-provider"
import { LOCALES, type Locale } from "@/lib/i18n"

// Each language is labelled in its own script, so someone who has landed in a
// language they cannot read can still find their way back out.
export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useT()
  const [pending, startTransition] = useTransition()

  const choose = (next: string) => {
    if (next === locale) return
    // A transition keeps the current page on screen while the server re-renders
    // the whole tree in the new language.
    startTransition(() => {
      void setLocale(next as Locale)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.shell.language}
            disabled={pending}
          />
        }
      >
        <HugeiconsIcon icon={Globe02Icon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={choose}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code}>
              <span dir={l.dir}>{l.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
