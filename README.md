# TPA Universitas - Platform Tes Potensi Akademik

Platform Tes Potensi Akademik untuk Masuk Universitas dengan fitur multiple answers dan manajemen soal yang lengkap.

## 🚀 Fitur Utama

- ✅ **Multiple Answers**: Single/Multiple answer selection
- ✅ **Form Validation**: Smart validation untuk jawaban kosong
- ✅ **Image Support**: Upload gambar untuk soal dan jawaban
- ✅ **Admin Dashboard**: Manajemen soal dan statistik
- ✅ **View Soal**: Modal detail dengan multiple answers display
- ✅ **Database**: PostgreSQL dengan schema yang lengkap

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd tes-tpa

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Setup database
node setup-database.js

# Run development server
npm run dev
```

## 🌐 Deployment di Vercel

### 1. **Database Setup**

Pilih salah satu database PostgreSQL:

**Option A: Neon (Recommended)**

```bash
# Sign up di https://neon.tech
# Buat database baru
# Copy connection string
```

**Option B: Supabase**

```bash
# Sign up di https://supabase.com
# Buat project baru
# Copy connection string
```

### 2. **Environment Variables di Vercel**

Set environment variables di Vercel dashboard:

```bash
DB_HOST=your-database-host
DB_PORT=5432
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
NODE_ENV=production
```

### 3. **Deploy ke Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel --prod
```

### 4. **Database Migration**

Setelah deploy, jalankan setup database:

```bash
# Via Vercel dashboard atau CLI
curl -X POST https://your-app.vercel.app/api/init-db
```

## 📁 Project Structure

```
tes-tpa/
├── app/
│   ├── admin/           # Admin dashboard
│   ├── api/            # API routes
│   ├── components/     # React components
│   └── peserta/        # User dashboard
├── lib/
│   └── database.ts     # Database configuration
├── public/
│   └── uploads/        # File uploads
└── setup-database.js   # Database setup script
```

## 🔧 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📊 Database Schema

### Tables:

- `users` - User management
- `tests` - Test configuration
- `questions` - Question bank with TPA fields
- `test_sessions` - Test sessions and results

### Key Features:

- Multiple answer support
- Image upload for questions/answers
- Category and subcategory management
- Difficulty levels
- Usage statistics

## 🎯 API Endpoints

- `POST /api/questions` - Create new question
- `GET /api/questions` - Get questions list
- `GET /api/admin/stats/soal` - Get question statistics
- `POST /api/init-db` - Initialize database

## 📝 License

MIT License
