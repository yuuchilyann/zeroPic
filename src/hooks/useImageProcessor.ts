import { useState, useCallback, useEffect, useRef } from 'react'
import JSZip from 'jszip'
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

export type ItemStatus = 'idle' | 'processing' | 'done' | 'error'

export interface ImageItem {
  id: string
  file: File
  info: ImageInfo
  originalUrl: string
  processedBlob: Blob | null
  processedUrl: string | null
  processedSize: number | null
  status: ItemStatus
  errorMsg?: string
}

export interface ProcessState {
  items: ImageItem[]
  selectedId: string | null
  options: ProcessOptions
  estimatedSize: number | null
  isEstimating: boolean
  targetSize: number | null
  isOptimizing: boolean
  isProcessing: boolean       // 單張處理中（選中項）
  isBatchProcessing: boolean  // 全部處理中
  isLoading: boolean
  isZipping: boolean
  batchProgress: { done: number; total: number } | null
  error: string | null
}

const initialState: ProcessState = {
  items: [],
  selectedId: null,
  options: DEFAULT_OPTIONS,
  estimatedSize: null,
  isEstimating: false,
  targetSize: null,
  isOptimizing: false,
  isProcessing: false,
  isBatchProcessing: false,
  isLoading: false,
  isZipping: false,
  batchProgress: null,
  error: null,
}

const BATCH_CONCURRENCY = 3

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function revokeItem(item: ImageItem) {
  URL.revokeObjectURL(item.originalUrl)
  if (item.processedUrl) URL.revokeObjectURL(item.processedUrl)
}

export function useImageProcessor() {
  const [state, setState] = useState<ProcessState>(initialState)

  const optionsRef = useRef<ProcessOptions>(DEFAULT_OPTIONS)
  const targetRef = useRef<number | null>(null)
  const itemsRef = useRef<ImageItem[]>([])
  const selectedIdRef = useRef<string | null>(null)

  useEffect(() => { optionsRef.current = state.options }, [state.options])
  useEffect(() => { targetRef.current = state.targetSize }, [state.targetSize])
  useEffect(() => { itemsRef.current = state.items }, [state.items])
  useEffect(() => { selectedIdRef.current = state.selectedId }, [state.selectedId])

  const selected = state.items.find((i) => i.id === state.selectedId) ?? null

  // ── 即時估算（針對選中項；options 變動 debounce 400ms）─────────
  const optionsKey = JSON.stringify(state.options)
  const selectedFile = selected?.file ?? null
  useEffect(() => {
    if (!selectedFile) {
      setState((s) => ({ ...s, estimatedSize: null, isEstimating: false }))
      return
    }
    setState((s) => ({ ...s, isEstimating: true, estimatedSize: null }))
    const opts: ProcessOptions = JSON.parse(optionsKey)
    const timer = setTimeout(async () => {
      try {
        const blob = await processImage(selectedFile, opts)
        setState((s) =>
          s.selectedId && itemsRef.current.find((i) => i.id === s.selectedId)?.file === selectedFile
            ? { ...s, estimatedSize: blob.size, isEstimating: false }
            : s,
        )
      } catch {
        setState((s) => ({ ...s, isEstimating: false }))
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [selectedFile, optionsKey])

  // ── 載入多檔（追加到佇列）──────────────────────────────────────
  const loadFiles = useCallback(async (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('image/'))
    if (valid.length === 0) {
      setState((s) => ({ ...s, error: '請選擇有效的圖片檔案' }))
      return
    }

    setState((s) => ({ ...s, isLoading: true, error: null }))

    const newItems: ImageItem[] = []
    for (const file of valid) {
      try {
        const info = await getImageInfo(file)
        newItems.push({
          id: makeId(),
          file,
          info,
          originalUrl: URL.createObjectURL(file),
          processedBlob: null,
          processedUrl: null,
          processedSize: null,
          status: 'idle',
        })
      } catch {
        // 跳過無法讀取的檔案
      }
    }

    setState((s) => {
      const merged = [...s.items, ...newItems]
      return {
        ...s,
        items: merged,
        selectedId: s.selectedId ?? newItems[0]?.id ?? null,
        isLoading: false,
        error: newItems.length < valid.length
          ? `${valid.length - newItems.length} 個檔案無法讀取`
          : null,
      }
    })
  }, [])

  const selectItem = useCallback((id: string) => {
    setState((s) => ({ ...s, selectedId: id }))
  }, [])

  const removeItem = useCallback((id: string) => {
    setState((s) => {
      const target = s.items.find((i) => i.id === id)
      if (target) revokeItem(target)
      const remaining = s.items.filter((i) => i.id !== id)
      let nextSelected = s.selectedId
      if (s.selectedId === id) {
        const idx = s.items.findIndex((i) => i.id === id)
        nextSelected = remaining[idx]?.id ?? remaining[idx - 1]?.id ?? remaining[0]?.id ?? null
      }
      return { ...s, items: remaining, selectedId: nextSelected }
    })
  }, [])

  // ── 處理單一 item（內部）──────────────────────────────────────
  async function processOne(id: string, opts: ProcessOptions): Promise<void> {
    const item = itemsRef.current.find((i) => i.id === id)
    if (!item) return
    setState((s) => ({
      ...s,
      items: s.items.map((i) =>
        i.id === id
          ? { ...i, status: 'processing', errorMsg: undefined }
          : i,
      ),
    }))
    try {
      const blob = await processImage(item.file, opts)
      const url = URL.createObjectURL(blob)
      setState((s) => ({
        ...s,
        items: s.items.map((i) => {
          if (i.id !== id) return i
          if (i.processedUrl) URL.revokeObjectURL(i.processedUrl)
          return {
            ...i,
            processedBlob: blob,
            processedUrl: url,
            processedSize: blob.size,
            status: 'done',
          }
        }),
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        items: s.items.map((i) =>
          i.id === id
            ? { ...i, status: 'error', errorMsg: err instanceof Error ? err.message : '處理失敗' }
            : i,
        ),
      }))
    }
  }

  // ── 套用並預覽（僅選中項）────────────────────────────────────
  const runProcess = useCallback(async () => {
    const id = selectedIdRef.current
    if (!id) return
    setState((s) => ({ ...s, isProcessing: true, error: null }))
    await processOne(id, optionsRef.current)
    setState((s) => ({ ...s, isProcessing: false }))
  }, [])

  // ── 批次處理全部 ─────────────────────────────────────────────
  const runProcessAll = useCallback(async () => {
    const ids = itemsRef.current.map((i) => i.id)
    if (ids.length === 0) return
    setState((s) => ({
      ...s,
      isBatchProcessing: true,
      error: null,
      batchProgress: { done: 0, total: ids.length },
    }))

    let cursor = 0
    let completed = 0
    const opts = optionsRef.current

    async function worker() {
      while (cursor < ids.length) {
        const idx = cursor++
        await processOne(ids[idx], opts)
        completed++
        setState((s) => ({ ...s, batchProgress: { done: completed, total: ids.length } }))
      }
    }

    const workers = Array.from(
      { length: Math.min(BATCH_CONCURRENCY, ids.length) },
      () => worker(),
    )
    await Promise.all(workers)

    setState((s) => ({ ...s, isBatchProcessing: false, batchProgress: null }))
  }, [])

  // ── Options 更新 ────────────────────────────────────────────
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

  const setTargetSize = useCallback((bytes: number | null) => {
    setState((s) => ({ ...s, targetSize: bytes }))
  }, [])

  // ── 自動最佳化（針對選中項；二分搜尋 quality）────────────────
  const autoOptimize = useCallback(async () => {
    const id = selectedIdRef.current
    const item = itemsRef.current.find((i) => i.id === id)
    const opts = optionsRef.current
    const target = targetRef.current
    if (!item || !target) return

    setState((s) => ({ ...s, isOptimizing: true, error: null }))

    try {
      const minBlob = await processImage(item.file, { ...opts, quality: 1 })
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
        const blob = await processImage(item.file, { ...opts, quality: mid })
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

  // ── 下載：選中項 ────────────────────────────────────────────
  const download = useCallback(() => {
    const item = itemsRef.current.find((i) => i.id === selectedIdRef.current)
    if (!item || !item.processedBlob || !item.processedUrl) return
    const ext = getOutputExtension(optionsRef.current.format)
    const base = item.info.name.replace(/\.[^.]+$/, '')
    const a = document.createElement('a')
    a.href = item.processedUrl
    a.download = `${base}_zeropic.${ext}`
    a.click()
  }, [])

  // ── 下載：全部已完成 → ZIP ──────────────────────────────────
  const downloadAllZip = useCallback(async () => {
    const done = itemsRef.current.filter((i) => i.status === 'done' && i.processedBlob)
    if (done.length === 0) return

    setState((s) => ({ ...s, isZipping: true, error: null }))
    try {
      const zip = new JSZip()
      const ext = getOutputExtension(optionsRef.current.format)
      const used = new Map<string, number>()
      for (const item of done) {
        const base = item.info.name.replace(/\.[^.]+$/, '')
        let name = `${base}_zeropic.${ext}`
        const seen = used.get(name) ?? 0
        if (seen > 0) name = `${base}_zeropic_${seen}.${ext}`
        used.set(name, seen + 1)
        zip.file(name, item.processedBlob!)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
      a.href = url
      a.download = `zeropic_${stamp}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : '打包失敗',
      }))
    } finally {
      setState((s) => ({ ...s, isZipping: false }))
    }
  }, [])

  // ── 重設：清空全部 ─────────────────────────────────────────
  const reset = useCallback(() => {
    setState((s) => {
      s.items.forEach(revokeItem)
      return { ...initialState }
    })
  }, [])

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  return {
    state,
    selected,
    loadFiles,
    selectItem,
    removeItem,
    runProcess,
    runProcessAll,
    updateOptions,
    updateResize,
    updateCrop,
    updateFilters,
    setTargetSize,
    autoOptimize,
    download,
    downloadAllZip,
    reset,
    clearError,
  }
}
