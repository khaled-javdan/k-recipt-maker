import { cookies } from "next/headers"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import {
  LAYOUT_WIDTH_COOKIE,
  LayoutWidthContainer,
  LayoutWidthProvider,
} from "@/components/layout-width"
import { getSettings } from "@/lib/data"
import { requireUser } from "@/lib/dal"

// Everything inside this group is signed-in-only. requireUser() here is the
// authorisation gate; proxy.ts merely avoids the round trip for signed-out
// visitors and is not trusted.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, settings, cookieStore] = await Promise.all([
    requireUser(),
    getSettings(),
    cookies(),
  ])

  // Narrow unless the user has explicitly asked for full width: capped content
  // is the readable default, and only an opted-in cookie widens it.
  const layoutWidth =
    cookieStore.get(LAYOUT_WIDTH_COOKIE)?.value === "wide" ? "wide" : "narrow"

  return (
    <LayoutWidthProvider defaultWidth={layoutWidth}>
      <SidebarProvider>
        <AppSidebar companyName={settings.companyName} />
        <SidebarInset>
          <AppHeader user={user} />
          <div className="flex-1 p-4 md:p-6">
            <LayoutWidthContainer>{children}</LayoutWidthContainer>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </LayoutWidthProvider>
  )
}
