"use client"

import { Input } from "@workspace/ui/components/input"

import { toLatinDigits } from "@/lib/calc"

// Numeric fields in an RTL page: the text runs left-to-right, and Persian or
// Arabic-Indic digits typed on a phone keyboard are normalised on the way in,
// because Number("۱۲۳") is NaN.
export function NumberInput({
  value,
  onValueChange,
  onBlurValue,
  className,
  ...props
}: {
  value: string
  onValueChange: (value: string) => void
  /** Called on blur — where snapToFive is applied, never mid-typing. */
  onBlurValue?: (value: string) => void
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onBlur">) {
  return (
    <Input
      {...props}
      value={value}
      dir="ltr"
      inputMode="decimal"
      className={className}
      onChange={(e) => onValueChange(toLatinDigits(e.target.value))}
      onBlur={(e) => onBlurValue?.(toLatinDigits(e.target.value))}
    />
  )
}
