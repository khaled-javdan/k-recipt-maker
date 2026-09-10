import { HugeiconsIcon } from "@hugeicons/react"
import { WifiDisconnected01Icon } from "@hugeicons/core-free-icons"

import { getT } from "@/lib/i18n/server"

// What the service worker serves when a navigation finds no network. It carries
// no user data on purpose: the worker precaches it once, and whoever is holding
// the phone sees it — signed in or not.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.pwa.offlineTitle} — ${t.appName}` }
}

export default async function OfflinePage() {
  const t = await getT()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center">
      <HugeiconsIcon
        icon={WifiDisconnected01Icon}
        className="text-muted-foreground size-10"
      />
      <h1 className="text-lg font-semibold">{t.pwa.offlineTitle}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">{t.pwa.offlineBody}</p>
    </div>
  )
}
