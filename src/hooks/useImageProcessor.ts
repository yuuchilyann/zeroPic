import { useState, useCallback, useEffect, useRef } from 'react'
import {
  processImage,
  getImageInfo,
  getOutputExtension,
  formatBytes,
  DEFAULT_OPTIONS,
  type ImageInfo,
  type ProcessOptions,
  type ResizeOptions,
  type CropOptions,
  type FilterOptions,
} from '../utils/imageProcessor'

export interface ProcessState {
  originalFile: File | null
  originalInfo: ImageInfo | null
  originalPreviewUrl: string | null
  processedBlob: Blob | null
  processedPreviewUrl: string | null
  processedSize: number | null
  options: ProcessOptions
  estimatedSize: number | null
  isEstimating: boolean
  targetSize: number | null
  isOptimizing: boolean
  isProcessing: boolean
  error: string | null
}

const initialState: ProcessState = {
  originalFile: null,
  originalInfo: null,
  originalPreviewUrl: null,
  processedBlob: null,
  processedPreviewUrl: null,
  processedSize: null,
  options: DEFAULT_OPTIONS,
  estimatedSize: null,
  isEstimating: false,
  targetSize: null,
  isOptimizing: false,
  isProcessing: false,
  error: null,
}

export function useImageProcessor() {
  const [state, setState] = useState<ProcessState>(initialState)

  const fileRef = useRef<File | null>(null)
  const optionsRef = useRef<ProcessOptions>(DEFAULT_OPTIONS)
  const targetRef = useRef<number | null>(null)

  useEffect(() => { optionsRef.current = state.options }, [state.options])
  useEffect(() => { targetRef.current = state.targetSize }, [state.targetSize])

  // ── 即時估算（options 變動後 debounce 400ms）─────────────────────
  const optionsKey = JSON.stringify(state.options)
  useEffect(() => {
    if (!state.originalFile) return
    setState((s) => ({ ...s, isEstimating: true, estimatedSize: null }))
    const file = state.originalFile
    const opts: ProcessOptions = JSON.parse(optionsKey)
    const timer = setTimeout(async () => {
      try {
        const blob = await processImage(file, opts)
        setState((s) => ({ ...s, estimatedSize: blob.size, isEstimating: false }))
      } catch {
        setState((s) => ({ ...s, isEstimating: false }))
      }
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.originalFile, optionsKey])

  // ── 載入圖片 ─────────────────────────────────────────────────────
  const loadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setState((s) => ({ ...s, error: '請選擇有效的圖片檔案' }))
      return
    }
    setState((s) => {
      if (s.originalPreviewUrl) URL.revokeObjectURL(s.originalPreviewUrl)
      if (s.processedPreviewUrl) URL.revokeObjectURL(s.processedPreviewUrl)
      return { ...initialState, options: s.options, targetSize: s.targetSize, isProcessing: true }
    })
    fileRef.current = file
    try {
      const info = await getImageInfo(file)
      const previewUrl = URL.createObjectURL(file)
      setState((s) => ({
        ...s,
        originalFile: file,
        originalInfo: info,
        originalPreviewUrl: previewUrl,
        isProcessing: false,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        isProcessing: false,
        error: err instanceof Error ? err.message : '載入圖片失敗',
      }))
    }
  }, [])

  // ── 套用並產生輸出 ────────────────────────────────────────────────
  const runProcess = useCallback(() => {
    const file = fileRef.current
    const opts = optionsRef.current
    if (!file) return

    setState((s) => {
      if (s.processedPreviewUrl) URL.revokeObjectURL(s.processedPreviewUrl)
      return { ...s, isProcessing: true, error: null, processedBlob: null, processedPreviewUrl: null, processedSize: null }
    })

    processImage(file, opts)
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        setState((s) => ({
          ...s,
          processedBlob: blob,
          processedPreviewUrl: url,
          processedSize: blob.size,
          isProcessing: false,
        }))
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          isProcessing: false,
          error: err instanceof Error ? err.message : '處理失敗',
        }))
      })
  }, [])

  // ── Options 更新 ──────────────────────────────────────────────────
  const updateOptions = useCallback((patch: Partial<ProcessOptions>) => {
    setState((s) => ({ ...s, options: { ...s.options, ...patch } }))
  }, [])

  const updateResize = useCallback((patch: Partial<ResizeOptions>) => {
    setState((s) => ({
      ...s,
      options: { ...s.options, resize: { ...s.options.resize, ...patch } },
    }))
  }, [])

  const updateCrop = useCallback((patch: Partial<CropOptions>) => {
    setState((s) => ({
      ...s,
      options: { ...s.options, crop: { ...s.options.crop, ...patch } },
    }))
  }, [])

  const updateFilters = useCallback((patch: Partial<FilterOptions>) => {
    setState((s) => ({
      ...s,
      options: { ...s.options, filters: { ...s.options.filters, ...patch } },
    }))
  }, [])

  // ── 目標容量 ──────────────────────────────────────────────────────
  const setTargetSize = useCallback((bytes: number | null) => {
    setState((s) => ({ ...s, targetSize: bytes }))
  }, [])

  // ── 自動最佳化（二分搜尋）────────────────────────────────────────
  const autoOptimize = useCallback(async () => {
    const file = fileRef.current
    const opts = optionsRef.current
    const target = targetRef.current
    if (!file || !target) return

    setState((s) => ({ ...s, isOptimizing: true, error: null }))

    try {
      const minBlob = await processImage(file, { ...opts, quality: 1 })
      if (minBlob.size > target) {
        setState((s) => ({
          ...s,
          isOptimizing: false,
          error: `即使品質降至最低仍有 ${formatBytes(minBlob.size)}，無法達到目標容量`,
        }))
        return
      }

      let lo = 1
      let hi = 100
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2)
        const blob = await processImage(file, { ...opts, quality: mid })
        if (blob.size <= target) lo = mid
        else hi = mid - 1
      }

      setState((s) => ({
        ...s,
        isOptimizing: false,
        options: { ...s.options, quality: lo },
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        isOptimizing: false,
        error: err instanceof Error ? err.message : '最佳化失敗',
      }))
    }
  }, [])

  // ── 下載 ──────────────────────────────────────────────────────────
  const download = useCallback(() => {
    setState((s) => {
      if (!s.processedBlob || !s.originalInfo) return s
      const ext = getOutputExtension(s.options.format)
      const base = s.originalInfo.name.replace(/\.[^.]+$/, '')
      const a = document.createElement('a')
      a.href = s.processedPreviewUrl!
      a.download = `${base}_zeropic.${ext}`
      a.click()
      return s
    })
  }, [])

  // ── 重設 ──────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setState((s) => {
      if (s.originalPreviewUrl) URL.revokeObjectURL(s.originalPreviewUrl)
      if (s.processedPreviewUrl) URL.revokeObjectURL(s.processedPreviewUrl)
      return { ...initialState }
    })
    fileRef.current = null
  }, [])

  return {
    state,
    loadFile,
    runProcess,
    updateOptions,
    updateResize,
    updateCrop,
    updateFilters,
    setTargetSize,
    autoOptimize,
    download,
    reset,
  }
}
