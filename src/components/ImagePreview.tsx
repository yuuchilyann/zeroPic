import { Badge, Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import { formatBytes, type ImageInfo, type ProcessOptions } from '../utils/imageProcessor'
import type { ImageItem } from '../hooks/useImageProcessor'

interface ImagePreviewProps {
  items: ImageItem[]
  selectedId: string | null
  originalUrl: string
  originalInfo: ImageInfo
  processedUrl: string | null
  processedSize: number | null
  options: ProcessOptions
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

function buildPreviewStyle(options: ProcessOptions): React.CSSProperties {
  const { grayscale, brightness, contrast } = options.filters
  const filterParts: string[] = []
  if (grayscale > 0) filterParts.push(`grayscale(${grayscale}%)`)
  if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`)
  if (contrast !== 100) filterParts.push(`contrast(${contrast}%)`)

  const transforms: string[] = []
  if (options.rotation) transforms.push(`rotate(${options.rotation}deg)`)
  if (options.flipH) transforms.push('scaleX(-1)')
  if (options.flipV) transforms.push('scaleY(-1)')

  return {
    filter: filterParts.join(' ') || 'none',
    transform: transforms.join(' ') || 'none',
    transition: 'filter 0.2s, transform 0.2s',
  }
}

const IMG_SX = {
  width: '100%',
  maxHeight: 340,
  objectFit: 'contain' as const,
  borderRadius: 1,
  background: 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px',
  display: 'block',
}

function StatusBadge({ status }: { status: ImageItem['status'] }) {
  if (status === 'done') return <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
  if (status === 'processing') return <HourglassTopIcon sx={{ fontSize: 14, color: 'warning.main' }} />
  if (status === 'error') return <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
  return null
}

function ThumbStrip({
  items, selectedId, onSelect, onRemove,
}: Pick<ImagePreviewProps, 'items' | 'selectedId' | 'onSelect' | 'onRemove'>) {
  if (items.length <= 1) return null
  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
        {items.map((item) => {
          const active = item.id === selectedId
          return (
            <Box
              key={item.id}
              onClick={() => onSelect(item.id)}
              sx={{
                position: 'relative',
                width: 72, height: 72, flexShrink: 0,
                border: '2px solid',
                borderColor: active ? 'primary.main' : 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                bgcolor: '#fafafa',
                '&:hover .remove-btn': { opacity: 1 },
              }}
            >
              <Badge
                overlap="rectangular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                badgeContent={<StatusBadge status={item.status} />}
                sx={{ width: '100%', height: '100%', '& .MuiBadge-badge': { padding: 0, minWidth: 'auto', height: 'auto', bgcolor: 'transparent' } }}
              >
                <img
                  src={item.originalUrl}
                  alt={item.info.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Badge>
              <IconButton
                size="small"
                className="remove-btn"
                onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
                sx={{
                  position: 'absolute', top: 1, right: 1,
                  width: 18, height: 18, p: 0,
                  bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                  opacity: 0,
                  transition: 'opacity 0.15s',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}

export function ImagePreview({
  items, selectedId,
  originalUrl, originalInfo, processedUrl, processedSize, options,
  onSelect, onRemove,
}: ImagePreviewProps) {
  const saved =
    processedSize !== null
      ? Math.round((1 - processedSize / originalInfo.size) * 100)
      : null

  return (
    <Stack spacing={2}>
      <ThumbStrip items={items} selectedId={selectedId} onSelect={onSelect} onRemove={onRemove} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
        {/* 原始圖片（帶即時 CSS 預覽） */}
        <Paper variant="outlined" sx={{ flex: 1, p: 1.5, minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}
            >
              原始圖片
            </Typography>
            <Tooltip title={originalInfo.name}>
              <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {originalInfo.name}
              </Typography>
            </Tooltip>
          </Stack>
          <Box sx={{ overflow: 'hidden', borderRadius: 1 }}>
            <img src={originalUrl} alt="原始" style={{ ...IMG_SX, ...buildPreviewStyle(options) }} />
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
            <Chip label={formatBytes(originalInfo.size)} size="small" variant="outlined" />
            <Chip label={`${originalInfo.width} × ${originalInfo.height}`} size="small" variant="outlined" />
            <Chip label={originalInfo.type.replace('image/', '').toUpperCase()} size="small" variant="outlined" />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
            * 預覽顯示濾鏡與旋轉效果，實際輸出請按「套用並預覽」
          </Typography>
        </Paper>

        <Box sx={{ alignSelf: 'center', color: 'text.disabled', fontSize: 24, userSelect: 'none', flexShrink: 0 }}>→</Box>

        {/* 處理結果 */}
        <Paper variant="outlined" sx={{ flex: 1, p: 1.5, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            處理結果
          </Typography>
          {processedUrl ? (
            <>
              <img src={processedUrl} alt="處理後" style={IMG_SX} />
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Chip label={formatBytes(processedSize!)} size="small" variant="outlined" />
                {saved !== null && (
                  <Chip
                    label={saved > 0 ? `節省 ${saved}%` : `增加 ${Math.abs(saved)}%`}
                    size="small"
                    color={saved > 0 ? 'success' : 'error'}
                  />
                )}
              </Stack>
            </>
          ) : (
            <Box
              sx={{
                minHeight: 200,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.disabled',
              }}
            >
              <Typography variant="body2">按下「套用並預覽」或「全部處理」</Typography>
            </Box>
          )}
        </Paper>
      </Stack>
    </Stack>
  )
}
