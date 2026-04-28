import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  compact?: boolean
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

export function DropZone({ onFiles, compact = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => ACCEPTED.includes(f.type))
    if (files.length) onFiles(files)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <Paper
      variant="outlined"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      sx={{
        p: compact ? 2 : 6,
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 1 : 1.5,
        cursor: 'pointer',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: dragging ? 'primary.main' : 'divider',
        bgcolor: dragging ? 'primary.50' : 'background.paper',
        transition: 'border-color 0.2s, background-color 0.2s',
        userSelect: 'none',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: '#f0f4ff',
        },
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED.join(',')}
        onChange={handleChange}
        hidden
      />
      <Box sx={{ color: dragging ? 'primary.main' : 'text.disabled' }}>
        <ImageOutlinedIcon sx={{ fontSize: compact ? 28 : 56 }} />
      </Box>
      <Box sx={{ textAlign: compact ? 'left' : 'center' }}>
        <Typography variant={compact ? 'body2' : 'body1'} sx={{ fontWeight: 500, color: 'text.primary' }}>
          {compact ? '加入更多圖片（可多選或拖曳）' : '拖曳圖片至此，或點擊選取（可多選）'}
        </Typography>
        {!compact && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            支援 JPEG、PNG、WebP、GIF、BMP
          </Typography>
        )}
      </Box>
    </Paper>
  )
}
