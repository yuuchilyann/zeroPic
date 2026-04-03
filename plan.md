# zeroPic — 專案規劃

## 專案目標

zeroPic 是一個純前端的圖片處理工具，讓使用者無需上傳至伺服器，直接在瀏覽器內完成圖片的處理作業。

---

## 核心功能規劃

### Phase 1 — 基礎功能
- [x] 圖片上傳（拖曳 / 點擊選取）
- [x] 圖片預覽
- [x] 圖片壓縮（調整品質）
- [x] 圖片下載

### Phase 2 — 格式轉換
- [x] 支援輸入：JPEG、PNG、WebP、GIF、BMP
- [x] 支援輸出：JPEG、PNG、WebP
- [ ] 批次轉換

### Phase 3 — 進階處理
- [x] 調整尺寸（寬度 / 高度 / 維持比例）
- [x] 裁切
- [x] 旋轉 / 翻轉
- [x] 基本濾鏡（灰階、亮度、對比）

---

## 技術選型

| 項目 | 選擇 | 原因 |
|------|------|------|
| 建構工具 | Vite 6 | 快速冷啟動、原生 ESM |
| UI 框架 | React 18 | 生態豐富、Hooks 模型 |
| 語言 | TypeScript | 型別安全、IDE 支援 |
| 圖片處理 | Canvas API | 原生瀏覽器支援，無額外依賴 |

---

## 目錄結構

```
zeroPic/
├── src/
│   ├── components/     # UI 元件
│   ├── hooks/          # 自訂 Hooks（圖片處理邏輯）
│   ├── utils/          # 工具函式（Canvas 操作、格式轉換）
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── public/
├── dist/               # 編譯輸出（git ignored）
├── index.html
├── vite.config.ts
├── tsconfig.json
├── plan.md
└── README.md
```

---

## 開發里程碑

| 里程碑 | 目標 |
|--------|------|
| M1 | 專案初始化、基本架構 |
| M2 | 圖片上傳與預覽 |
| M3 | 壓縮與下載功能 |
| M4 | 格式轉換 |
| M5 | 尺寸調整與裁切 |
| M6 | 批次處理 |
