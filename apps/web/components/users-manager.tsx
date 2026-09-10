"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@workspace/ui/components/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  createUser,
  resetUserPassword,
  revokeUserSessions,
  setUserActive,
} from "@/actions/users"
import { useT } from "@/components/i18n-provider"

export type ManagedUser = {
  id: string
  username: string
  displayName: string
  role: "ADMIN" | "USER"
  isActive: boolean
  sessionCount: number
}

export function UsersManager({
  users,
  currentUserId,
}: {
  users: ManagedUser[]
  currentUserId: string
}) {
  const t = useT()

  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<ManagedUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState<"ADMIN" | "USER">("USER")

  const run = async (fn: () => Promise<{ error?: string }>) => {
    const result = await fn()
    if (result.error) {
      toast.error(result.error)
      return false
    }
    router.refresh()
    return true
  }

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.settings.users}</h1>
        <Button
          onClick={() => {
            setRole("USER")
            setCreating(true)
          }}
        >
          {t.settings.newUser}
        </Button>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">{t.settings.usersDesc}</p>

      <ul className="grid gap-2">
        {users.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{user.displayName}</span>
                {user.role === "ADMIN" ? (
                  <Badge variant="secondary">{t.settings.roleAdmin}</Badge>
                ) : null}
                {!user.isActive ? (
                  <Badge variant="destructive">{t.settings.inactive}</Badge>
                ) : null}
              </div>
              <div className="text-muted-foreground truncate text-sm" dir="ltr">
                {user.username} · {t.settings.sessions}: {user.sessionCount}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setResetting(user)}>
              {t.settings.resetPassword}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={user.sessionCount === 0}
              onClick={async () => {
                if (await run(() => revokeUserSessions(user.id))) {
                  toast.success(t.common.saved)
                }
              }}
            >
              {t.settings.revokeSessions}
            </Button>

            {/* Deactivating yourself would leave nobody able to undo it, so the
                control is absent for the signed-in admin. */}
            {user.id === currentUserId ? null : (
              <Button
                variant={user.isActive ? "destructive" : "outline"}
                size="sm"
                onClick={async () => {
                  if (await run(() => setUserActive(user.id, !user.isActive))) {
                    toast.success(t.common.saved)
                  }
                }}
              >
                {user.isActive ? t.settings.inactive : t.settings.active}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.settings.newUser}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            action={async (formData) => {
              formData.set("role", role)
              setSaving(true)
              const ok = await run(() => createUser(formData))
              setSaving(false)
              if (ok) {
                setCreating(false)
                toast.success(t.common.saved)
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="displayName">{t.settings.displayName}</Label>
              <Input id="displayName" name="displayName" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">{t.settings.username}</Label>
              <Input id="username" name="username" dir="ltr" autoCapitalize="none" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t.settings.password}</Label>
              <Input id="password" name="password" type="password" dir="ltr" required />
            </div>
            <div className="grid gap-2">
              <Label>{t.settings.role}</Label>
              <Select value={role} onValueChange={(v) => setRole((v as "ADMIN" | "USER") ?? "USER")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">{t.settings.roleUser}</SelectItem>
                  <SelectItem value="ADMIN">{t.settings.roleAdmin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {t.actions.create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetting)} onOpenChange={(o) => !o && setResetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.settings.resetPassword}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            key={resetting?.id ?? "none"}
            action={async (formData) => {
              formData.set("userId", resetting?.id ?? "")
              setSaving(true)
              const ok = await run(() => resetUserPassword(formData))
              setSaving(false)
              if (ok) {
                setResetting(null)
                toast.success(t.common.saved)
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="newPassword">{t.settings.password}</Label>
              <Input id="newPassword" name="password" type="password" dir="ltr" required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {t.actions.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
