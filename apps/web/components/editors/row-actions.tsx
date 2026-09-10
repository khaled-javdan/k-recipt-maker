"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalIcon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { useT } from "@/components/i18n-provider"

// Per-row menu shared by every editor. Sheets get built out of order — a line
// remembered late belongs above the one just typed — so inserting and moving
// matter as much as appending.
export function RowActions({
  index,
  rowCount,
  onInsertAbove,
  onInsertBelow,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number
  rowCount: number
  onInsertAbove: () => void
  onInsertBelow: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  const t = useT()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t.actions.rowActions} />
        }
      >
        <HugeiconsIcon icon={MoreVerticalIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onInsertAbove}>
          {t.actions.insertAbove}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onInsertBelow}>
          {t.actions.insertBelow}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>{t.actions.duplicate}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={index === 0} onClick={onMoveUp}>
          {t.actions.moveUp}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === rowCount - 1} onClick={onMoveDown}>
          {t.actions.moveDown}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* The last row is never removable: an editor with no rows has no
            focusable cell and no obvious way back. */}
        <DropdownMenuItem
          variant="destructive"
          disabled={rowCount <= 1}
          onClick={onRemove}
        >
          {t.actions.remove}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
