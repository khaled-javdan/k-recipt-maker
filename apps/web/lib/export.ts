"use client"

import html2canvas from "html2canvas-pro"
import { jsPDF } from "jspdf"

// Sheets are exported by rasterising the DOM node. That is why the templates
// are inline-styled at a fixed width — what you see is what gets captured.

async function renderCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  // Without this the capture can race the webfont and render Persian text in a
  // fallback face.
  if (document.fonts?.ready) await document.fonts.ready

  const width = node.offsetWidth
  const height = node.offsetHeight

  return html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: Math.max(width, 1024),
    windowHeight: Math.max(height, 768),
  })
}

export async function exportAsImage(node: HTMLElement, filename: string) {
  const canvas = await renderCanvas(node)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png", 0.95)
  )
  if (!blob) throw new Error("could not encode image")
  triggerDownload(blob, `${filename}.png`)
}

export async function exportAsPdf(node: HTMLElement, filename: string) {
  const canvas = await renderCanvas(node)
  const image = canvas.toDataURL("image/png")

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 24
  const ratio = canvas.height / canvas.width

  const width = pageWidth - margin * 2
  const height = width * ratio

  if (height <= pageHeight - margin * 2) {
    pdf.addImage(image, "PNG", margin, margin, width, height)
  } else {
    // Taller than a page: scale to fit the height and centre it, matching the
    // original app rather than silently cropping.
    const scaledWidth = (pageHeight - margin * 2) / ratio
    pdf.addImage(
      image,
      "PNG",
      (pageWidth - scaledWidth) / 2,
      margin,
      scaledWidth,
      pageHeight - margin * 2
    )
  }

  pdf.save(`${filename}.pdf`)
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
