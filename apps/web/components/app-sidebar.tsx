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

import { useLocale, useT } from "@/components/i18n-provider"
import { localeDir } from "@/lib/i18n"

// The old app crammed seven destinations into a horizontally scrolling strip.
// A sidebar shows all of them at once on desktop and collapses to a drawer on
// a phone, which is where this app is actually used.

// Routes and icons are static; the labels are not, so they are looked up per
// render from the dictionary rather than frozen here.
const DOCUMENTS = [
  { href: "/receipts", key: "receipts", icon: Invoice01Icon },
  { href: "/ledgers", key: "ledgers", icon: BookOpen01Icon },
  { href: "/pricelists", key: "priceLists", icon: Note01Icon },
  { href: "/manreceipts", key: "manReceipts", icon: WeightScaleIcon },
] as const

const REFERENCE = [
  { href: "/clients", key: "clients", icon: UserGroupIcon },
  { href: "/products", key: "products", icon: PackageIcon },
  { href: "/settings", key: "settings", icon: Settings01Icon },
] as const

export function AppSidebar({
  companyName,
  logoUrl,
}: {
  companyName: string
  logoUrl: string | null
}) {
  const t = useT()

  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const locale = useLocale()

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
    <Sidebar side={localeDir(locale) === "rtl" ? "right" : "left"} collapsible="icon">
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
            {companyName || t.appName}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.documents}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DOCUMENTS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} onClick={closeOnMobile} />}
                    isActive={isActive(item.href)}
                    tooltip={t.nav[item.key]}
                  >
                    <HugeiconsIcon icon={item.icon} />
                    <span>{t.nav[item.key]}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.manage}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {REFERENCE.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} onClick={closeOnMobile} />}
                    isActive={isActive(item.href)}
                    tooltip={t.nav[item.key]}
                  >
                    <HugeiconsIcon icon={item.icon} />
                    <span>{t.nav[item.key]}</span>
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
