#!/bin/bash

echo "🚀 Setup MySQL untuk TPA Universitas (macOS)"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew tidak terinstall. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "📦 Installing MySQL via Homebrew..."
    brew install mysql
else
    echo "✅ MySQL sudah terinstall"
fi

# Start MySQL service
echo "🔧 Starting MySQL service..."
brew services start mysql

# Wait a moment for MySQL to start
sleep 3

# Reset MySQL root password to empty
echo "🔐 Resetting MySQL root password..."
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '';" 2>/dev/null || true
mysql -u root -e "FLUSH PRIVILEGES;" 2>/dev/null || true

# Create database
echo "📊 Creating database..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS tpa_universitas;" 2>/dev/null || true

echo "✅ MySQL setup selesai!"
echo ""
echo "📊 Database Info:"
echo "   Host: localhost"
echo "   Port: 3306"
echo "   Database: tpa_universitas"
echo "   Username: root"
echo "   Password: (empty)"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: node setup-database.js"
echo "   2. Run: npm run dev"
echo "   3. Access: http://localhost:3000" 