"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { deleteClient, saveClient } from "@/actions/reference"
import { fa } from "@/lib/fa"
import type { Client } from "@/lib/types"

export function ClientsManager({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Client | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const openNew = () => {
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setOpen(true)
  }

  const submit = async (formData: FormData) => {
    setSaving(true)
    const result = await saveClient(editing?.id ?? null, formData)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setOpen(false)
    toast.success(fa.common.saved)
    router.refresh()
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{fa.clients.title}</h1>
        <Button onClick={openNew}>
          <HugeiconsIcon icon={Add01Icon} />
          {fa.clients.new}
        </Button>
      </div>

      {clients.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
          {fa.clients.empty}
        </p>
      ) : (
        <ul className="grid gap-2">
          {clients.map((client) => (
            <li
              key={client.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{client.name}</div>
                <div className="text-muted-foreground truncate text-sm">
                  {[client.phone, client.address].filter(Boolean).join(" · ")}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={fa.actions.edit}
                onClick={() => openEdit(client)}
              >
                <HugeiconsIcon icon={Edit02Icon} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={fa.actions.delete}
                onClick={async () => {
                  await deleteClient(client.id)
                  toast.success(fa.common.deleted)
                  router.refresh()
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? fa.clients.edit : fa.clients.new}
            </DialogTitle>
          </DialogHeader>

          {/* Keyed on the row being edited so the uncontrolled fields reset
              when a different client is opened. */}
          <form action={submit} key={editing?.id ?? "new"} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{fa.common.name}</Label>
              <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{fa.common.phone}</Label>
              <Input
                id="phone"
                name="phone"
                dir="ltr"
                inputMode="tel"
                defaultValue={editing?.phone ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">{fa.common.address}</Label>
              <Input id="address" name="address" defaultValue={editing?.address ?? ""} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? fa.editor.saving : fa.actions.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
