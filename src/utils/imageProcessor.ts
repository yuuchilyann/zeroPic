export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp'
export type Rotation = 0 | 90 | 180 | 270

export interface ImageInfo {
  name: string
  size: number
  width: number
  height: number
  type: string
}

export interface ResizeOptions {
  enabled: boolean
  width: number | null
  height: number | null
  keepAspectRatio: boolean
}

export interface CropOptions {
  enabled: boolean
  x: number
  y: number
  width: number
  height: number
}

export interface FilterOptions {
  grayscale: number   // 0–100
  brightness: number  // 0–200 (100 = normal)
  contrast: number    // 0–200 (100 = normal)
}

export interface ProcessOptions {
  quality: number
  format: OutputFormat
  crop: CropOptions
  resize: ResizeOptions
  rotation: Rotation
  flipH: boolean
  flipV: boolean
  filters: FilterOptions
}

export const DEFAULT_OPTIONS: ProcessOptions = {
  quality: 80,
  format: 'image/jpeg',
  crop: { enabled: false, x: 0, y: 0, width: 0, height: 0 },
  resize: { enabled: false, width: null, height: null, keepAspectRatio: true },
  rotation: 0,
  flipH: false,
  flipV: false,
  filters: { grayscale: 0, brightness: 100, contrast: 100 },
}

// ── 取得圖片基本資訊 ───────────────────────────────────────────────
export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        name: file.name,
        size: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
        type: file.type,
      })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('無法讀取圖片')) }
    img.src = url
  })
}

// ── 計算縮放後的繪製尺寸 ──────────────────────────────────────────
function calcDrawSize(
  srcW: number,
  srcH: number,
  resize: ResizeOptions,
): { drawW: number; drawH: number } {
  if (!resize.enabled || (!resize.width && !resize.height)) {
    return { drawW: srcW, drawH: srcH }
  }
  const { width, height, keepAspectRatio } = resize
  if (!keepAspectRatio) {
    return { drawW: width ?? srcW, drawH: height ?? srcH }
  }
  const ratio = srcW / srcH
  if (width && height) {
    const scale = Math.min(width / srcW, height / srcH)
    return { drawW: Math.round(srcW * scale), drawH: Math.round(srcH * scale) }
  }
  if (width) return { drawW: width, drawH: Math.round(width / ratio) }
  return { drawW: Math.round(height! * ratio), drawH: height! }
}

// ── 主處理函式（Canvas API）────────────────────────────────────────
export async function processImage(
  file: File,
  options: ProcessOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // 裁切來源區域（預設為整張圖）
      const { crop } = options
      const cropActive = crop.enabled && crop.width > 0 && crop.height > 0
      const sx = cropActive ? Math.max(0, crop.x) : 0
      const sy = cropActive ? Math.max(0, crop.y) : 0
      const sw = cropActive ? Math.min(crop.width, img.naturalWidth - sx) : img.naturalWidth
      const sh = cropActive ? Math.min(crop.height, img.naturalHeight - sy) : img.naturalHeight

      // 縮放目標尺寸（以裁切後的尺寸為基準）
      const { drawW, drawH } = calcDrawSize(sw, sh, options.resize)

      // 90° / 270° 旋轉後 Canvas 寬高互換
      const isSwapped = options.rotation === 90 || options.rotation === 270
      const canvasW = isSwapped ? drawH : drawW
      const canvasH = isSwapped ? drawW : drawH

      const canvas = document.createElement('canvas')
      canvas.width = canvasW
      canvas.height = canvasH

      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('無法取得 Canvas context')); return }

      // CSS filter（灰階 / 亮度 / 對比）
      const { grayscale, brightness, contrast } = options.filters
      const filterParts: string[] = []
      if (grayscale > 0) filterParts.push(`grayscale(${grayscale}%)`)
      if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`)
      if (contrast !== 100) filterParts.push(`contrast(${contrast}%)`)
      if (filterParts.length) ctx.filter = filterParts.join(' ')

      // 幾何變換：移至中心 → 旋轉 → 翻轉
      ctx.translate(canvasW / 2, canvasH / 2)
      if (options.rotation) ctx.rotate((options.rotation * Math.PI) / 180)
      ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1)

      // 裁切 + 縮放一步到位
      ctx.drawImage(img, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('圖片處理失敗')); return }
          resolve(blob)
        },
        options.format,
        options.quality / 100,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('無法載入圖片')) }
    img.src = url
  })
}

// ── 工具函式 ───────────────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function getOutputExtension(format: OutputFormat): string {
  const map: Record<OutputFormat, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return map[format]
}
