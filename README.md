# Renavault — CFO Suite

Aplikasi financial management untuk brand fashion/streetwear. Dibangun dengan **Vite + React + TypeScript + Tailwind CSS + Firebase Firestore**.

## Fitur

| Modul | Fungsi |
|-------|--------|
| **Dashboard** | Ringkasan cash, runway, profit, margin, budget vs actual |
| **FP&A** | Budget planner, proyeksi cashflow, scenario simulator |
| **Treasury** | Kelola uang masuk/keluar, jadwal transaksi, alert cash minimum |
| **Accounting** | Laba rugi, neraca, estimasi pajak, buku besar |
| **Pricing** | Margin calculator per SKU/drop, break-even analysis |
| **Fundraising** | Cap table, key metrics investor, readiness checklist |
| **Risk & Controls** | Risk register, approval workflow, control policies |

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Setup Firebase (Firestore)

### 1. Buat project di Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. **Add project** → isi nama (mis. `renavault`)
3. Disable Google Analytics (opsional)

### 2. Aktifkan Firestore

1. Di sidebar: **Build → Firestore Database**
2. **Create database** → mode **Production** (atau Test untuk dev)
3. Pilih region terdekat (mis. `asia-southeast1`)

### 3. Daftarkan Web App

1. **Project Settings** (ikon gear) → **Your apps** → **Web** (`</>`)
2. Register app → copy config `firebaseConfig`

### 4. Konfigurasi environment

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=renavault.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=renavault
VITE_FIREBASE_STORAGE_BUCKET=renavault.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Restart dev server setelah mengubah `.env.local`.

### 5. Aktifkan Authentication

1. **Build → Authentication → Get started**
2. Enable **Email/Password**
3. Enable **Google** (opsional, tambahkan support email)
4. **Settings → Authorized domains** → pastikan `renavault.vercel.app` ada

### 6. Deploy Firestore Rules

Di Firebase Console → **Firestore → Rules**, paste isi `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/modules/{moduleId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Klik **Publish**.

### 7. Struktur data di Firestore

Data per user, dipisah per modul:

```
users/{userId}/modules/
  ├── fpa           ← budgets
  ├── treasury      ← cashBalance, transactions
  ├── accounting    ← taxRate
  ├── pricing       ← drops
  ├── fundraising   ← investors
  └── risk          ← risks, approvals
```

Setiap akun punya database sendiri — data tidak tercampur antar user.

## Fallback tanpa Firebase

Kalau `.env.local` belum diisi, app otomatis pakai **localStorage** (seperti sebelumnya). Indikator "Local storage" muncul di sidebar.

## Upload ke GitHub (privasi env)

**Yang aman di-commit:**
- `.env.example` — template kosong, tanpa credential
- Semua source code

**Jangan pernah di-commit:**
- `.env`, `.env.local`, atau file env berisi API key

Sudah di-ignore via `.gitignore`. Setelah clone, masing-masing developer buat `.env.local` sendiri:

```bash
cp .env.example .env.local
# lalu isi dengan config Firebase pribadi
```

**Deploy (Vercel / Netlify / Firebase Hosting):** set env vars di dashboard hosting, bukan di repo.

**GitHub Actions (opsional):** pakai **Repository Secrets** (`Settings → Secrets and variables → Actions`).

## Deploy ke Vercel

Repo sudah include `vercel.json` untuk Vite + React Router (SPA routing).

### Opsi A — Import dari GitHub (disarankan)

1. Buka [vercel.com/new](https://vercel.com/new)
2. **Import** repo `fats4/renavault`
3. Vercel auto-detect **Vite** — biarkan default:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Klik **Deploy**

### Opsi B — Deploy via CLI

```bash
npx vercel login
npx vercel --prod
```

### Environment Variables (Firebase)

Set di **Vercel → Project → Settings → Environment Variables** (bukan di repo):

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | dari Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `xxx.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | `xxx.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | sender id |
| `VITE_FIREBASE_APP_ID` | app id |

Centang **Production**, **Preview**, dan **Development**. Redeploy setelah menambah env.

Tanpa env vars, app tetap jalan pakai **localStorage** (data per browser).

### Firebase — Authorized Domains

Setelah deploy, tambahkan domain Vercel di Firebase Console:

**Authentication → Settings → Authorized domains** (jika pakai Auth nanti)

Untuk Firestore web app, pastikan domain production sudah terdaftar di **Project Settings → Your apps → Web app**.

Contoh domain yang perlu ditambahkan:
- `renavault.vercel.app`
- custom domain (jika ada)

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS 4
- Firebase Firestore (database)
- Recharts + Lucide React

Data sample brand fashion sudah ter-load. Gunakan **Reset Data** di sidebar untuk kembali ke data awal.
