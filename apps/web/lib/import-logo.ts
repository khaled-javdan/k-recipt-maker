import { put } from "@vercel/blob"

// The old app kept the logo as a base64 data: URI inside its localStorage blob.
// This app stores a Blob URL, so the logo has to be decoded and uploaded before
// the import transaction opens — a network round trip does not belong inside a
// transaction holding locks on every table the user owns.

const MAX_LOGO_BYTES = 2 * 1024 * 1024

// Mirrors the allowed types in actions/settings.ts: anything that will not
// paint on a printed sheet is not worth carrying across.
const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

export type LogoResult =
  | { status: "uploaded"; url: string }
  | { status: "absent" }
  | { status: "skipped"; reason: string }

export async function importLogo(
  userId: string,
  dataUri: string | null | undefined
): Promise<LogoResult> {
  if (!dataUri) return { status: "absent" }

  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUri.trim())
  if (!match) return { status: "skipped", reason: "لوگو در قالب data: نبود" }

  const [, contentType, base64] = match
  const ext = LOGO_TYPES[contentType!]
  if (!ext) {
    return { status: "skipped", reason: `نوع تصویر پشتیبانی نمی‌شود: ${contentType}` }
  }

  const buffer = Buffer.from(base64!, "base64")
  if (buffer.byteLength === 0) return { status: "skipped", reason: "لوگو خالی بود" }
  if (buffer.byteLength > MAX_LOGO_BYTES) {
    return { status: "skipped", reason: "حجم لوگو بیش از ۲ مگابایت است" }
  }

  // A missing token must not sink the import: the documents cannot be
  // re-entered by hand, the logo can be re-uploaded in Settings in seconds.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { status: "skipped", reason: "BLOB_READ_WRITE_TOKEN تنظیم نشده است" }
  }

  try {
    // addRandomSuffix keeps a re-import from being served from the CDN copy of
    // the file it replaced, which is what a stable pathname would do.
    const blob = await put(`logos/${userId}.${ext}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    })
    return { status: "uploaded", url: blob.url }
  } catch (error) {
    return {
      status: "skipped",
      reason: error instanceof Error ? error.message : "بارگذاری لوگو ناموفق بود",
    }
  }
}
