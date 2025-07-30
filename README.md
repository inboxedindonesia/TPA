# 🎓 Platform TPA Universitas

Platform Tes Potensi Akademik (TPA) online untuk masuk universitas dengan fitur admin dan peserta yang sederhana dan efisien.

## 🚀 Fitur Utama

### **Untuk Admin:**

- ✅ **Dashboard Admin** - Overview statistik dan manajemen tes
- ✅ **Kelola Soal** - Buat, edit, dan hapus soal TPA
- ✅ **Bank Soal** - Suggestion soal dari bank soal yang ada
- ✅ **Kelola Tes** - Buat dan atur tes dengan berbagai konfigurasi
- ✅ **Monitoring Peserta** - Lihat progress dan hasil peserta

### **Untuk Peserta:**

- ✅ **Dashboard Peserta** - Overview tes tersedia dan hasil
- ✅ **Tes Online** - Mengerjakan tes dengan timer dan navigasi
- ✅ **Hasil Tes** - Lihat skor dan analisis hasil
- ✅ **Keamanan Tes** - Tidak bisa keluar halaman selama tes berlangsung

## 🛠️ Teknologi

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Custom CSS Animations
- **Icons:** Lucide React
- **Database:** Prisma ORM dengan SQLite
- **Authentication:** Custom JWT dengan bcryptjs

## 📱 Cara Menjalankan

### **1. Install Dependencies**

```bash
npm install
```

### **2. Setup Database**

```bash
# Buat file .env.local
echo 'DATABASE_URL="file:./dev.db"' > .env.local

# Setup database
npx prisma generate
DATABASE_URL="file:./dev.db" npx prisma db push

# Seed data awal
DATABASE_URL="file:./dev.db" npm run db:seed
```

### **3. Jalankan Server**

```bash
npm run dev
```

### **4. Akses Aplikasi**

- **URL:** http://localhost:3000
- **Demo Admin:** admin@tpa.com / admin123
- **Demo Peserta:** user@tpa.com / user123

## 🎯 Alur Aplikasi

### **1. Login & Redirect**

- Akses `/` → Redirect ke `/login`
- Login sebagai **Admin** → Redirect ke `/admin/dashboard`
- Login sebagai **Peserta** → Redirect ke `/peserta/dashboard`

### **2. Dashboard Admin**

- **Overview:** Statistik peserta, soal, tes aktif
- **Kelola Soal:** Buat soal baru dengan preview real-time
- **Kelola Tes:** Buat tes dengan konfigurasi durasi dan soal
- **Monitoring:** Lihat progress peserta dan hasil tes

### **3. Dashboard Peserta**

- **Tes Tersedia:** Lihat tes yang bisa dikerjakan
- **Hasil Tes:** Lihat skor dan analisis hasil
- **Mulai Tes:** Klik "Mulai Tes" untuk mengerjakan

### **4. Halaman Tes (Peserta)**

- **Keamanan:** Tidak bisa keluar halaman atau refresh
- **Timer:** Countdown timer dengan warning
- **Navigasi:** Navigasi soal dengan progress bar
- **Submit:** Auto-submit saat waktu habis

## 🔒 Fitur Keamanan

### **Selama Tes Berlangsung:**

- ⚠️ **Prevent Navigation** - Tidak bisa keluar halaman
- ⚠️ **Prevent Refresh** - Warning saat refresh browser
- ⚠️ **Prevent Close** - Konfirmasi saat tutup tab
- ⚠️ **Timer Warning** - Warning saat waktu hampir habis
- ⚠️ **Auto Submit** - Submit otomatis saat waktu habis

### **Authentication:**

- 🔐 **JWT Token** - Secure token management
- 🔐 **Password Hashing** - bcryptjs untuk keamanan
- 🔐 **Role-based Access** - Admin vs Peserta

## 📊 Database Schema

### **User**

```sql
- id (Primary Key)
- name
- email (Unique)
- password (Hashed)
- role (ADMIN/PESERTA)
- createdAt
- updatedAt
```

### **Test**

```sql
- id (Primary Key)
- name
- description
- duration (minutes)
- totalQuestions
- isActive
- createdBy (User ID)
- createdAt
- updatedAt
```

### **Question**

```sql
- id (Primary Key)
- question (Text)
- type (MULTIPLE_CHOICE/TRUE_FALSE)
- options (JSON)
- correctAnswer
- category
- difficulty
- explanation
- testId (Foreign Key)
- createdBy (User ID)
- createdAt
- updatedAt
```

### **TestSession**

```sql
- id (Primary Key)
- userId (Foreign Key)
- testId (Foreign Key)
- status (ONGOING/COMPLETED/TIMEOUT)
- startTime
- endTime
- score
- maxScore
- createdAt
- updatedAt
```

### **Answer**

```sql
- id (Primary Key)
- sessionId (Foreign Key)
- questionId (Foreign Key)
- selectedAnswer
- isCorrect
- pointsEarned
- answeredAt
```

## 🎨 UI/UX Features

### **Modern Design:**

- 🎨 **Light Theme** - Clean dan professional
- 🌈 **Gradient Backgrounds** - Visual yang menarik
- ⚡ **Smooth Animations** - Transisi yang halus
- 📱 **Responsive Design** - Mobile-friendly

### **Interactive Elements:**

- 🎯 **Progress Bars** - Visual progress tes
- ⏰ **Dynamic Timer** - Warna berubah sesuai waktu
- 🔄 **Hover Effects** - Feedback visual
- 📊 **Real-time Stats** - Statistik live

## 🚧 Development Status

### **✅ Completed:**

- [x] Authentication system
- [x] Admin dashboard
- [x] Peserta dashboard
- [x] Tes interface dengan keamanan
- [x] Soal creation system
- [x] Database schema
- [x] UI/UX design
- [x] Responsive layout

### **🔄 In Progress:**

- [ ] Bank soal integration
- [ ] Real-time timer sync
- [ ] Export hasil PDF
- [ ] Email notifications

### **📋 Planned:**

- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced security features

## 🐛 Troubleshooting

### **Styling Issues:**

```bash
# Clear cache dan restart
pkill -f "next dev"
npm run dev
# Hard refresh browser: Ctrl+Shift+R
```

### **Database Issues:**

```bash
# Reset database
rm -f prisma/dev.db
DATABASE_URL="file:./dev.db" npx prisma db push
DATABASE_URL="file:./dev.db" npm run db:seed
```

### **Port Issues:**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

## 📞 Support

- **Email:** support@tpa-universitas.com
- **Documentation:** `/docs` folder
- **Issues:** GitHub Issues

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** 🟢 **ACTIVE & RUNNING**
