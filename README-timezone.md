# Timezone Configuration Guide

## Masalah yang Diperbaiki

Aplikasi mengalami perbedaan waktu antara environment lokal dan production (Vercel) karena:
1. Server Vercel menggunakan UTC timezone
2. Database tidak konsisten dalam penanganan timezone
3. Frontend timer calculation tidak mempertimbangkan timezone

## Solusi yang Diterapkan

### 1. Konfigurasi Vercel (vercel.json)
```json
{
  "env": {
    "TZ": "Asia/Jakarta",
    "PGTZ": "Asia/Jakarta"
  }
}
```

### 2. Environment Variables
Tambahkan ke `.env.local`:
```
TZ=Asia/Jakarta
PGTZ=Asia/Jakarta
```

### 3. Database Migration
Jalankan script berikut di production:

#### Cek Status Timezone:
```sql
-- File: scripts/check_timezone_migration.sql
SELECT current_setting('timezone');
SELECT column_default FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'created_at';
```

#### Perbaiki Timezone:
```sql
-- File: scripts/fix_timezone_production.sql
SET timezone = 'Asia/Jakarta';
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');
-- dst untuk tabel lainnya...
```

### 4. Frontend Timer Utility
Dibuat utility library `lib/timezone.ts` untuk:
- Konsistensi perhitungan waktu
- Format waktu yang seragam
- Penanganan timezone yang tepat

## Cara Deploy Perbaikan

### 1. Update Environment Variables di Vercel
```bash
vercel env add TZ
# Input: Asia/Jakarta

vercel env add PGTZ  
# Input: Asia/Jakarta
```

### 2. Jalankan Database Migration
```bash
# Connect ke production database
psql $DATABASE_URL -f scripts/fix_timezone_production.sql
```

### 3. Deploy Aplikasi
```bash
vercel --prod
```

## Verifikasi Perbaikan

### 1. Cek Timezone Server
```bash
# Di production console
echo $TZ
# Output: Asia/Jakarta
```

### 2. Cek Database Timezone
```sql
SELECT current_setting('timezone');
-- Output: Asia/Jakarta
```

### 3. Test Timer Consistency
1. Buat test session di lokal
2. Buat test session di production  
3. Bandingkan waktu countdown
4. Pastikan durasi sama

## Troubleshooting

### Timer Masih Berbeda
1. Cek environment variables di Vercel dashboard
2. Restart Vercel functions: `vercel --prod`
3. Clear browser cache
4. Cek database timezone setting

### Database Timezone Tidak Berubah
1. Pastikan user database punya permission ALTER
2. Restart database connection pool
3. Cek apakah migration script berhasil dijalankan

### Frontend Timer Tidak Akurat
1. Cek import timezone utility di komponen
2. Pastikan session.startTime format konsisten
3. Debug dengan console.log waktu calculation

## File yang Dimodifikasi

1. `vercel.json` - Tambah environment variables
2. `.env.example` - Template environment variables
3. `lib/timezone.ts` - Utility functions untuk timezone
4. `app/peserta/tes/[id]/page.tsx` - Update timer calculation
5. `scripts/check_timezone_migration.sql` - Script cek status
6. `scripts/fix_timezone_production.sql` - Script perbaikan database

## Monitoring

Setelah deploy, monitor:
1. Test session creation time
2. Timer countdown accuracy
3. Database timestamp consistency
4. User experience reports