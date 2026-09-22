"use client"

import html2canvas from "html2canvas-pro"
import { jsPDF } from "jspdf"

// Sheets are exported by rasterising the DOM node. That is why the templates
// are inline-styled at a fixed width — what you see is what gets captured.

const SCALE = 2

async function renderCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  // Without this the capture can race the webfont and render Persian text in a
  // fallback face.
  if (document.fonts?.ready) await document.fonts.ready

  const width = node.offsetWidth
  const height = node.offsetHeight

  return html2canvas(node, {
    scale: SCALE,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: Math.max(width, 1024),
    windowHeight: Math.max(height, 768),
  })
}

// A4 portrait with the margin the PDF uses, expressed as the sheet's own
// aspect ratio so image pages and PDF pages break in the same places.
const A4 = { width: 595.28, height: 841.89, margin: 24 }
const PAGE_RATIO = (A4.height - A4.margin * 2) / (A4.width - A4.margin * 2)

// Where a page may end, in canvas pixels: just above each table row, and the
// bottom of the sheet. Cutting elsewhere would slice through a line of text.
function breakCandidates(node: HTMLElement, canvasHeight: number): number[] {
  const top = node.getBoundingClientRect().top
  const points = Array.from(node.querySelectorAll("tr")).map(
    (tr) => Math.round((tr.getBoundingClientRect().top - top) * SCALE)
  )
  return [...new Set([...points, canvasHeight])].sort((a, b) => a - b)
}

// Slices a tall canvas into page-sized pieces, ending each page at the last
// row boundary that fits. A single row taller than a page is cut regardless.
function paginate(canvas: HTMLCanvasElement, node: HTMLElement): HTMLCanvasElement[] {
  const pageHeight = Math.floor(canvas.width * PAGE_RATIO)
  if (canvas.height <= pageHeight) return [canvas]

  const candidates = breakCandidates(node, canvas.height)
  const pages: HTMLCanvasElement[] = []
  let y = 0
  while (y < canvas.height) {
    const limit = y + pageHeight
    const fitting = candidates.filter((p) => p > y && p <= limit)
    const end = fitting.length ? fitting[fitting.length - 1]! : Math.min(limit, canvas.height)

    const page = document.createElement("canvas")
    page.width = canvas.width
    page.height = end - y
    const ctx = page.getContext("2d")!
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, page.width, page.height)
    ctx.drawImage(canvas, 0, y, canvas.width, end - y, 0, 0, canvas.width, end - y)
    pages.push(page)
    y = end
  }
  return pages
}

export async function exportAsImage(node: HTMLElement, filename: string) {
  const pages = paginate(await renderCanvas(node), node)
  for (const [i, page] of pages.entries()) {
    const blob = await new Promise<Blob | null>((resolve) =>
      page.toBlob(resolve, "image/png", 0.95)
    )
    if (!blob) throw new Error("could not encode image")
    const suffix = pages.length > 1 ? `-${i + 1}` : ""
    triggerDownload(blob, `${filename}${suffix}.png`)
    // Browsers drop back-to-back downloads that fire in the same tick.
    if (i < pages.length - 1) await new Promise((r) => setTimeout(r, 300))
  }
}

export async function exportAsPdf(node: HTMLElement, filename: string) {
  const pages = paginate(await renderCanvas(node), node)

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" })
  const width = A4.width - A4.margin * 2

  pages.forEach((page, i) => {
    if (i > 0) pdf.addPage()
    const height = width * (page.height / page.width)
    pdf.addImage(page.toDataURL("image/png"), "PNG", A4.margin, A4.margin, width, height)
  })

  pdf.save(`${filename}.pdf`)
}

// An installed iOS app has no print dialog: window.print() is silently a
// no-op there. The PDF goes to the share sheet instead, where AirPrint lives.
export function canPrint(): boolean {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1)
  const standalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  return !(ios && standalone)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
