# APi.foolid (Next.js)

Direktori API scrape yang dibangun komunitas. Login GitHub, share endpoint kamu lengkap
sama README (markdown), orang lain browse & pakai. Dibangun pakai **Next.js 14 (App Router)**
+ **Firebase** (Auth + Firestore).

## Struktur project

```
apifoolid-next/
├── app/
│   ├── layout.js            # shell global (navbar, footer, toast provider)
│   ├── globals.css          # semua styling (tema terminal)
│   ├── page.js               # "/" — direktori API (search + filter, realtime)
│   ├── submit/page.js        # "/submit" — form share API (login-gated)
│   ├── edit/[id]/page.js     # "/edit/:id" — edit API milik sendiri
│   ├── playground/page.js    # "/playground" — test endpoint langsung
│   └── item/[id]/page.js     # "/item/:id" — detail + README markdown
├── components/
│   ├── Navbar.js
│   ├── Hero.js               # animasi boot terminal
│   ├── ApiCard.js
│   └── Toast.js              # context buat notifikasi kecil
├── hooks/
│   └── useAuth.js            # subscribe ke Firebase auth state
├── lib/
│   ├── firebase.js           # init Firebase app/auth/firestore
│   └── auth.js               # loginWithGithub / logout
├── firestore.rules
├── .env.local.example
└── package.json
```

## 1. Install dependencies

```bash
npm install
```

## 2. Bikin project Firebase

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Klik ikon **Web (</>)** untuk register web app → salin config yang muncul.
3. Copy `.env.local.example` jadi `.env.local`, isi semua `NEXT_PUBLIC_FIREBASE_*` dengan
   config tadi (config web Firebase memang publik/aman dipakai di client).

```bash
cp .env.local.example .env.local
```

## 3. Aktifkan GitHub Login

1. Firebase Console → **Build → Authentication → Sign-in method** → aktifkan **GitHub**.
2. Bikin OAuth App di [github.com/settings/developers](https://github.com/settings/developers):
   - **Homepage URL**: domain deploy kamu (misal `https://apifoolid.vercel.app`).
   - **Authorization callback URL**: ambil dari form GitHub provider di Firebase
     (pola: `https://<project-id>.firebaseapp.com/__/auth/handler`).
3. Salin Client ID & Client Secret dari GitHub OAuth App ke Firebase, save.
4. Firebase Console → Authentication → **Settings → Authorized domains** → tambahkan domain
   hosting kamu (`localhost` sudah otomatis ada untuk dev).

## 4. Setup Firestore

1. Firebase Console → **Build → Firestore Database** → Create database (mode production).
2. Deploy `firestore.rules`:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # pilih project kamu, pakai firestore.rules yang sudah ada
   firebase deploy --only firestore:rules
   ```
   Atau paste manual isi `firestore.rules` ke tab **Rules** di Firestore Console.

Struktur data (dibuat otomatis lewat app, nggak perlu bikin manual):

- `users/{uid}` → `{ name, avatar, githubUsername, createdAt, updatedAt }`
- `apis/{autoId}` → `{ title, slug, description, method, category, tags[], endpoint, repoUrl, readme, likes[], authorUid, authorName, authorAvatar, authorGithub, createdAt, updatedAt }`

## 5. Jalanin lokal

```bash
npm run dev
```

Buka `http://localhost:3000`. Login GitHub langsung bisa dites (localhost otomatis
authorized di Firebase Auth).

## 6. Deploy

Paling gampang ke **Vercel** (native buat Next.js):

```bash
npm install -g vercel
vercel
```

Tambahkan semua env var `NEXT_PUBLIC_FIREBASE_*` di Vercel dashboard (Project → Settings →
Environment Variables), lalu tambahkan domain hasil deploy Vercel ke **Authorized domains**
di Firebase Auth supaya popup login GitHub jalan. Firebase Hosting juga bisa dipakai kalau
lebih suka satu ekosistem sama Auth/Firestore.

## Fitur yang sudah ada

- Login/logout via GitHub OAuth (Firebase Auth)
- Direktori API publik: search, filter kategori, realtime update (`onSnapshot`)
- Form share API (login-gated) dengan editor README markdown
- Halaman detail: README dirender jadi HTML (marked + DOMPurify buat sanitize) — ditandai dengan ikon file (`./readme.md`)
- Like per API (satu like per user, disimpan sebagai array uid)
- Pemilik API bisa edit & hapus API miliknya sendiri
- Playground built-in: test endpoint langsung dari browser (ganti query param, kirim request, lihat response)
- Kode snippet bisa di-scroll (overflow auto) biar halaman nggak panjang

## Ide pengembangan lanjut

- Halaman profil `/user/[uid]` nampilin semua API dari satu user
- Server Component + `getDocs` di build time untuk SEO metadata per API (saat ini semua
  client-side karena butuh Firebase Auth di browser)
- Rate limiting submit via Cloud Functions
- Validasi endpoint hidup (ping check) sebelum publish

