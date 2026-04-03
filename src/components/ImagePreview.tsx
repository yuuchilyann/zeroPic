import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { formatBytes, type ImageInfo, type ProcessOptions } from '../utils/imageProcessor'

interface ImagePreviewProps {
  originalUrl: string
  originalInfo: ImageInfo
  processedUrl: string | null
  processedSize: number | null
  options: ProcessOptions
}

// 將目前的 options 轉成 CSS filter / transform，供即時預覽
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

export function ImagePreview({
  originalUrl,
  originalInfo,
  processedUrl,
  processedSize,
  options,
}: ImagePreviewProps) {
  const saved =
    processedSize !== null
      ? Math.round((1 - processedSize / originalInfo.size) * 100)
      : null

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
      {/* 原始圖片（帶即時 CSS 預覽） */}
      <Paper variant="outlined" sx={{ flex: 1, p: 1.5 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1} textTransform="uppercase" letterSpacing={1}>
          原始圖片
        </Typography>
        <Box sx={{ overflow: 'hidden', borderRadius: 1 }}>
          <img src={originalUrl} alt="原始" style={{ ...IMG_SX, ...buildPreviewStyle(options) }} />
        </Box>
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
          <Chip label={formatBytes(originalInfo.size)} size="small" variant="outlined" />
          <Chip label={`${originalInfo.width} × ${originalInfo.height}`} size="small" variant="outlined" />
          <Chip label={originalInfo.type.replace('image/', '').toUpperCase()} size="small" variant="outlined" />
        </Stack>
        <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
          * 預覽顯示濾鏡與旋轉效果，實際輸出請按「套用並預覽」
        </Typography>
      </Paper>

      {/* 箭頭 */}
      <Box sx={{ alignSelf: 'center', color: 'text.disabled', fontSize: 24, userSelect: 'none', flexShrink: 0 }}>→</Box>

      {/* 處理結果 */}
      <Paper variant="outlined" sx={{ flex: 1, p: 1.5 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1} textTransform="uppercase" letterSpacing={1}>
          處理結果
        </Typography>
        {processedUrl ? (
          <>
            <img src={processedUrl} alt="處理後" style={IMG_SX} />
            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
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
            <Typography variant="body2">按下「套用並預覽」</Typography>
          </Box>
        )}
      </Paper>
    </Stack>
  )
}
