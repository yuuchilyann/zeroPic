import { useRef, useEffect, useState } from 'react'
import type { CropOptions } from '../utils/imageProcessor'

interface Props {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  crop: CropOptions
  onChange: (patch: Partial<CropOptions>) => void
}

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface DragState {
  type: Handle | 'move' | 'new'
  anchorX: number  // image pixels
  anchorY: number
  startCrop: { x: number; y: number; width: number; height: number }
}

const HANDLE_PX = 10
const MIN_PX = 10

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export function CropSelector({ imageUrl, imageWidth, imageHeight, crop, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [displayW, setDisplayW] = useState(1)
  const [displayH, setDisplayH] = useState(1)

  // 監聽 img 顯示尺寸（因 width:100% 會隨容器改變）
  useEffect(() => {
    const el = imgRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      setDisplayW(el.offsetWidth)
      setDisplayH(el.offsetHeight)
    })
    obs.observe(el)
    if (el.complete) {
      setDisplayW(el.offsetWidth)
      setDisplayH(el.offsetHeight)
    }
    return () => obs.disconnect()
  }, [imageUrl])

  const scaleX = imageWidth / displayW
  const scaleY = imageHeight / displayH

  function toImgPos(e: MouseEvent | React.MouseEvent) {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: clamp((e.clientX - rect.left) * scaleX, 0, imageWidth),
      y: clamp((e.clientY - rect.top) * scaleY, 0, imageHeight),
    }
  }

  function startDrag(type: DragState['type'], e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const { x, y } = toImgPos(e)
    dragRef.current = {
      type,
      anchorX: x,
      anchorY: y,
      startCrop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
    }
  }

  // 全域 mousemove / mouseup
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const drag = dragRef.current
      if (!drag) return

      const pos = toImgPos(e)
      const dx = pos.x - drag.anchorX
      const dy = pos.y - drag.anchorY
      let { x, y, width, height } = drag.startCrop

      if (drag.type === 'new') {
        const rawX = drag.anchorX
        const rawY = drag.anchorY
        const rawW = pos.x - rawX
        const rawH = pos.y - rawY
        x = clamp(rawW >= 0 ? rawX : rawX + rawW, 0, imageWidth)
        y = clamp(rawH >= 0 ? rawY : rawY + rawH, 0, imageHeight)
        width = clamp(Math.abs(rawW), MIN_PX, imageWidth - x)
        height = clamp(Math.abs(rawH), MIN_PX, imageHeight - y)
      } else if (drag.type === 'move') {
        x = clamp(x + dx, 0, imageWidth - width)
        y = clamp(y + dy, 0, imageHeight - height)
      } else {
        const t = drag.type
        if (t.includes('w')) {
          const newX = clamp(x + dx, 0, x + width - MIN_PX)
          width = x + width - newX
          x = newX
        }
        if (t.includes('e')) width = clamp(width + dx, MIN_PX, imageWidth - x)
        if (t.includes('n')) {
          const newY = clamp(y + dy, 0, y + height - MIN_PX)
          height = y + height - newY
          y = newY
        }
        if (t.includes('s')) height = clamp(height + dy, MIN_PX, imageHeight - y)
      }

      onChange({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) })
    }

    function onUp() { dragRef.current = null }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  // 依賴 scale 值（圖片或容器尺寸改變時重新綁）
  }, [scaleX, scaleY, imageWidth, imageHeight, crop.x, crop.y, crop.width, crop.height, onChange])

  // 裁切框在顯示座標系的位置
  const hasCrop = crop.width > 0 && crop.height > 0
  const dc = hasCrop ? {
    x: crop.x / scaleX,
    y: crop.y / scaleY,
    w: crop.width / scaleX,
    h: crop.height / scaleY,
  } : { x: 0, y: 0, w: 0, h: 0 }

  const H = HANDLE_PX
  const handles: Array<{ type: Handle; cursor: string; style: React.CSSProperties }> = [
    { type: 'nw', cursor: 'nw-resize', style: { left: -H / 2, top: -H / 2 } },
    { type: 'n',  cursor: 'n-resize',  style: { left: dc.w / 2 - H / 2, top: -H / 2 } },
    { type: 'ne', cursor: 'ne-resize', style: { left: dc.w - H / 2, top: -H / 2 } },
    { type: 'e',  cursor: 'e-resize',  style: { left: dc.w - H / 2, top: dc.h / 2 - H / 2 } },
    { type: 'se', cursor: 'se-resize', style: { left: dc.w - H / 2, top: dc.h - H / 2 } },
    { type: 's',  cursor: 's-resize',  style: { left: dc.w / 2 - H / 2, top: dc.h - H / 2 } },
    { type: 'sw', cursor: 'sw-resize', style: { left: -H / 2, top: dc.h - H / 2 } },
    { type: 'w',  cursor: 'w-resize',  style: { left: -H / 2, top: dc.h / 2 - H / 2 } },
  ]

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', lineHeight: 0, cursor: 'crosshair', userSelect: 'none' }}
      onMouseDown={(e) => {
        if (e.target === containerRef.current || e.target === imgRef.current) {
          startDrag('new', e)
        }
      }}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt=""
        onLoad={() => {
          if (imgRef.current) {
            setDisplayW(imgRef.current.offsetWidth)
            setDisplayH(imgRef.current.offsetHeight)
          }
        }}
        style={{ width: '100%', display: 'block', pointerEvents: 'none', borderRadius: 4 }}
        draggable={false}
      />

      {/* 裁切框外的半透明遮罩（SVG 切出） */}
      {hasCrop && (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox={`0 0 ${displayW} ${displayH}`}
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="crop-mask">
              <rect width={displayW} height={displayH} fill="white" />
              <rect x={dc.x} y={dc.y} width={dc.w} height={dc.h} fill="black" />
            </mask>
          </defs>
          <rect width={displayW} height={displayH} fill="rgba(0,0,0,0.52)" mask="url(#crop-mask)" />
        </svg>
      )}

      {/* 裁切框本體 + 三等分格線 + 控制點 */}
      {hasCrop && (
        <div
          style={{
            position: 'absolute',
            left: dc.x,
            top: dc.y,
            width: dc.w,
            height: dc.h,
            border: '1.5px solid rgba(255,255,255,0.9)',
            boxSizing: 'border-box',
            cursor: 'move',
          }}
          onMouseDown={(e) => startDrag('move', e)}
        >
          {/* 三等分格線 */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            {[1, 2].map((i) => (
              <line key={`v${i}`} x1={`${i * 33.33}%`} y1="0" x2={`${i * 33.33}%`} y2="100%"
                stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
            ))}
            {[1, 2].map((i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 33.33}%`} x2="100%" y2={`${i * 33.33}%`}
                stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
            ))}
          </svg>

          {/* 8 個控制點 */}
          {handles.map(({ type, cursor, style }) => (
            <div
              key={type}
              style={{
                position: 'absolute',
                width: HANDLE_PX,
                height: HANDLE_PX,
                background: '#fff',
                border: '1.5px solid rgba(0,0,0,0.4)',
                borderRadius: 2,
                cursor,
                ...style,
              }}
              onMouseDown={(e) => startDrag(type, e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
