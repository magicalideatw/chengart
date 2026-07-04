# 晟心誠藝劇團（Cheng Art Theatre）專案規格書

> **版本：** v1.0  
> **日期：** 2026-07-04  
> **狀態：** 待確認  
> **技術棧：** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL · Prisma

---

## 目錄

1. [專案概述](#1-專案概述)
2. [設計系統摘要](#2-設計系統摘要)
3. [Sitemap 與路由](#3-sitemap-與路由)
4. [前台頁面規格](#4-前台頁面規格)
5. [後台頁面規格](#5-後台頁面規格)
6. [API 總覽](#6-api-總覽)
7. [資料模型摘要](#7-資料模型摘要)
8. [全域 RWD 規範](#8-全域-rwd-規範)
9. [開發 Phase](#9-開發-phase)

---

## 1. 專案概述

### 1.1 品牌資訊

| 項目 | 內容 |
|------|------|
| 中文名稱 | 晟心誠藝劇團 |
| 英文名稱 | Cheng Art Theatre |
| 定位 | 結合魔術、戲劇、舞蹈與藝術教育的表演藝術團隊 |

### 1.2 網站目標

1. 展示劇團品牌形象
2. 展示近期演出
3. 展示課程
4. 提供線上報名
5. 提供演出合作邀約
6. 後台管理課程、演出、活動與報名名單

### 1.3 設計方向

- 活力、現代、有設計感
- 乾淨留白、大量圖片、柔和漸層
- 調性參考：Apple + Canva + 現代藝文品牌
- **避免：** 黑金配色

---

## 2. 設計系統摘要

### 2.1 色彩

| Token | Hex | 用途 |
|-------|-----|------|
| `primary` | `#FF6B6B` | 主 CTA、重點強調 |
| `primary-light` | `#FF8E8E` | Hover |
| `primary-dark` | `#E85555` | Active |
| `secondary` | `#A78BFA` | 次要 CTA、標籤 |
| `accent-sky` | `#38BDF8` | 連結、資訊 |
| `accent-mint` | `#6EE7B7` | 成功 |
| `ink` | `#1E1E2E` | 主文字 |
| `slate` | `#64748B` | 次要文字 |
| `mist` | `#94A3B8` | 輔助文字 |
| `cloud` | `#F1F5F9` | 背景 |
| `snow` | `#FFFFFF` | 卡片背景 |

**漸層：**
- Hero：`linear-gradient(135deg, #FF6B6B 0%, #A78BFA 50%, #38BDF8 100%)`
- Soft BG：`linear-gradient(180deg, #FFF5F5 0%, #F5F3FF 100%)`
- CTA Button：`linear-gradient(90deg, #FF6B6B 0%, #FF8E8E 100%)`

### 2.2 字體

| 用途 | 字體 |
|------|------|
| 中文 | Noto Sans TC |
| 英文 | Outfit / Plus Jakarta Sans |

### 2.3 Icon

- 套件：Lucide React
- 風格：2px outline、圓角端點、24×24 標準尺寸

### 2.4 Breakpoints

| Token | 寬度 |
|-------|------|
| `xs` | < 480px |
| `sm` | 480–639px |
| `md` | 640–767px |
| `lg` | 768–1023px |
| `xl` | 1024–1279px |
| `2xl` | ≥ 1280px |

---

## 3. Sitemap 與路由

```
/                           首頁
/about                      關於我們
/performances               演出列表
/performances/[slug]        演出詳情
/courses                    課程列表
/courses/[slug]             課程詳情
/events                     活動列表
/events/[slug]              活動詳情
/register                   報名入口
/register/success           報名成功
/collaboration              合作邀約
/news                       最新消息（Phase 2）
/news/[slug]                消息詳情（Phase 2）
/contact                    聯絡我們
/faq                        常見問題
/privacy                    隱私權政策
/terms                      服務條款

/admin/login                後台登入
/admin                      Dashboard
/admin/performances         演出管理
/admin/performances/new     新增演出
/admin/performances/[id]    編輯演出
/admin/courses              課程管理
/admin/courses/new          新增課程
/admin/courses/[id]         編輯課程
/admin/events               活動管理
/admin/events/new           新增活動
/admin/events/[id]          編輯活動
/admin/registrations        報名管理
/admin/inquiries            合作邀約管理
/admin/media                媒體庫
/admin/homepage             首頁內容管理
/admin/settings             系統設定
```

---

## 4. 前台頁面規格

---

### 4.1 首頁 `/`

#### 頁面目的

建立品牌第一印象，快速導流至演出、課程、報名與合作邀約等核心轉換路徑。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Global Header** | Logo、主導覽、報名 CTA |
| 2 | **Hero** | 全寬主視覺（圖/影片）+ 品牌標語 + 雙 CTA |
| 3 | **Brand Pillars** | 四大核心：魔術 / 戲劇 / 舞蹈 / 藝術教育 |
| 4 | **Featured Performances** | 近期演出橫向卡片（最多 3 筆） |
| 5 | **Featured Courses** | 精選課程 2×2 Grid（最多 4 筆） |
| 6 | **Collaboration Banner** | 合作邀約漸層 Banner |
| 7 | **About Teaser** | 劇團簡介摘要 + 了解更多 |
| 8 | **Social / Instagram** | 社群連結（Phase 2 可接 IG Feed） |
| 9 | **Global Footer** | 快速連結、聯絡、社群、版權 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Logo | Nav Links | [立即報名]               │
├─────────────────────────────────────────────────────┤
│                                                     │
│              HERO (100vh or 80vh)                   │
│         背景圖/影片 + 漸層遮罩                        │
│         H1 標語 + 副標                              │
│         [探索演出]  [立即報名]                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Brand Pillars — 4 col grid (icon + title + desc)   │
├─────────────────────────────────────────────────────┤
│  近期演出 — Section Title + [查看全部 →]            │
│  ┌──────┐ ┌──────┐ ┌──────┐  (horizontal scroll md) │
│  │ Card │ │ Card │ │ Card │                         │
│  └──────┘ └──────┘ └──────┘                         │
├─────────────────────────────────────────────────────┤
│  精選課程 — Section Title + [查看全部 →]            │
│  ┌──────┐ ┌──────┐                                  │
│  │ Card │ │ Card │   2×2 grid                       │
│  ┌──────┐ ┌──────┐                                  │
│  │ Card │ │ Card │                                  │
├─────────────────────────────────────────────────────┤
│  Collaboration Banner (full-width gradient)         │
│  「邀請我們到您的活動」 [合作邀約]                   │
├─────────────────────────────────────────────────────┤
│  About Teaser — 左圖右文 or 置中                     │
├─────────────────────────────────────────────────────┤
│  Footer                                             │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 按鈕文字 | 連結 | 樣式 |
|------|----------|------|------|
| Header | 立即報名 | `/register` | Primary |
| Hero 主 | 探索演出 | `/performances` | Primary |
| Hero 次 | 立即報名 | `/register` | Secondary / Ghost |
| 近期演出區 | 查看全部 | `/performances` | Link |
| 演出卡片 | 了解詳情 | `/performances/[slug]` | Card hover |
| 精選課程區 | 查看全部 | `/courses` | Link |
| 課程卡片 | 了解詳情 | `/courses/[slug]` | Card hover |
| 合作 Banner | 合作邀約 | `/collaboration` | Primary on gradient |
| About Teaser | 了解更多 | `/about` | Secondary |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `homepage_settings` | hero_title, hero_subtitle, hero_image, hero_video_url, about_teaser |
| `performances` (featured) | id, slug, title, summary, cover_image, status, next_session_date |
| `courses` (featured) | id, slug, title, summary, cover_image, category, status, fee |
| `site_settings` | social links, contact info |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/homepage` | 取得首頁設定 + 精選演出/課程 |
| GET | `/api/performances?featured=true&limit=3` | 精選演出 |
| GET | `/api/courses?featured=true&limit=4` | 精選課程 |
| GET | `/api/settings/public` | 公開站點設定（Footer 用） |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 晟心誠藝劇團 \| Cheng Art Theatre — 魔術·戲劇·舞蹈·藝術教育 |
| `<meta description>` | 晟心誠藝劇團結合魔術、戲劇、舞蹈與藝術教育，提供精彩演出與多元課程。立即探索近期演出與報名資訊。 |
| OG Image | 品牌主視覺圖 1200×630 |
| Structured Data | `Organization` schema（name, logo, url, sameAs） |
| Canonical | `/` |
| hreflang | `zh-TW`（Phase 2 加 `en`） |

#### RWD

| Breakpoint | 調整 |
|------------|------|
| ≥ xl | Hero 100vh，Brand Pillars 4 欄，課程 2×2 |
| lg | Hero 80vh，演出 3 欄 |
| md | Brand Pillars 2×2，演出橫向 scroll |
| < md | Hero 標題 32px，CTA 垂直堆疊，課程 1 欄，Hamburger 選單 |

---

### 4.2 關於我們 `/about`

#### 頁面目的

建立品牌信任與情感連結，完整傳達劇團理念、表演形式與團隊專業。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Hero** | 頁面標題 + 副標 + 背景圖 |
| 2 | **Mission Statement** | 劇團使命與願景 |
| 3 | **Our Story** | 品牌故事時間軸 |
| 4 | **What We Do** | 四大表演形式詳述（魔術/戲劇/舞蹈/教育） |
| 5 | **Team** | 核心成員卡片 |
| 6 | **Milestones** | 重要里程碑 |
| 7 | **CTA Section** | 引導至合作或課程 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Page Hero — 置中標題 + 副標 + 柔和漸層背景          │
├─────────────────────────────────────────────────────┤
│  Mission — 大引語排版（Display 字級）                │
├─────────────────────────────────────────────────────┤
│  Our Story — 垂直時間軸（左線 + 節點卡片）           │
├─────────────────────────────────────────────────────┤
│  What We Do — 2×2 卡片（圖 + icon + 標題 + 描述）    │
├─────────────────────────────────────────────────────┤
│  Team — 3~4 col 成員卡片（照片圓形 + 姓名 + 職稱）   │
├─────────────────────────────────────────────────────┤
│  Milestones — 數字統計（演出場次 / 學員 / 合作單位） │
├─────────────────────────────────────────────────────┤
│  CTA — 「一起創造精彩」[合作邀約] [查看課程]         │
├─────────────────────────────────────────────────────┤
│  Footer                                             │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 按鈕文字 | 連結 |
|------|----------|------|
| 頁尾 CTA 區 | 合作邀約 | `/collaboration` |
| 頁尾 CTA 區 | 查看課程 | `/courses` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `site_settings` 或 CMS 靜態 | mission, story_timeline[], team_members[], milestones[], what_we_do[] |
| `media` | 各區塊配圖 |

> Phase 1 可先以靜態 JSON / MDX 管理，Phase 2 移入後台 CMS。

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/pages/about` | 取得關於頁面內容（Phase 1 可靜態） |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 關於我們 \| 晟心誠藝劇團 Cheng Art Theatre |
| `<meta description>` | 認識晟心誠藝劇團的創立理念、表演形式與專業團隊。我們致力於結合魔術、戲劇、舞蹈與藝術教育。 |
| OG Image | 團隊合照或品牌形象圖 |
| Structured Data | `AboutPage` + `Organization` |

#### RWD

| Breakpoint | 調整 |
|------------|------|
| ≥ lg | Team 4 欄，What We Do 2×2 |
| md | Team 2 欄，時間軸維持左線 |
| < md | Team 1 欄，時間軸改為垂直卡片堆疊，Mission 字級縮小 |

---

### 4.3 演出列表 `/performances`

#### 頁面目的

讓訪客瀏覽所有演出，依狀態篩選並快速找到感興趣的節目。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Header** | 頁面標題 + 簡述 |
| 2 | **Filter Bar** | 狀態篩選 Pill（全部 / 即將演出 / 進行中 / 已結束） |
| 3 | **Performance Grid** | 演出卡片列表 |
| 4 | **Pagination** | 分頁或 Load More |
| 5 | **Empty State** | 無演出時的引導 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Page Header — H1「演出資訊」+ 副標                  │
├─────────────────────────────────────────────────────┤
│  Filter: [全部] [即將演出] [進行中] [已結束]         │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Cover   │ │  Cover   │ │  Cover   │            │
│  │  Title   │ │  Title   │ │  Title   │            │
│  │  Date    │ │  Date    │ │  Date    │            │
│  │  Badge   │ │  Badge   │ │  Badge   │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ... (3 col grid)                                   │
├─────────────────────────────────────────────────────┤
│  Pagination / Load More                             │
└─────────────────────────────────────────────────────┘
```

**卡片結構：**
- Cover Image（16:9，hover scale）
- Status Badge（即將演出 / 進行中 / 已結束）
- Category Tag（魔術 / 戲劇 / 舞蹈 / 綜合）
- Title（H3）
- Next Session Date
- Venue（一行截斷）

#### CTA

| 位置 | 按鈕文字 | 連結 |
|------|----------|------|
| 演出卡片 | 整卡可點 | `/performances/[slug]` |
| Empty State | 查看課程 | `/courses` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `performances` | id, slug, title, summary, cover_image, category, status, sessions[0].date, sessions[0].venue |
| Query params | status, category, page, limit |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/performances` | 列表，支援 `?status=&category=&page=&limit=` |
| GET | `/api/performances?status=UPCOMING&limit=10` | 篩選即將演出 |

**Response 範例：**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "magic-night-2026",
      "title": "魔幻之夜",
      "summary": "...",
      "coverImage": { "url": "...", "alt": "..." },
      "category": "MAGIC",
      "status": "UPCOMING",
      "nextSession": { "date": "2026-08-15T19:30:00Z", "venue": "台北表演藝術中心" }
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 24, "totalPages": 2 }
}
```

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 演出資訊 \| 晟心誠藝劇團 |
| `<meta description>` | 探索晟心誠藝劇團近期演出，包含魔術、戲劇、舞蹈等多元表演節目。 |
| Structured Data | `ItemList` of `Event` |

#### RWD

| Breakpoint | 調整 |
|------------|------|
| ≥ xl | 3 欄 Grid |
| md–lg | 2 欄 |
| < md | 1 欄，Filter Pills 橫向 scroll |

---

### 4.4 演出詳情 `/performances/[slug]`

#### 頁面目的

提供單一演出的完整資訊，引導購票或合作洽詢。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Cover Hero** | 全寬主視覺圖 |
| 2 | **Performance Header** | 標題、副標、分類、狀態 Badge |
| 3 | **Session Info** | 場次列表（日期、地點、票價） |
| 4 | **Content** | 演出介紹 Rich Text |
| 5 | **Gallery** | 相簿（選配） |
| 6 | **Sidebar / Sticky CTA** | 購票 / 合作按鈕 + 關鍵資訊 |
| 7 | **Related Performances** | 相關演出推薦 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Cover Hero — 全寬 21:9 主視覺                       │
├──────────────────────────────┬──────────────────────┤
│  Title + Subtitle + Badges   │  ┌─────────────────┐ │
│                              │  │ Sticky Sidebar  │ │
│  Session Table               │  │ 最近場次         │ │
│  ┌────────────────────────┐  │  │ 地點             │ │
│  │ 2026/08/15 19:30       │  │  │ 票價             │ │
│  │ 台北表演藝術中心        │  │  │ [購票]           │ │
│  └────────────────────────┘  │  │ [合作洽詢]       │ │
│                              │  └─────────────────┘ │
│  Content (Rich Text)         │                      │
│                              │                      │
│  Gallery (optional)          │                      │
├──────────────────────────────┴──────────────────────┤
│  Related Performances — 3 col cards                 │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 按鈕文字 | 行為 |
|------|----------|------|
| Sidebar 主 | 購票資訊 | 外部連結 `ticket_url`（新分頁） |
| Sidebar 次 | 合作洽詢 | `/collaboration?ref=performance&slug=[slug]` |
| 已結束狀態 | 查看其他演出 | `/performances` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `performances` | 全部欄位 |
| `performance_sessions` | date, venue, address, price_note |
| `media` | gallery images |
| Related | 同 category 的其他 performances（limit 3） |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/performances/[slug]` | 單一演出詳情 + sessions + gallery |
| GET | `/api/performances/[slug]/related` | 相關演出 |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | {演出標題} \| 晟心誠藝劇團 |
| `<meta description>` | {summary，160 字內} |
| OG Image | cover_image |
| Structured Data | `Event`（name, startDate, location, offers, image, organizer） |
| Canonical | `/performances/[slug]` |

#### RWD

| Breakpoint | 調整 |
|------------|------|
| ≥ lg | 主內容 2/3 + Sidebar 1/3 sticky |
| < lg | Sidebar 移至 Content 上方或底部 fixed CTA bar |
| < md | Cover Hero 高度縮減，Session 改卡片式 |

---

### 4.5 課程列表 `/courses`

#### 頁面目的

展示所有開放課程，依分類與狀態篩選，引導報名。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Header** | 頁面標題 + 簡述 |
| 2 | **Filter Bar** | 分類 + 狀態篩選 |
| 3 | **Course Grid** | 課程卡片列表 |
| 4 | **Pagination** | 分頁 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Page Header — H1「課程報名」                        │
├─────────────────────────────────────────────────────┤
│  Filter: 分類 [全部|魔術|戲劇|舞蹈|綜合]             │
│          狀態 [全部|招生中|已額滿|已結束]            │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Cover   │ │  Cover   │ │  Cover   │            │
│  │  Badge   │ │  Badge   │ │  Badge   │            │
│  │  Title   │ │  Title   │ │  Title   │            │
│  │  Schedule│ │  Schedule│ │  Schedule│            │
│  │  Fee     │ │  Fee     │ │  Fee     │            │
│  │  名額    │ │  名額    │ │  名額    │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

**卡片結構：**
- Cover Image
- Status Badge（招生中 / 已額滿 / 已結束）
- Category + Age Range
- Title
- Schedule（每週六 14:00-16:00）
- Fee
- 名額進度條（enrolled / capacity）

#### CTA

| 位置 | 按鈕文字 | 連結 |
|------|----------|------|
| 卡片 | 整卡可點 | `/courses/[slug]` |
| 卡片底部 | 立即報名（招生中） | `/register?course=[slug]` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `courses` | id, slug, title, summary, cover_image, category, age_range, schedule, fee, capacity, enrolled_count, status |
| Query params | category, status, page, limit |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/courses` | 列表，支援 `?category=&status=&page=&limit=` |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 課程報名 \| 晟心誠藝劇團 |
| `<meta description>` | 晟心誠藝劇團提供魔術、戲劇、舞蹈等多元藝術課程，適合各年齡層。立即報名！ |
| Structured Data | `ItemList` of `Course` |

#### RWD

| Breakpoint | 調整 |
|------------|------|
| ≥ xl | 3 欄 |
| md–lg | 2 欄 |
| < md | 1 欄，Filter 改 dropdown |

---

### 4.6 課程詳情 `/courses/[slug]`

#### 頁面目的

完整呈現課程資訊，促成報名轉換。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Cover Hero** | 主視覺 |
| 2 | **Course Header** | 標題、分類、狀態、適合年齡 |
| 3 | **Key Info** | 開課日期、時間、地點、費用、名額 |
| 4 | **Content** | 課程介紹 Rich Text |
| 5 | **Instructor** | 師資介紹（選配） |
| 6 | **Sidebar CTA** | 報名按鈕 + 名額狀態 |
| 7 | **Related Courses** | 相關課程 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Cover Hero — 16:9                                   │
├──────────────────────────────┬──────────────────────┤
│  Title + Badges              │  ┌─────────────────┐ │
│  Key Info Grid               │  │ Sticky Sidebar  │ │
│  (日期/時間/地點/費用/名額)   │  │ 名額 8/15       │ │
│                              │  │ ████████░░ 53%  │ │
│  Content                     │  │ [立即報名]      │ │
│                              │  │ 截止：07/30     │ │
│  Instructor (optional)       │  └─────────────────┘ │
├──────────────────────────────┴──────────────────────┤
│  Related Courses                                    │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 按鈕文字 | 連結 | 條件 |
|------|----------|------|------|
| Sidebar 主 | 立即報名 | `/register?course=[slug]` | status = OPEN |
| Sidebar 主 | 已額滿 | disabled | status = FULL |
| Sidebar 主 | 報名截止 | disabled | status = CLOSED |
| Sidebar 次 | 聯絡我們 | `/contact` | 任何狀態 |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `courses` | 全部欄位 |
| Related | 同 category courses（limit 3） |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/courses/[slug]` | 課程詳情 |
| GET | `/api/courses/[slug]/related` | 相關課程 |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | {課程名稱} \| 晟心誠藝劇團課程 |
| `<meta description>` | {summary} |
| OG Image | cover_image |
| Structured Data | `Course`（name, description, provider, offers） |

#### RWD

| Breakpoint | 調整 |
|------------|------|
| ≥ lg | 2/3 + 1/3 sticky sidebar |
| < lg | Sidebar 移至頂部，fixed bottom CTA bar（報名按鈕） |

---

### 4.7 活動列表 `/events`

#### 頁面目的

展示工作坊、營隊、特別活動等短期活動。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Header** | 頁面標題 |
| 2 | **Filter Bar** | 活動類型 + 狀態 |
| 3 | **Event Grid / Timeline** | 活動卡片（可依日期排序） |
| 4 | **Pagination** | 分頁 |

#### UI Layout

同課程列表結構，卡片差異：
- 顯示 `event_date`（單日或日期區間）
- 活動類型 Badge（工作坊 / 營隊 / 特別活動）

#### CTA

| 位置 | 按鈕文字 | 連結 |
|------|----------|------|
| 卡片 | 了解詳情 | `/events/[slug]` |
| 卡片 | 立即報名 | `/register?event=[slug]` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `events` | id, slug, title, summary, cover_image, event_type, event_date, end_date, location, fee, capacity, enrolled_count, status |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/events` | 列表，支援 `?type=&status=&page=&limit=` |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 活動資訊 \| 晟心誠藝劇團 |
| `<meta description>` | 探索晟心誠藝劇團的工作坊、營隊與特別活動。 |

#### RWD

同課程列表。

---

### 4.8 活動詳情 `/events/[slug]`

#### 頁面目的

呈現單一活動完整資訊並引導報名。

#### 區塊介紹

結構同課程詳情，差異在：
- 單日/多日日期顯示
- 活動類型標籤

#### UI Layout

同 `/courses/[slug]` 結構。

#### CTA

| 位置 | 按鈕文字 | 連結 |
|------|----------|------|
| Sidebar | 立即報名 | `/register?event=[slug]` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `events` | 全部欄位 |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/events/[slug]` | 活動詳情 |
| GET | `/api/events/[slug]/related` | 相關活動 |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | {活動名稱} \| 晟心誠藝劇團 |
| `<meta description>` | {summary} |
| Structured Data | `Event` |

#### RWD

同課程詳情。

---

### 4.9 報名頁 `/register`

#### 頁面目的

提供統一報名入口，完成課程或活動的線上登記。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Header** | 報名標題 |
| 2 | **Selection Step** | 選擇課程/活動（若無 query param） |
| 3 | **Selected Item Summary** | 已選項目摘要卡片 |
| 4 | **Registration Form** | 報名表單 |
| 5 | **Privacy Consent** | 同意條款 checkbox |
| 6 | **Submit** | 送出按鈕 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Page Header — H1「線上報名」                        │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │  Selected Item Card                         │    │
│  │  課程名稱 / 活動名稱                         │    │
│  │  時間 · 地點 · 費用                          │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Form (max-width 640px, centered)                   │
│  ┌─────────────────────────────────────────────┐    │
│  │  姓名 *          [________________]         │    │
│  │  電話 *          [________________]         │    │
│  │  Email *         [________________]         │    │
│  │  年齡            [________________]         │    │
│  │  備註            [________________]         │    │
│  │                  [________________]         │    │
│  │  ☐ 我已閱讀並同意隱私權政策                  │    │
│  │                                             │    │
│  │           [確認報名]                         │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**兩步流程（無 pre-select）：**
1. Step 1：選擇類型（課程 / 活動）→ 選擇項目
2. Step 2：填寫表單

#### CTA

| 位置 | 按鈕文字 | 行為 |
|------|----------|------|
| 表單底部 | 確認報名 | POST → 成功頁 |
| 無選擇時 | 下一步 | 進入 Step 2 |

#### 所需資料

**Input（Query）：**
- `?course=[slug]` 或 `?event=[slug]`

**Form Fields：**

| 欄位 | 類型 | 必填 | 驗證 |
|------|------|------|------|
| name | string | ✓ | 2–50 字 |
| phone | string | ✓ | 台灣手機/市話格式 |
| email | string | ✓ | Email 格式 |
| age | number | | 1–120 |
| birth_date | date | | 選配 |
| note | text | | max 500 字 |
| privacy_consent | boolean | ✓ | must be true |

**Backend 需驗證：**
- 課程/活動存在且 status = OPEN
- 名額未滿
- 報名截止日未過

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/courses/[slug]` | 預填課程摘要 |
| GET | `/api/events/[slug]` | 預填活動摘要 |
| GET | `/api/courses?status=OPEN` | 選擇列表 |
| GET | `/api/events?status=OPEN` | 選擇列表 |
| POST | `/api/registrations` | 建立報名 |

**POST `/api/registrations` Request：**
```json
{
  "registrantType": "COURSE",
  "courseId": "uuid",
  "name": "王小明",
  "phone": "0912345678",
  "email": "example@email.com",
  "age": 12,
  "note": "",
  "privacyConsent": true
}
```

**Response 201：**
```json
{
  "registrationNumber": "REG-20260704-001",
  "message": "報名成功"
}
```

**Error Cases：**
- 400：驗證失敗
- 409：名額已滿
- 410：報名已截止

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 線上報名 \| 晟心誠藝劇團 |
| `<meta description>` | 線上報名晟心誠藝劇團課程或活動。 |
| robots | `noindex`（表單頁可不索引） |

#### RWD

| Breakpoint | 調整 |
|------------|------|
| 全尺寸 | Form max-width 640px 置中 |
| < sm | padding 16px，input 100% 寬，button full-width |

---

### 4.10 報名成功 `/register/success`

#### 頁面目的

確認報名完成，提供報名編號與後續說明。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Success Illustration** | 成功圖示/插畫 |
| 2 | **Confirmation Message** | 感謝文字 + 報名編號 |
| 3 | **Summary** | 報名項目摘要 |
| 4 | **Next Steps** | 後續流程說明 |
| 5 | **Actions** | 返回首頁 / 查看其他課程 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│              ✓ Success Icon                         │
│         H1「報名成功！」                             │
│         您的報名編號：REG-20260704-001               │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  報名項目：魔術基礎班                          │    │
│  │  我們將於 1-2 個工作天內與您聯繫確認。         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [返回首頁]    [查看其他課程]                        │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 按鈕文字 | 連結 |
|------|----------|------|
| 主 | 返回首頁 | `/` |
| 次 | 查看其他課程 | `/courses` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| Session / Query | registration_number |
| `registrations` | 報名詳情（需驗證 session token 防直接存取） |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/registrations/[number]` | 取得報名摘要（需 session token） |

#### SEO

| 項目 | 內容 |
|------|------|
| robots | `noindex, nofollow` |

#### RWD

置中單欄，全尺寸一致。

---

### 4.11 合作邀約 `/collaboration`

#### 頁面目的

承接 B2B 合作需求，收集企業/學校/機構的演出邀約資訊。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Hero** | 標題 + 合作價值主張 |
| 2 | **Collaboration Types** | 合作類型說明（4 卡片） |
| 3 | **Past Partners** | 過往合作案例 Logo（選配） |
| 4 | **Inquiry Form** | 合作表單 |
| 5 | **Contact Alternative** | 直接聯絡方式 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Hero — 「與我們合作，創造 unforgettable 體驗」      │
├─────────────────────────────────────────────────────┤
│  合作類型 — 4 col cards                              │
│  [商業演出] [學校巡迴] [工作坊] [客製節目]           │
├─────────────────────────────────────────────────────┤
│  Past Partners — Logo strip（選配）                  │
├─────────────────────────────────────────────────────┤
│  Form (max-width 640px)                             │
│  單位名稱 * / 聯絡人 * / 電話 * / Email *           │
│  合作類型 * / 期望日期 / 預算範圍                    │
│  需求描述 *                                         │
│  ☐ 同意隱私權政策                                   │
│  [送出合作邀約]                                     │
├─────────────────────────────────────────────────────┤
│  或直接聯絡：email / phone                          │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 按鈕文字 | 行為 |
|------|----------|------|
| 表單 | 送出合作邀約 | POST → 成功 Toast + 感謝訊息 |
| 底部 | Email 連結 | `mailto:` |
| 底部 | 電話連結 | `tel:` |

#### 所需資料

**Form Fields：**

| 欄位 | 類型 | 必填 |
|------|------|------|
| organization | string | ✓ |
| contact_name | string | ✓ |
| phone | string | ✓ |
| email | string | ✓ |
| inquiry_type | enum | ✓ |
| preferred_date | string | |
| budget_range | select | |
| description | text | ✓ |
| privacy_consent | boolean | ✓ |

**inquiry_type 選項：**
- COMMERCIAL（商業演出）
- SCHOOL（學校巡迴）
- WORKSHOP（工作坊）
- CUSTOM（客製節目）
- OTHER（其他）

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/inquiries` | 建立合作邀約 |

**POST Request：**
```json
{
  "organization": "XX公司",
  "contactName": "李小姐",
  "phone": "0912345678",
  "email": "contact@company.com",
  "inquiryType": "COMMERCIAL",
  "preferredDate": "2026-09",
  "budgetRange": "50k-100k",
  "description": "希望安排一場 30 分钟的魔术表演...",
  "privacyConsent": true
}
```

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 合作邀約 \| 晟心誠藝劇團 |
| `<meta description>` | 邀請晟心誠藝劇團為您的活動帶來精彩表演。提供商業演出、學校巡迴、工作坊與客製節目服務。 |

#### RWD

Form 置中 max-width 640px；合作類型卡片 md 以下 1 欄。

---

### 4.12 聯絡我們 `/contact`

#### 頁面目的

提供一般性詢問管道與劇團聯絡資訊。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Header** | 標題 |
| 2 | **Contact Info** | 地址、電話、Email、營業時間 |
| 3 | **Map** | Google Maps embed（選配） |
| 4 | **Simple Contact Form** | 簡易詢問表單 |
| 5 | **Social Links** | 社群連結 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  H1「聯絡我們」                                      │
├──────────────────────────────┬──────────────────────┤
│  Contact Info              │  Contact Form        │
│  📍 地址                   │  姓名 / Email / 主旨  │
│  📞 電話                   │  訊息                │
│  ✉️ Email                  │  [送出]              │
│  🕐 營業時間               │                      │
├──────────────────────────────┴──────────────────────┤
│  Map Embed                                          │
├─────────────────────────────────────────────────────┤
│  Social: IG / FB / YouTube                          │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 行為 |
|------|------|
| 電話 | `tel:` 連結 |
| Email | `mailto:` 連結 |
| 表單 | POST 送出 |
| 社群 | 外部連結 |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `site_settings` | address, phone, email, business_hours, social_* |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/settings/public` | 聯絡資訊 |
| POST | `/api/contact` | 送出詢問（Phase 2，或直接 mailto） |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 聯絡我們 \| 晟心誠藝劇團 |
| Structured Data | `ContactPage` + `LocalBusiness` |

#### RWD

| Breakpoint | 調整 |
|------------|------|
| ≥ lg | 左資訊右表單 |
| < lg | 垂直堆疊 |

---

### 4.13 常見問題 `/faq`

#### 頁面目的

降低重複客服詢問，解答報名、退費、合作等常見問題。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Header** | 標題 |
| 2 | **FAQ Categories** | 分類 Tab（報名 / 課程 / 演出 / 合作 / 其他） |
| 3 | **Accordion List** | 手風琴問答列表 |
| 4 | **Still Have Questions** | 引導至聯絡我們 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  H1「常見問題」                                      │
├─────────────────────────────────────────────────────┤
│  Tabs: [報名] [課程] [演出] [合作] [其他]            │
├─────────────────────────────────────────────────────┤
│  ▼ 如何報名課程？                                    │
│    回答文字...                                       │
│  ▶ 報名後可以取消嗎？                                │
│  ▶ 付款方式有哪些？                                  │
│  ...                                                │
├─────────────────────────────────────────────────────┤
│  還有其他問題？ [聯絡我們]                           │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 按鈕文字 | 連結 |
|------|----------|------|
| 底部 | 聯絡我們 | `/contact` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| 靜態 JSON 或 CMS | category, question, answer[] |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/faq` | FAQ 列表（Phase 1 可靜態） |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 常見問題 \| 晟心誠藝劇團 |
| Structured Data | `FAQPage` with `Question` / `Answer` |

#### RWD

Accordion 全寬，Tabs 小螢幕改 dropdown 或 scroll。

---

### 4.14 隱私權政策 `/privacy`

#### 頁面目的

法規合規，說明個資收集與使用方式。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Header** | 標題 + 最後更新日期 |
| 2 | **Legal Content** | 條文內容（Rich Text / MDX） |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  H1「隱私權政策」                                    │
│  最後更新：2026-07-04                               │
├─────────────────────────────────────────────────────┤
│  Prose content (max-width 768px, centered)          │
│  一、總則                                           │
│  二、個資收集目的                                    │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

#### CTA

無主要 CTA。Footer 連結即可。

#### 所需資料

靜態 MDX 或 CMS 內容。

#### API

無（靜態頁面）。

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 隱私權政策 \| 晟心誠藝劇團 |
| robots | `noindex`（選配） |

#### RWD

Prose max-width 768px 置中，全尺寸一致。

---

### 4.15 服務條款 `/terms`

#### 頁面目的

法規合規，說明網站使用與報名條款。

#### 區塊介紹

同 `/privacy` 結構。

#### UI Layout / CTA / API / RWD

同 `/privacy`。

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 服務條款 \| 晟心誠藝劇團 |

---

### 4.16 最新消息 `/news`（Phase 2）

#### 頁面目的

發布劇團動態、媒體報導、活動回顧等內容。

#### 區塊介紹

| # | 區塊名稱 | 說明 |
|---|----------|------|
| 1 | **Page Header** | 標題 |
| 2 | **News Grid** | 文章卡片列表 |
| 3 | **Pagination** | 分頁 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  H1「最新消息」                                      │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Cover   │ │  Cover   │ │  Cover   │            │
│  │  Date    │ │  Date    │ │  Date    │            │
│  │  Title   │ │  Title   │ │  Title   │            │
│  │  Excerpt │ │  Excerpt │ │  Excerpt │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 位置 | 連結 |
|------|------|
| 卡片 | `/news/[slug]` |

#### 所需資料

| 資料來源 | 欄位 |
|----------|------|
| `news` 表（Phase 2） | id, slug, title, excerpt, cover_image, published_at |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/news` | 列表 |
| GET | `/api/news/[slug]` | 詳情 |

#### SEO

| 項目 | 內容 |
|------|------|
| `<title>` | 最新消息 \| 晟心誠藝劇團 |
| Structured Data | `Blog` / `NewsArticle` |

#### RWD

3 → 2 → 1 欄 Grid。

---

## 5. 後台頁面規格

---

### 5.1 後台登入 `/admin/login`

#### 頁面目的

管理員身份驗證入口。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | Login Form | Email + Password |
| 2 | Error Message | 登入失敗提示 |

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│              置中 Card (max-width 400px)             │
│              Logo                                   │
│              Email    [___________]                 │
│              Password [___________]                 │
│              [登入]                                 │
└─────────────────────────────────────────────────────┘
```

#### CTA

| 按鈕 | 行為 |
|------|------|
| 登入 | POST → redirect `/admin` |

#### 所需資料

email, password

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/auth/login` | NextAuth credentials |

#### SEO

`noindex, nofollow`

#### RWD

置中 Card，全尺寸一致。

---

### 5.2 Dashboard `/admin`

#### 頁面目的

管理員首頁，概覽關鍵數據與待辦事項。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | **Stats Cards** | 本週報名數、待處理邀約、即將演出、招生中課程 |
| 2 | **Recent Registrations** | 最新 5 筆報名 |
| 3 | **Pending Inquiries** | 最新 5 筆合作邀約 |
| 4 | **Upcoming Events** | 即將演出/活動時間軸 |
| 5 | **Quick Actions** | 快速新增演出/課程/活動 |

#### UI Layout

```
┌──────────┬──────────────────────────────────────────┐
│          │  Stats: [報名] [邀約] [演出] [課程]       │
│ Sidebar  ├──────────────────────────────────────────┤
│          │  ┌─ Recent Registrations ─────────────┐  │
│          │  │  table (5 rows)                    │  │
│          │  └────────────────────────────────────┘  │
│          │  ┌─ Pending Inquiries ────────────────┐  │
│          │  │  table (5 rows)                    │  │
│          │  └────────────────────────────────────┘  │
│          │  Quick Actions: [+演出] [+課程] [+活動]  │
└──────────┴──────────────────────────────────────────┘
```

#### CTA

| 位置 | 連結 |
|------|------|
| Stats Cards | 各對應管理頁 |
| Quick Actions | `/admin/performances/new` 等 |
| Table rows | 詳情頁 |

#### 所需資料

| 資料 | 來源 |
|------|------|
| 統計數字 | aggregations |
| 最新報名 | registrations (limit 5) |
| 最新邀約 | inquiries (status=NEW, limit 5) |
| 即將演出 | performances + events |

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/dashboard` | 聚合 Dashboard 資料 |

#### SEO

`noindex`（全後台頁面皆同）

#### RWD

| Breakpoint | 調整 |
|------------|------|
| ≥ lg | 左 Sidebar + 主內容 |
| < lg | Sidebar 改 drawer，Stats 2×2 grid |

---

### 5.3 演出管理 `/admin/performances`

#### 頁面目的

管理所有演出內容的 CRUD。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | **Page Header** | 標題 + 新增按鈕 |
| 2 | **Filter / Search** | 狀態篩選、搜尋 |
| 3 | **Data Table** | 演出列表 |
| 4 | **Pagination** | 分頁 |

#### UI Layout

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │  演出管理                    [+ 新增演出] │
│          │  Filter: [全部|草稿|即將|進行|結束]  🔍  │
│          │  ┌────────────────────────────────────┐ │
│          │  │ □ | 標題 | 狀態 | 場次 | 更新 | ⋮  │ │
│          │  │ □ | 魔幻之夜 | 即將 | 2 | 07/01 | ⋮│ │
│          │  └────────────────────────────────────┘ │
│          │  Pagination                             │
└──────────┴──────────────────────────────────────────┘
```

**Row Actions（⋮）：** 編輯、預覽、複製、刪除

#### CTA

| 位置 | 行為 |
|------|------|
| 新增演出 | `/admin/performances/new` |
| 編輯 | `/admin/performances/[id]` |
| 預覽 | 前台 `/performances/[slug]` 新分頁 |

#### 所需資料

performances 列表 + sessions count

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/performances` | 列表 |
| POST | `/api/admin/performances` | 新增 |
| GET | `/api/admin/performances/[id]` | 詳情 |
| PUT | `/api/admin/performances/[id]` | 更新 |
| DELETE | `/api/admin/performances/[id]` | 刪除 |

#### RWD

Table 小螢幕橫向 scroll 或 card 化。

---

### 5.4 新增/編輯演出 `/admin/performances/new` · `/admin/performances/[id]`

#### 頁面目的

建立或編輯單一演出。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | **Basic Info** | 標題、slug、副標、摘要 |
| 2 | **Cover Image** | 主視覺上傳 |
| 3 | **Content Editor** | Rich Text 編輯器 |
| 4 | **Sessions** | 場次管理（動態新增列） |
| 5 | **Settings** | 分類、狀態、精選、票務連結 |
| 6 | **SEO** | meta title / description |
| 7 | **Actions** | 儲存草稿 / 發布 |

#### UI Layout

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │  新增演出                                 │
│          │  ┌─ 基本資訊 ──────────────────────────┐ │
│          │  │ 標題 [________]  Slug [________]    │ │
│          │  │ 摘要 [________]                       │ │
│          │  └───────────────────────────────────────┘ │
│          │  ┌─ 主視覺 ──────────────────────────────┐ │
│          │  │ [Upload / Media Picker]              │ │
│          │  └───────────────────────────────────────┘ │
│          │  ┌─ 內容 ────────────────────────────────┐ │
│          │  │ Rich Text Editor                     │ │
│          │  └───────────────────────────────────────┘ │
│          │  ┌─ 場次 ────────────────────────────────┐ │
│          │  │ + 新增場次                            │ │
│          │  │ 日期 | 地點 | 票價 | [刪除]           │ │
│          │  └───────────────────────────────────────┘ │
│          │  ┌─ 設定 ────────────┐ ┌─ SEO ──────────┐ │
│          │  │ 分類 / 狀態 / 精選 │ │ meta title    │ │
│          │  │ 購票連結           │ │ meta desc     │ │
│          │  └───────────────────┘ └───────────────┘ │
│          │  [儲存草稿]  [發布]                        │
└──────────┴──────────────────────────────────────────┘
```

#### CTA

| 按鈕 | 行為 |
|------|------|
| 儲存草稿 | status = DRAFT |
| 發布 | status = UPCOMING + published_at |

#### 所需資料

完整 performances + performance_sessions 欄位

#### API

同 5.3 POST/PUT。

#### RWD

表單單欄，Settings/SEO 小螢幕垂直堆疊。

---

### 5.5 課程管理 `/admin/courses`

#### 頁面目的

管理所有課程 CRUD。

#### 區塊介紹

同演出管理結構，Table 欄位差異：

| 欄位 | 說明 |
|------|------|
| 標題 | |
| 分類 | |
| 狀態 | OPEN / FULL / CLOSED |
| 名額 | enrolled / capacity |
| 開課日 | |
| 更新時間 | |

#### UI Layout / CTA / API / RWD

結構同 5.3，API 路徑改 `/api/admin/courses`。

**新增/編輯表單額外欄位：**
- age_range, level, start_date, end_date, schedule, location
- fee, fee_note, capacity, registration_deadline

---

### 5.6 活動管理 `/admin/events`

#### 頁面目的

管理所有活動 CRUD。

#### 區塊介紹 / UI Layout / CTA / API / RWD

結構同 5.5，API 路徑 `/api/admin/events`。

**額外欄位：**
- event_type, event_date, end_date

---

### 5.7 報名管理 `/admin/registrations`

#### 頁面目的

查看、篩選、管理所有報名記錄。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | **Filter Bar** | 類型、狀態、日期範圍、搜尋 |
| 2 | **Data Table** | 報名列表 |
| 3 | **Bulk Actions** | 批次確認/匯出 |
| 4 | **Detail Drawer** | 單筆詳情側欄 |

#### UI Layout

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │  報名管理                    [匯出 CSV]  │
│          │  Filter: [類型] [狀態] [日期] 🔍         │
│          │  ┌────────────────────────────────────┐  │
│          │  │ □ | 編號 | 姓名 | 項目 | 狀態 | 日期│  │
│          │  └────────────────────────────────────┘  │
│          │  ┌─ Detail Drawer (右側滑出) ──────────┐  │
│          │  │ 報名詳情 + 狀態更新 + 備註         │  │
│          │  └────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────┘
```

#### CTA

| 位置 | 行為 |
|------|------|
| 匯出 CSV | GET `/api/admin/registrations/export` |
| 狀態更新 | PATCH 單筆 |
| 批次確認 | PATCH bulk |

#### 所需資料

registrations + 關聯 course/event 名稱

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/registrations` | 列表 + 篩選 |
| GET | `/api/admin/registrations/[id]` | 詳情 |
| PATCH | `/api/admin/registrations/[id]` | 更新狀態 |
| GET | `/api/admin/registrations/export` | CSV 匯出 |

#### RWD

Table scroll；Detail Drawer 小螢幕改 full-screen modal。

---

### 5.8 合作邀約管理 `/admin/inquiries`

#### 頁面目的

查看與處理合作邀約。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | **Filter** | 狀態篩選 |
| 2 | **Data Table** | 邀約列表 |
| 3 | **Detail View** | 詳情 + 狀態更新 + 內部備註 |

#### UI Layout

同報名管理，欄位：編號、單位、聯絡人、類型、狀態、日期。

#### CTA

| 位置 | 行為 |
|------|------|
| 標記處理中 | status = IN_PROGRESS |
| 標記完成 | status = COMPLETED |
| 新增備註 | 更新 admin_note |

#### 所需資料

collaboration_inquiries 全部欄位

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/inquiries` | 列表 |
| GET | `/api/admin/inquiries/[id]` | 詳情 |
| PATCH | `/api/admin/inquiries/[id]` | 更新狀態/備註 |

#### RWD

同報名管理。

---

### 5.9 媒體庫 `/admin/media`

#### 頁面目的

上傳、管理、選取網站圖片資源。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | **Upload Zone** | 拖曳上傳 |
| 2 | **Media Grid** | 圖片縮圖網格 |
| 3 | **Detail Panel** | 預覽、alt 文字、URL 複製、刪除 |

#### UI Layout

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │  媒體庫                                   │
│          │  ┌─ Upload Zone ──────────────────────┐  │
│          │  │  拖曳圖片至此或 [選擇檔案]          │  │
│          │  └────────────────────────────────────┘  │
│          │  ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│          │  │img │ │img │ │img │ │img │  grid      │
│          │  └────┘ └────┘ └────┘ └────┘            │
└──────────┴──────────────────────────────────────────┘
```

#### CTA

| 位置 | 行為 |
|------|------|
| 上傳 | POST upload |
| 刪除 | DELETE with confirm |

#### 所需資料

media 表全部欄位

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/media` | 列表 |
| POST | `/api/admin/media/upload` | 上傳 |
| PATCH | `/api/admin/media/[id]` | 更新 alt |
| DELETE | `/api/admin/media/[id]` | 刪除 |

#### RWD

Grid 4 → 3 → 2 欄。

---

### 5.10 首頁內容管理 `/admin/homepage`

#### 頁面目的

管理前台首頁動態內容。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | **Hero Settings** | 標題、副標、背景圖/影片 |
| 2 | **Featured Performances** | 選擇精選演出（最多 3） |
| 3 | **Featured Courses** | 選擇精選課程（最多 4） |
| 4 | **About Teaser** | 首頁關於摘要文字 |

#### UI Layout

```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │  首頁內容管理                             │
│          │  ┌─ Hero ──────────────────────────────┐ │
│          │  │ 標題 / 副標 / 背景圖 / 影片 URL      │ │
│          │  └─────────────────────────────────────┘ │
│          │  ┌─ 精選演出 (最多 3) ──────────────────┐ │
│          │  │ [Search & Select performances]       │ │
│          │  └─────────────────────────────────────┘ │
│          │  ┌─ 精選課程 (最多 4) ──────────────────┐ │
│          │  │ [Search & Select courses]            │ │
│          │  └─────────────────────────────────────┘ │
│          │  [儲存]                                   │
└──────────┴──────────────────────────────────────────┘
```

#### CTA

| 按鈕 | 行為 |
|------|------|
| 儲存 | PUT homepage settings |

#### 所需資料

homepage_settings 全部欄位

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/homepage` | 取得設定 |
| PUT | `/api/admin/homepage` | 更新設定 |

#### RWD

表單單欄。

---

### 5.11 系統設定 `/admin/settings`

#### 頁面目的

管理全站基本設定。

#### 區塊介紹

| # | 區塊 | 說明 |
|---|------|------|
| 1 | **Site Info** | 站名、Logo |
| 2 | **Contact** | 地址、電話、Email、營業時間 |
| 3 | **Social Links** | IG、FB、YouTube |
| 4 | **SEO Defaults** | 預設 meta title / description |
| 5 | **Account** | 修改密碼（選配） |

#### UI Layout

Tab 式表單：基本資訊 | 聯絡資訊 | 社群 | SEO

#### CTA

| 按鈕 | 行為 |
|------|------|
| 儲存 | PUT settings |

#### 所需資料

site_settings 全部欄位

#### API

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/admin/settings` | 取得 |
| PUT | `/api/admin/settings` | 更新 |

#### RWD

表單單欄。

---

## 6. API 總覽

### 6.1 公開 API（前台）

| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| GET | `/api/homepage` | 首頁資料 | - |
| GET | `/api/settings/public` | 公開設定 | - |
| GET | `/api/performances` | 演出列表 | - |
| GET | `/api/performances/[slug]` | 演出詳情 | - |
| GET | `/api/courses` | 課程列表 | - |
| GET | `/api/courses/[slug]` | 課程詳情 | - |
| GET | `/api/events` | 活動列表 | - |
| GET | `/api/events/[slug]` | 活動詳情 | - |
| POST | `/api/registrations` | 建立報名 | - |
| GET | `/api/registrations/[number]` | 報名摘要 | Session |
| POST | `/api/inquiries` | 合作邀約 | - |
| GET | `/api/faq` | FAQ 列表 | - |

### 6.2 管理 API（後台）

| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| GET | `/api/admin/dashboard` | Dashboard 資料 | Admin |
| CRUD | `/api/admin/performances` | 演出管理 | Admin |
| CRUD | `/api/admin/courses` | 課程管理 | Admin |
| CRUD | `/api/admin/events` | 活動管理 | Admin |
| GET/PATCH | `/api/admin/registrations` | 報名管理 | Admin |
| GET | `/api/admin/registrations/export` | CSV 匯出 | Admin |
| GET/PATCH | `/api/admin/inquiries` | 邀約管理 | Admin |
| CRUD | `/api/admin/media` | 媒體庫 | Admin |
| GET/PUT | `/api/admin/homepage` | 首頁設定 | Admin |
| GET/PUT | `/api/admin/settings` | 系統設定 | Admin |

### 6.3 認證

- **方案：** NextAuth.js (Auth.js) Credentials Provider
- **Session：** JWT
- **Middleware：** `/admin/*` 路由保護（`/admin/login` 除外）

### 6.4 通用 Response 格式

**成功：**
```json
{
  "data": { ... },
  "message": "ok"
}
```

**錯誤：**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "姓名為必填",
    "details": [{ "field": "name", "message": "必填" }]
  }
}
```

**HTTP Status Codes：**
- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict（名額已滿）
- 410 Gone（報名截止）
- 500 Internal Server Error

---

## 7. 資料模型摘要

詳細 Schema 見 [`DATABASE.md`](./DATABASE.md)（待建立）或 Prisma schema。

### 核心 Table

| Table | 說明 |
|-------|------|
| `users` | 後台管理員 |
| `performances` | 演出 |
| `performance_sessions` | 演出場次 |
| `courses` | 課程 |
| `events` | 活動 |
| `registrations` | 報名 |
| `collaboration_inquiries` | 合作邀約 |
| `media` | 媒體庫 |
| `homepage_settings` | 首頁設定 |
| `site_settings` | 全站設定 |

### 關鍵 Enum

```typescript
// Performance
enum PerformanceCategory { MAGIC, THEATRE, DANCE, MIXED }
enum PerformanceStatus { DRAFT, UPCOMING, ONGOING, ENDED }

// Course
enum CourseCategory { MAGIC, THEATRE, DANCE, COMPREHENSIVE }
enum CourseLevel { BEGINNER, INTERMEDIATE, ADVANCED }
enum CourseStatus { DRAFT, OPEN, FULL, CLOSED, ENDED }

// Event
enum EventType { WORKSHOP, CAMP, SPECIAL, OTHER }
enum EventStatus { DRAFT, OPEN, FULL, CLOSED, ENDED }

// Registration
enum RegistrantType { COURSE, EVENT }
enum RegistrationStatus { PENDING, CONFIRMED, CANCELLED }

// Inquiry
enum InquiryType { COMMERCIAL, SCHOOL, WORKSHOP, CUSTOM, OTHER }
enum InquiryStatus { NEW, IN_PROGRESS, COMPLETED, DECLINED }

// User
enum UserRole { SUPER_ADMIN, EDITOR, VIEWER }
```

---

## 8. 全域 RWD 規範

### 8.1 共用元件 RWD 行為

| 元件 | ≥ lg | < lg |
|------|------|------|
| **Header** | 水平 Nav + CTA | Hamburger → Full overlay menu |
| **Footer** | 4 欄 | 2 欄 → 1 欄 |
| **Card Grid** | 3 欄 | 2 欄 → 1 欄 |
| **Form** | max-w 640px 置中 | full-width, padding 16px |
| **Detail Sidebar** | sticky 1/3 | 移至 top/bottom fixed bar |
| **Admin Sidebar** | fixed left 240px | drawer toggle |
| **Data Table** | full table | horizontal scroll |

### 8.2 Touch 規範

- 可點擊元素最小 **44×44px**
- Input height ≥ **48px**
- 卡片間距 mobile **gap-6**（24px）

### 8.3 圖片 Responsive Sizes

| 用途 | sizes prop |
|------|------------|
| Hero | `(max-width: 768px) 100vw, 1920px` |
| Card Cover | `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px` |
| Detail Cover | `(max-width: 768px) 100vw, 1200px` |

### 8.4 Typography RWD Scale

| Token | ≥ lg | md | < md |
|-------|------|-----|------|
| Display | 56px | 40px | 32px |
| H1 | 40px | 32px | 28px |
| H2 | 32px | 28px | 24px |
| H3 | 24px | 22px | 20px |
| Body | 16px | 16px | 16px |

---

## 9. 開發 Phase

### Phase 1 — MVP（前台 + 基礎報名）

- [ ] 專案初始化（Next.js + Tailwind + shadcn/ui + Prisma）
- [ ] 設計系統（色彩、字體、元件）
- [ ] 前台全部頁面（靜態 + 動態路由）
- [ ] 報名表單 + API
- [ ] 合作邀約表單 + API
- [ ] 基礎 SEO

### Phase 2 — 後台 CRUD

- [ ] Auth 登入
- [ ] Dashboard
- [ ] 演出/課程/活動 CRUD
- [ ] 報名管理 + CSV 匯出
- [ ] 合作邀約管理
- [ ] 媒體庫
- [ ] 首頁/設定管理

### Phase 3 — 進階功能

- [ ] Email 通知（報名確認、管理員通知）
- [ ] 最新消息 CMS
- [ ] FAQ 後台管理
- [ ] IG Feed 整合
- [ ] 效能優化 + Analytics

### Phase 4 — 擴充（待確認）

- [ ] 線上付款
- [ ] 中英雙語
- [ ] 會員系統

---

## 附錄 A：全域共用元件

| 元件 | 說明 |
|------|------|
| `<Header />` | Logo + Nav + CTA |
| `<Footer />` | 品牌 + 連結 + 社群 + 版權 |
| `<MobileMenu />` | 全屏 overlay 選單 |
| `<PerformanceCard />` | 演出卡片 |
| `<CourseCard />` | 課程卡片 |
| `<EventCard />` | 活動卡片 |
| `<StatusBadge />` | 狀態標籤 |
| `<CategoryBadge />` | 分類標籤 |
| `<PageHeader />` | 內頁標題區 |
| `<EmptyState />` | 無資料狀態 |
| `<Pagination />` | 分頁 |
| `<RegistrationForm />` | 報名表單 |
| `<InquiryForm />` | 合作表單 |
| `<RichTextContent />` | 渲染 Rich Text |
| `<ImageGallery />` | 圖片相簿 |
| `<AdminLayout />` | 後台布局 |
| `<AdminSidebar />` | 後台側欄 |
| `<DataTable />` | 後台表格 |

---

## 附錄 B：待確認事項

| # | 問題 | 預設方案 |
|---|------|----------|
| 1 | 是否需要「最新消息」？ | Phase 2 |
| 2 | 報名是否需要線上付款？ | Phase 1 僅登記名額 |
| 3 | 演出是否需要線上報名？ | 否，僅外部購票連結 |
| 4 | 是否需要中英雙語？ | Phase 1 中文為主 |
| 5 | 後台帳號數量？ | Phase 1 單一 Admin |
| 6 | 域名？ | 待提供 |

---

*文件結束 — 確認後開始 Phase 1 開發*
