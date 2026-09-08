"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Invoice01Icon,
  Note01Icon,
  PackageIcon,
  Settings01Icon,
  UserGroupIcon,
  WeightScaleIcon,
} from "@hugeicons/core-free-icons"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"

import { fa } from "@/lib/fa"

// The old app crammed seven destinations into a horizontally scrolling strip.
// A sidebar shows all of them at once on desktop and collapses to a drawer on
// a phone, which is where this app is actually used.

const DOCUMENTS = [
  { href: "/receipts", label: fa.nav.receipts, icon: Invoice01Icon },
  { href: "/ledgers", label: fa.nav.ledgers, icon: BookOpen01Icon },
  { href: "/pricelists", label: fa.nav.priceLists, icon: Note01Icon },
  { href: "/manreceipts", label: fa.nav.manReceipts, icon: WeightScaleIcon },
] as const

const REFERENCE = [
  { href: "/clients", label: fa.nav.clients, icon: UserGroupIcon },
  { href: "/products", label: fa.nav.products, icon: PackageIcon },
  { href: "/settings", label: fa.nav.settings, icon: Settings01Icon },
] as const

export function AppSidebar({
  companyName,
  logoUrl,
}: {
  companyName: string
  logoUrl: string | null
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  // On a phone the sidebar is a drawer covering the page, so following a link
  // has to dismiss it — otherwise the destination is behind the drawer and it
  // takes a second tap to see where you just went.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  // A document's own pages (/receipts/new, /receipts/:id) keep its nav item
  // highlighted, but /pricelists must not light up for /pricelists/catalog's
  // sibling section — prefix matching on the segment boundary handles both.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader>
        {/* The logo has to survive the collapsed rail, where the name is
            hidden and the icon-sized square is all that is left. */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="size-6 shrink-0 rounded-sm object-contain"
            />
          ) : null}
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {companyName || fa.appName}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{fa.nav.documents}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DOCUMENTS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} onClick={closeOnMobile} />}
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <HugeiconsIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{fa.nav.manage}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {REFERENCE.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} onClick={closeOnMobile} />}
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <HugeiconsIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
