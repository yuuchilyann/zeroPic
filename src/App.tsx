import { useCallback } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Box, Container, Paper, Typography, Alert } from '@mui/material'
import { theme } from './theme'
import { useImageProcessor } from './hooks/useImageProcessor'
import { DropZone } from './components/DropZone'
import { ImagePreview } from './components/ImagePreview'
import { Controls } from './components/Controls'

function App() {
  const {
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
  } = useImageProcessor()

  const handleFile = useCallback((file: File) => loadFile(file), [loadFile])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box
          component="header"
          sx={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            zeroPic
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
            簡易圖片處理工具
          </Typography>
        </Box>

        {/* Main */}
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {state.error && (
            <Alert severity="error" onClose={() => updateOptions({})} sx={{ mb: 2 }}>
              {state.error}
            </Alert>
          )}

          {!state.originalFile ? (
            <DropZone onFile={handleFile} />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 320px' },
                gap: 2,
                alignItems: 'start',
              }}
            >
              {/* 左側：圖片預覽 */}
              <ImagePreview
                originalUrl={state.originalPreviewUrl!}
                originalInfo={state.originalInfo!}
                processedUrl={state.processedPreviewUrl}
                processedSize={state.processedSize}
                options={state.options}
              />

              {/* 右側：操作面板 */}
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: { lg: 'sticky' },
                  top: { lg: 16 },
                  maxHeight: { lg: 'calc(100vh - 100px)' },
                  overflowY: { lg: 'auto' },
                }}
              >
                <Controls
                  options={state.options}
                  originalInfo={state.originalInfo}
                  originalPreviewUrl={state.originalPreviewUrl}
                  hasResult={state.processedBlob !== null}
                  isProcessing={state.isProcessing}
                  isEstimating={state.isEstimating}
                  isOptimizing={state.isOptimizing}
                  estimatedSize={state.estimatedSize}
                  targetSize={state.targetSize}
                  onUpdateOptions={updateOptions}
                  onUpdateResize={updateResize}
                  onUpdateCrop={updateCrop}
                  onUpdateFilters={updateFilters}
                  onTargetSizeChange={setTargetSize}
                  onAutoOptimize={autoOptimize}
                  onProcess={runProcess}
                  onDownload={download}
                  onReset={reset}
                />
              </Paper>
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
