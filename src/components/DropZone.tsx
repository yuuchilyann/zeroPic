import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'

interface DropZoneProps {
  onFile: (file: File) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

export function DropZone({ onFile }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && ACCEPTED.includes(file.type)) onFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
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
        p: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
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
        accept={ACCEPTED.join(',')}
        onChange={handleChange}
        hidden
      />
      <Box sx={{ color: dragging ? 'primary.main' : 'text.disabled' }}>
        <ImageOutlinedIcon sx={{ fontSize: 56 }} />
      </Box>
      <Typography variant="body1" fontWeight={500} color="text.primary">
        拖曳圖片至此，或點擊選取
      </Typography>
      <Typography variant="caption" color="text.secondary">
        支援 JPEG、PNG、WebP、GIF、BMP
      </Typography>
    </Paper>
  )
}
