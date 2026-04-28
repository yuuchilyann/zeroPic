import { useState } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Button, Chip, CircularProgress,
  FormControlLabel, IconButton, InputAdornment,
  Slider, Stack, Switch, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import FlipIcon from '@mui/icons-material/Flip'
import TuneIcon from '@mui/icons-material/Tune'
import PhotoSizeSelectLargeIcon from '@mui/icons-material/PhotoSizeSelectLarge'
import CropIcon from '@mui/icons-material/Crop'
import SettingsIcon from '@mui/icons-material/Settings'
import TransformIcon from '@mui/icons-material/Transform'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import DownloadIcon from '@mui/icons-material/Download'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import {
  formatBytes,
  type OutputFormat,
  type ProcessOptions,
  type ResizeOptions,
  type CropOptions,
  type FilterOptions,
  type ImageInfo,
} from '../utils/imageProcessor'
import { CropSelector } from './CropSelector'

type SizeUnit = 'KB' | 'MB'

interface ControlsProps {
  options: ProcessOptions
  originalInfo: ImageInfo | null
  originalPreviewUrl: string | null
  hasResult: boolean
  isProcessing: boolean
  isEstimating: boolean
  isOptimizing: boolean
  estimatedSize: number | null
  targetSize: number | null
  onUpdateOptions: (patch: Partial<ProcessOptions>) => void
  onUpdateResize: (patch: Partial<ResizeOptions>) => void
  onUpdateCrop: (patch: Partial<CropOptions>) => void
  onUpdateFilters: (patch: Partial<FilterOptions>) => void
  onTargetSizeChange: (bytes: number | null) => void
  onAutoOptimize: () => void
  onProcess: () => void
  onDownload: () => void
  onReset: () => void
}

// ── 輸出設定 ───────────────────────────────────────────────────────
function OutputSection({
  options, estimatedSize, isEstimating, targetSize,
  onUpdateOptions, onTargetSizeChange, onAutoOptimize, isOptimizing,
}: Pick<ControlsProps,
  'options' | 'estimatedSize' | 'isEstimating' | 'targetSize' |
  'onUpdateOptions' | 'onTargetSizeChange' | 'onAutoOptimize' | 'isOptimizing'
>) {
  const [targetInput, setTargetInput] = useState('')
  const [unit, setUnit] = useState<SizeUnit>('KB')
  const isPng = options.format === 'image/png'
  const overTarget = targetSize !== null && estimatedSize !== null && estimatedSize > targetSize

  function handleTargetChange(val: string) {
    setTargetInput(val)
    const num = parseFloat(val)
    onTargetSizeChange(!val || isNaN(num) || num <= 0
      ? null
      : Math.round(num * (unit === 'MB' ? 1024 * 1024 : 1024)))
  }

  function handleUnitChange(_: unknown, val: SizeUnit | null) {
    if (!val) return
    setUnit(val)
    const num = parseFloat(targetInput)
    if (!isNaN(num) && num > 0) {
      onTargetSizeChange(Math.round(num * (val === 'MB' ? 1024 * 1024 : 1024)))
    }
  }

  return (
    <Stack spacing={2.5}>
      {/* 格式 */}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>輸出格式</Typography>
        <ToggleButtonGroup
          value={options.format}
          exclusive
          size="small"
          onChange={(_, val: OutputFormat | null) => val && onUpdateOptions({ format: val })}
        >
          <ToggleButton value="image/jpeg">JPEG</ToggleButton>
          <ToggleButton value="image/png">PNG</ToggleButton>
          <ToggleButton value="image/webp">WebP</ToggleButton>
        </ToggleButtonGroup>
        {isPng && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            PNG 為無損格式，不須調整品質。
          </Typography>
        )}
      </Box>

      {/* 品質滑桿（PNG 為無損格式，無品質可調，整段隱藏） */}
      {!isPng && (
        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>品質</Typography>
            <Chip label={`${options.quality}%`} size="small" color="primary" variant="outlined" />
          </Stack>
          <Slider
            value={options.quality}
            min={1} max={100} step={1}
            disabled={isOptimizing}
            onChange={(_, v) => onUpdateOptions({ quality: v as number })}
            sx={{ mt: 0.5 }}
          />
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>最小</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>最佳</Typography>
          </Stack>

          {/* 即時估算 */}
          <Box
            sx={{
              mt: 1, px: 1.25, py: 0.75, borderRadius: 1,
              bgcolor: overTarget ? '#fff4f4' : '#f4f6ff',
              border: '1px solid', borderColor: overTarget ? '#ffc9c9' : '#e0e8ff',
              minHeight: 36, display: 'flex', alignItems: 'center', gap: 1,
            }}
          >
            {isEstimating ? (
              <><CircularProgress size={12} /><Typography variant="caption" sx={{ color: 'text.secondary' }}>估算中...</Typography></>
            ) : estimatedSize !== null ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="caption">
                  預估大小：<strong>{formatBytes(estimatedSize)}</strong>
                </Typography>
                {overTarget && <Chip label="超出目標容量" size="small" color="error" sx={{ height: 18, fontSize: 10 }} />}
                {targetSize !== null && !overTarget && <Chip label="符合目標容量" size="small" color="success" sx={{ height: 18, fontSize: 10 }} />}
              </Stack>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>上傳圖片後自動估算</Typography>
            )}
          </Box>
        </Box>
      )}

      {/* 目標容量 */}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>目標容量上限</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            size="small" type="number" placeholder="例：500"
            value={targetInput}
            onChange={(e) => handleTargetChange(e.target.value)}
            disabled={isOptimizing}
            slotProps={{ input: { inputProps: { min: 1 } } }}
            sx={{ flex: 1 }}
          />
          <ToggleButtonGroup value={unit} exclusive size="small" onChange={handleUnitChange}>
            <ToggleButton value="KB" disabled={isOptimizing}>KB</ToggleButton>
            <ToggleButton value="MB" disabled={isOptimizing}>MB</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Button
          fullWidth variant="contained" color="secondary" size="small"
          startIcon={isOptimizing ? <CircularProgress size={14} color="inherit" /> : <AutoFixHighIcon />}
          onClick={onAutoOptimize}
          disabled={isOptimizing || !targetSize}
          sx={{ mt: 1 }}
        >
          {isOptimizing ? '搜尋最佳品質中...' : '自動最佳化品質'}
        </Button>
        {isOptimizing && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            二分搜尋中，約需數秒...
          </Typography>
        )}
      </Box>
    </Stack>
  )
}

// ── 調整尺寸 ───────────────────────────────────────────────────────
function ResizeSection({ options, originalInfo, onUpdateResize }: Pick<ControlsProps, 'options' | 'originalInfo' | 'onUpdateResize'>) {
  const { resize } = options

  function handleWidth(val: string) {
    const w = val ? Number(val) : null
    if (!w || !resize.keepAspectRatio || !originalInfo) { onUpdateResize({ width: w }); return }
    onUpdateResize({ width: w, height: Math.round(w / (originalInfo.width / originalInfo.height)) })
  }

  function handleHeight(val: string) {
    const h = val ? Number(val) : null
    if (!h || !resize.keepAspectRatio || !originalInfo) { onUpdateResize({ height: h }); return }
    onUpdateResize({ height: h, width: Math.round(h * (originalInfo.width / originalInfo.height)) })
  }

  return (
    <Stack spacing={2}>
      <FormControlLabel
        control={<Switch checked={resize.enabled} onChange={(e) => onUpdateResize({ enabled: e.target.checked })} size="small" />}
        label={<Typography variant="body2">啟用尺寸調整</Typography>}
      />
      {resize.enabled && (
        <>
          <Stack direction="row" spacing={1}>
            <TextField
              label="寬度" type="number" size="small" value={resize.width ?? ''}
              onChange={(e) => handleWidth(e.target.value)}
              slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment>, inputProps: { min: 1 } } }}
            />
            <TextField
              label="高度" type="number" size="small" value={resize.height ?? ''}
              onChange={(e) => handleHeight(e.target.value)}
              slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment>, inputProps: { min: 1 } } }}
            />
          </Stack>
          <FormControlLabel
            control={<Switch checked={resize.keepAspectRatio} onChange={(e) => onUpdateResize({ keepAspectRatio: e.target.checked })} size="small" />}
            label={<Typography variant="body2">維持長寬比</Typography>}
          />
          {originalInfo && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              原始：{originalInfo.width} × {originalInfo.height} px
            </Typography>
          )}
        </>
      )}
    </Stack>
  )
}

// ── 裁切 ──────────────────────────────────────────────────────────
function CropSection({ options, originalInfo, originalPreviewUrl, onUpdateCrop }: Pick<ControlsProps, 'options' | 'originalInfo' | 'originalPreviewUrl' | 'onUpdateCrop'>) {
  const { crop } = options
  const info = originalInfo

  function handleEnable(enabled: boolean) {
    if (enabled && info && crop.width === 0) {
      onUpdateCrop({ enabled: true, x: 0, y: 0, width: info.width, height: info.height })
    } else {
      onUpdateCrop({ enabled })
    }
  }

  function handleReset() {
    if (!info) return
    onUpdateCrop({ x: 0, y: 0, width: info.width, height: info.height })
  }

  const hasInfo = !!info && !!originalPreviewUrl

  return (
    <Stack spacing={2}>
      <FormControlLabel
        control={
          <Switch
            checked={crop.enabled}
            onChange={(e) => handleEnable(e.target.checked)}
            size="small"
            disabled={!hasInfo}
          />
        }
        label={<Typography variant="body2">啟用裁切</Typography>}
      />

      {crop.enabled && hasInfo && (
        <>
          {/* 互動式裁切選取器 */}
          <Box sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <CropSelector
              imageUrl={originalPreviewUrl!}
              imageWidth={info.width}
              imageHeight={info.height}
              crop={crop}
              onChange={onUpdateCrop}
            />
          </Box>

          {/* 數值輸入（精確控制） */}
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              精確座標
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <TextField
                label="X" type="number" size="small"
                value={crop.x}
                onChange={(e) => onUpdateCrop({ x: Math.max(0, Number(e.target.value)) })}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment>, inputProps: { min: 0 } } }}
                sx={{ width: '45%' }}
              />
              <TextField
                label="Y" type="number" size="small"
                value={crop.y}
                onChange={(e) => onUpdateCrop({ y: Math.max(0, Number(e.target.value)) })}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment>, inputProps: { min: 0 } } }}
                sx={{ width: '45%' }}
              />
              <TextField
                label="寬度" type="number" size="small"
                value={crop.width}
                onChange={(e) => onUpdateCrop({ width: Math.max(1, Number(e.target.value)) })}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment>, inputProps: { min: 1 } } }}
                sx={{ width: '45%' }}
              />
              <TextField
                label="高度" type="number" size="small"
                value={crop.height}
                onChange={(e) => onUpdateCrop({ height: Math.max(1, Number(e.target.value)) })}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">px</InputAdornment>, inputProps: { min: 1 } } }}
                sx={{ width: '45%' }}
              />
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {info && (
              <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
                裁切後：{crop.width} × {crop.height} px
              </Typography>
            )}
            <Button size="small" variant="outlined" onClick={handleReset}>
              重設裁切
            </Button>
          </Stack>
        </>
      )}

      {!hasInfo && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>請先上傳圖片</Typography>
      )}
    </Stack>
  )
}

// ── 旋轉與翻轉 ────────────────────────────────────────────────────
function TransformSection({ options, onUpdateOptions }: Pick<ControlsProps, 'options' | 'onUpdateOptions'>) {
  function rotate(delta: 90 | -90) {
    const next = ((options.rotation + delta + 360) % 360) as 0 | 90 | 180 | 270
    onUpdateOptions({ rotation: next })
  }

  const isDefault = options.rotation === 0 && !options.flipH && !options.flipV

  return (
    <Stack spacing={2}>
      {/* 旋轉 */}
      <Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>旋轉</Typography>
          {options.rotation !== 0 && (
            <Chip label={`${options.rotation}°`} size="small" color="primary" variant="outlined" sx={{ height: 20 }} />
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="逆時針 90°">
            <IconButton onClick={() => rotate(-90)} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <RotateLeftIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="順時針 90°">
            <IconButton onClick={() => rotate(90)} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <RotateRightIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* 翻轉：用獨立 selected prop，避免 ToggleButtonGroup array 更新問題 */}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>翻轉</Typography>
        <Stack direction="row" spacing={1}>
          <ToggleButton
            value="H"
            selected={options.flipH}
            size="small"
            onChange={() => onUpdateOptions({ flipH: !options.flipH })}
            sx={{ px: 1.5 }}
          >
            <FlipIcon fontSize="small" />
            <Typography variant="caption" sx={{ ml: 0.5 }}>水平</Typography>
          </ToggleButton>
          <ToggleButton
            value="V"
            selected={options.flipV}
            size="small"
            onChange={() => onUpdateOptions({ flipV: !options.flipV })}
            sx={{ px: 1.5 }}
          >
            <FlipIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
            <Typography variant="caption" sx={{ ml: 0.5 }}>垂直</Typography>
          </ToggleButton>
        </Stack>
      </Box>

      {/* 整體重設按鈕：永遠顯示，非預設時才可點擊 */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<RestartAltIcon />}
        disabled={isDefault}
        onClick={() => onUpdateOptions({ rotation: 0, flipH: false, flipV: false })}
      >
        重設旋轉與翻轉
      </Button>
    </Stack>
  )
}

// ── 濾鏡 ──────────────────────────────────────────────────────────
function FilterSection({ options, onUpdateFilters }: Pick<ControlsProps, 'options' | 'onUpdateFilters'>) {
  const { filters } = options
  const isDefault = filters.grayscale === 0 && filters.brightness === 100 && filters.contrast === 100

  return (
    <Stack spacing={2}>
      {[
        { key: 'grayscale' as const, label: '灰階', min: 0, max: 100, unit: '%' },
        { key: 'brightness' as const, label: '亮度', min: 0, max: 200, unit: '%' },
        { key: 'contrast' as const, label: '對比', min: 0, max: 200, unit: '%' },
      ].map(({ key, label, min, max }) => (
        <Box key={key}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
            <Typography variant="caption" sx={{ color: 'primary.main' }}>{filters[key]}%</Typography>
          </Stack>
          <Slider
            value={filters[key]} min={min} max={max}
            marks={max === 200 ? [{ value: 100, label: '正常' }] : undefined}
            onChange={(_, v) => onUpdateFilters({ [key]: v as number })}
          />
        </Box>
      ))}
      <Button size="small" variant="outlined" disabled={isDefault}
        onClick={() => onUpdateFilters({ grayscale: 0, brightness: 100, contrast: 100 })}>
        重設濾鏡
      </Button>
    </Stack>
  )
}

// ── 主元件 ────────────────────────────────────────────────────────
export function Controls({
  options, originalInfo, originalPreviewUrl, hasResult,
  isProcessing, isEstimating, isOptimizing,
  estimatedSize, targetSize,
  onUpdateOptions, onUpdateResize, onUpdateCrop, onUpdateFilters,
  onTargetSizeChange, onAutoOptimize,
  onProcess, onDownload, onReset,
}: ControlsProps) {
  const isBusy = isProcessing || isOptimizing
  const transformAdjusted = options.rotation !== 0 || options.flipH || options.flipV
  const filterAdjusted = options.filters.grayscale > 0 || options.filters.brightness !== 100 || options.filters.contrast !== 100

  return (
    <Stack spacing={0}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SettingsIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>輸出設定</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <OutputSection
            options={options} estimatedSize={estimatedSize} isEstimating={isEstimating}
            targetSize={targetSize} onUpdateOptions={onUpdateOptions}
            onTargetSizeChange={onTargetSizeChange} onAutoOptimize={onAutoOptimize}
            isOptimizing={isOptimizing}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PhotoSizeSelectLargeIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>調整尺寸</Typography>
            {options.resize.enabled && <Chip label="啟用" size="small" color="primary" sx={{ height: 18 }} />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <ResizeSection options={options} originalInfo={originalInfo} onUpdateResize={onUpdateResize} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <CropIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>裁切</Typography>
            {options.crop.enabled && <Chip label="啟用" size="small" color="primary" sx={{ height: 18 }} />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <CropSection
            options={options} originalInfo={originalInfo}
            originalPreviewUrl={originalPreviewUrl} onUpdateCrop={onUpdateCrop}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TransformIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>旋轉與翻轉</Typography>
            {transformAdjusted && <Chip label="已調整" size="small" color="primary" sx={{ height: 18 }} />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <TransformSection options={options} onUpdateOptions={onUpdateOptions} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TuneIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>濾鏡調整</Typography>
            {filterAdjusted && <Chip label="已調整" size="small" color="primary" sx={{ height: 18 }} />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <FilterSection options={options} onUpdateFilters={onUpdateFilters} />
        </AccordionDetails>
      </Accordion>

      <Stack spacing={1} sx={{ p: 1.5 }}>
        <Button
          variant="contained" fullWidth
          startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={onProcess} disabled={isBusy}
        >
          {isProcessing ? '處理中...' : '套用並預覽'}
        </Button>
        {hasResult && (
          <Button variant="contained" color="success" fullWidth
            startIcon={<DownloadIcon />} onClick={onDownload} disabled={isBusy}>
            下載圖片
          </Button>
        )}
        <Button variant="outlined" color="inherit" fullWidth
          startIcon={<RestartAltIcon />} onClick={onReset} disabled={isBusy}
          sx={{ color: 'text.secondary' }}>
          重設
        </Button>
      </Stack>
    </Stack>
  )
}
