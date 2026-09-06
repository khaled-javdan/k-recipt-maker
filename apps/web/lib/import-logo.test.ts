import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { importLogo } from "./import-logo"

// The logo is the one thing in a backup that cannot be inserted as-is: the old
// app stored a base64 data: URI and this app stores a Blob URL. Every rejection
// path has to end in "skipped" rather than a throw, because losing the logo is
// recoverable in Settings and losing the import is not.

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

describe("importLogo", () => {
  const original = process.env.BLOB_READ_WRITE_TOKEN

  beforeEach(() => {
    // Every case here must resolve before any upload is attempted, so the
    // tests never reach the network.
    delete process.env.BLOB_READ_WRITE_TOKEN
  })

  afterEach(() => {
    if (original === undefined) delete process.env.BLOB_READ_WRITE_TOKEN
    else process.env.BLOB_READ_WRITE_TOKEN = original
  })

  it("reports absent when the backup has no logo", async () => {
    expect(await importLogo("u1", undefined)).toEqual({ status: "absent" })
    expect(await importLogo("u1", null)).toEqual({ status: "absent" })
    expect(await importLogo("u1", "")).toEqual({ status: "absent" })
  })

  it("skips a value that is not a data: URI", async () => {
    const result = await importLogo("u1", "https://example.com/logo.png")
    expect(result.status).toBe("skipped")
  })

  it("skips an image type that will not paint on a sheet", async () => {
    const result = await importLogo("u1", "data:image/heic;base64,AAAA")
    expect(result).toMatchObject({ status: "skipped" })
    expect(result).toHaveProperty("reason", expect.stringContaining("image/heic"))
  })

  it("skips anything over the 2 MB ceiling", async () => {
    const huge = `data:image/png;base64,${"A".repeat(3 * 1024 * 1024)}`
    expect(await importLogo("u1", huge)).toMatchObject({ status: "skipped" })
  })

  it("skips rather than throws when no Blob token is configured", async () => {
    const result = await importLogo("u1", PNG)
    expect(result).toMatchObject({ status: "skipped" })
    expect(result).toHaveProperty("reason", expect.stringContaining("BLOB_READ_WRITE_TOKEN"))
  })
})
