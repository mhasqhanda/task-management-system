# TaskFlow - Enterprise Task Management System

TaskFlow adalah sistem manajemen tugas (Task Management System) tingkat enterprise yang dibangun dengan arsitektur modern. Sistem ini dirancang untuk tim internal dan klien, dengan pemisahan hak akses yang ketat (Role-Based Access Control) dan fitur kolaborasi *real-time*.

## 🚀 Fitur Utama

- **Role-Based Access Control (RBAC) & Multi-tenancy**
  - **Product Manager**: Memiliki kontrol penuh untuk membuat, mengedit, dan menghapus tugas/komentar. Dapat melihat semua proyek.
  - **Internal Team (Developer/Designer/QA)**: Hanya dapat melihat tugas internal dan menggeser tugas yang ditugaskan kepada mereka di papan Kanban. Tidak dapat menandai tugas sebagai "Done".
  - **Client Guest**: Akses terbatas hanya pada proyek klien yang bersangkutan. Hanya dapat melihat tugas yang ditandai sebagai `isClientVisible: true`.
  - **Identity Masking**: Klien tidak akan melihat nama asli maupun departemen dari anggota tim internal pada tugas maupun di dalam kolom komentar (nama disamarkan menjadi "Internal Member").

- **Interactive Kanban Board**
  - Papan Kanban *drag-and-drop* bawaan (HTML5) yang mulus.
  - Validasi *client-side* dan *server-side* untuk memastikan pengguna hanya dapat memindahkan tugas sesuai dengan peran dan penugasannya.

- **Dependency Guard (Sistem Ketergantungan Tugas)**
  - Tugas dapat saling memblokir. Jika sebuah tugas bergantung pada tugas lain, tugas tersebut tidak dapat dipindahkan ke status `IN_PROGRESS` atau `DONE` sampai semua tugas prasyaratnya telah selesai (`DONE`).

- **Optimistic Locking (Pencegahan Konflik Data)**
  - Setiap tugas memiliki nomor `version`. Jika dua pengguna mencoba mengubah tugas yang sama secara bersamaan, sistem akan menolak perubahan kedua dengan status `409 Conflict` untuk mencegah data saling tumpih tindih (overwriting).

- **Collaborative Comment Thread**
  - Fitur laci (drawer) interaktif pada detail tugas yang berisi riwayat percakapan.
  - Memungkinkan kolaborasi antara PM, Tim Internal, dan Klien.
  - Penghapusan komentar dibatasi (hanya penulis atau PM).

- **Immutable Audit Trail**
  - Sistem secara otomatis mencatat setiap perubahan pada tugas (POST, PATCH, DELETE) menggunakan *Global Interceptor* di sisi backend, menyimpan nilai lama dan nilai baru sebagai log audit permanen.

## 💻 Tech Stack

**Frontend (Client)**
- [Next.js 15 (App Router)](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query (React Query)](https://tanstack.com/query/latest)
- [Axios](https://axios-http.com/)
- [React Hot Toast](https://react-hot-toast.com/)

**Backend (API)**
- [NestJS](https://nestjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [JWT Authentication](https://jwt.io/) & [Bcrypt](https://www.npmjs.com/package/bcrypt)

**Infrastruktur**
- Docker & Docker Compose (untuk database lokal)

## 🛠 Instalasi & Menjalankan Aplikasi di Lokal

### 1. Prasyarat
- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (untuk menjalankan PostgreSQL)

### 2. Jalankan Database (Docker)
Di folder root proyek, jalankan:
```bash
docker-compose up -d
```

### 3. Setup Backend
Buka terminal baru:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts  # Mengisi data awal/dummy
npm run start:dev
```
Backend akan berjalan di `http://localhost:3001`

### 4. Setup Frontend
Buka terminal baru lainnya:
```bash
cd frontend
npm install
npm run dev
```
Frontend akan berjalan di `http://localhost:3000`

---
*Dibangun oleh tim Anda.*
