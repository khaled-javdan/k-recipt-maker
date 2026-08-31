"use client"

import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

import { LayoutWidthToggle } from "@/components/layout-width"
import { signOut } from "@/actions/auth"
import { fa } from "@/lib/fa"
import type { CurrentUser } from "@/lib/dal"

export function AppHeader({ user }: { user: CurrentUser }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur print:hidden">
      <SidebarTrigger />

      <span className="text-sm font-medium">{user.displayName}</span>

      <div className="ms-auto flex items-center gap-1">
        <LayoutWidthToggle />

        {/* The server cannot know the viewer's theme, so picking an icon from
            resolvedTheme mismatches on hydration. Both are rendered and CSS
            shows the right one, which also avoids an icon flash on load. */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={fa.shell.theme}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <HugeiconsIcon icon={Moon02Icon} className="dark:hidden" />
          <HugeiconsIcon icon={Sun01Icon} className="hidden dark:block" />
        </Button>

        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label={fa.auth.signOut}
          >
            <HugeiconsIcon icon={Logout01Icon} />
          </Button>
        </form>
      </div>
    </header>
  )
}
