"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { useT } from "@/components/i18n-provider"

/**
 * Registers the service worker and offers the update rather than taking it.
 *
 * A silent swap would reload the page under someone mid-way through an editor,
 * so a new build waits until the toast is accepted — the same bargain the old
 * app struck with `registerType: "prompt"`.
 */
export function PwaRegister() {
  const t = useT()

  const prompted = useRef(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    let registration: ServiceWorkerRegistration | undefined

    const offerUpdate = (waiting: ServiceWorker) => {
      if (prompted.current) return
      prompted.current = true
      toast.info(t.pwa.updateAvailable, {
        duration: Infinity,
        action: {
          label: t.pwa.reload,
          onClick: () => waiting.postMessage("SKIP_WAITING"),
        },
      })
    }

    const watch = (reg: ServiceWorkerRegistration) => {
      registration = reg
      // Already waiting from a previous visit.
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting)

      reg.addEventListener("updatefound", () => {
        const installing = reg.installing
        if (!installing) return
        installing.addEventListener("statechange", () => {
          // With no controller this is the first install, not an update —
          // there is nothing for the user to accept.
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            offerUpdate(installing)
          }
        })
      })
    }

    // Reload once the new worker has actually taken over, so the page that
    // comes back is the new build rather than a race with the old one.
    let reloading = false
    const onControllerChange = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(watch)
      .catch((error) => {
        console.error("service worker registration failed", error)
      })

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
      registration = undefined
    }
  }, [t])

  return null
}
