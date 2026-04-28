import { useCallback } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Box, Container, Paper, Stack, Typography, Alert } from '@mui/material'
import { theme } from './theme'
import { useImageProcessor } from './hooks/useImageProcessor'
import { DropZone } from './components/DropZone'
import { ImagePreview } from './components/ImagePreview'
import { Controls } from './components/Controls'

function App() {
  const {
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
  } = useImageProcessor()

  const handleFiles = useCallback((files: File[]) => loadFiles(files), [loadFiles])

  const doneCount = state.items.filter((i) => i.status === 'done').length
  const hasItems = state.items.length > 0

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
            <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
              {state.error}
            </Alert>
          )}

          {!hasItems ? (
            <DropZone onFiles={handleFiles} />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 320px' },
                gap: 2,
                alignItems: 'start',
              }}
            >
              {/* 左側：圖片預覽 + 縮圖 + 加入更多 */}
              <Stack spacing={2}>
                {selected && (
                  <ImagePreview
                    items={state.items}
                    selectedId={state.selectedId}
                    originalUrl={selected.originalUrl}
                    originalInfo={selected.info}
                    processedUrl={selected.processedUrl}
                    processedSize={selected.processedSize}
                    options={state.options}
                    onSelect={selectItem}
                    onRemove={removeItem}
                  />
                )}
                <DropZone onFiles={handleFiles} compact />
              </Stack>

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
                  originalInfo={selected?.info ?? null}
                  originalPreviewUrl={selected?.originalUrl ?? null}
                  hasResult={selected?.processedBlob != null}
                  isProcessing={state.isProcessing}
                  isEstimating={state.isEstimating}
                  isOptimizing={state.isOptimizing}
                  estimatedSize={state.estimatedSize}
                  targetSize={state.targetSize}
                  itemCount={state.items.length}
                  doneCount={doneCount}
                  isBatchProcessing={state.isBatchProcessing}
                  isZipping={state.isZipping}
                  batchProgress={state.batchProgress}
                  onUpdateOptions={updateOptions}
                  onUpdateResize={updateResize}
                  onUpdateCrop={updateCrop}
                  onUpdateFilters={updateFilters}
                  onTargetSizeChange={setTargetSize}
                  onAutoOptimize={autoOptimize}
                  onProcess={runProcess}
                  onProcessAll={runProcessAll}
                  onDownload={download}
                  onDownloadAllZip={downloadAllZip}
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
