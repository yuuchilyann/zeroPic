# zeroPic

純前端圖片處理工具，在瀏覽器中完成圖片壓縮、格式轉換與尺寸調整，無需上傳至伺服器。

## 環境需求

- Node.js >= 18
- npm >= 9

## 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（http://localhost:5173）
npm run dev
```

## 編譯

```bash
# 編譯至 dist/ 目錄
npm run build

# 預覽編譯結果
npm run preview
```

## 功能

- 圖片上傳（拖曳 / 點擊）
- 圖片壓縮
- 格式轉換（JPEG、PNG、WebP）
- 尺寸調整
- 批次處理

詳細規劃請參閱 [plan.md](./plan.md)。

## 技術棧

- [Vite](https://vitejs.dev/) — 建構工具
- [React 18](https://react.dev/) — UI 框架
- [TypeScript](https://www.typescriptlang.org/) — 程式語言
