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

export function AppSidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname()

  // A document's own pages (/receipts/new, /receipts/:id) keep its nav item
  // highlighted, but /pricelists must not light up for /pricelists/catalog's
  // sibling section — prefix matching on the segment boundary handles both.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="truncate text-sm font-semibold">
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
                    render={<Link href={item.href} />}
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
                    render={<Link href={item.href} />}
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
