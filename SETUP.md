# 登入系統設定步驟

## 1. 安裝套件

```bash
npm install @simplewebauthn/server @simplewebauthn/browser jose
```

## 2. 建立 D1 資料庫（如果還沒建過）

```bash
npx wrangler d1 create vlorion-dashboard-db
```

把輸出的 `database_id` 貼進 `wrangler.jsonc`：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "vlorion-dashboard-db",
      "database_id": "<貼上你的 database_id>"
    }
  ]
}
```

## 3. 套用 schema

```bash
npx wrangler d1 execute vlorion-dashboard-db --file=./schema.sql --remote
```

（本地測試用 `--local` 而不是 `--remote`）

## 4. 設定 session 簽名密鑰

```bash
npx wrangler secret put SESSION_SECRET
```

貼上時輸入一串隨機字串即可（例如用 `openssl rand -base64 32` 產生）。

**同時**在 Cloudflare Dashboard → 你的 Worker → Settings → Variables 裡，也加一個同名的環境變數 `SESSION_SECRET`（同樣的值）——這是因為 `middleware.ts` 在 Edge runtime 讀的是 `process.env`，跟 API routes 用 `wrangler secret` 讀的是分開的兩個機制，兩邊都要設定同一組值。

## 5. 手動新增第一個管理員（你自己）

目前沒有開放註冊介面（這是刻意的——避免任何人都能自己加自己進管理員名單），第一筆資料要手動塞進 D1：

```bash
npx wrangler d1 execute vlorion-dashboard-db --remote --command \
  "INSERT INTO admins (id, email, name) VALUES ('$(uuidgen)', 'your-email@vlorion.com', 'Champ')"
```

## 6. 檔案放置位置

把這次交付的檔案放到專案對應位置：

```
lib/db.ts
lib/session.ts
lib/webauthn.ts
app/api/auth/register/options/route.ts
app/api/auth/register/verify/route.ts
app/api/auth/login/options/route.ts
app/api/auth/login/verify/route.ts
app/api/auth/logout/route.ts
app/login/page.tsx
app/login/login.css
middleware.ts          ← 放在專案根目錄（跟 package.json 同一層）
```

## 7. 測試流程

1. `npm run dev` 本地跑起來
2. 打開 `http://localhost:3000/login`
3. 輸入你剛剛塞進 D1 的 email → 會顯示「這個帳號還沒註冊任何金鑰」→ 點「註冊新金鑰」
4. 瀏覽器會跳出系統原生的 Passkey/安全金鑰視窗，插 USB 金鑰或用生物辨識完成
5. 成功後自動導到 `/dashboard`
6. 登出後再登入一次，這次會直接走「登入」流程，不再需要註冊

## 之後要加第二個管理員？

重複第 5 步，換一個 email 塞進 `admins` 表，那個人第一次登入時系統會提示他自己註冊金鑰。
