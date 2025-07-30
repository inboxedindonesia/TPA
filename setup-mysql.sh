#!/bin/bash

echo "🚀 Setup MySQL untuk TPA Universitas"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL tidak terinstall. Installing MySQL..."
    
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "📦 Installing MySQL via Homebrew..."
        brew install mysql
        brew services start mysql
    else
        echo "📦 Installing MySQL via apt..."
        sudo apt update
        sudo apt install mysql-server -y
        sudo systemctl start mysql
        sudo systemctl enable mysql
    fi
else
    echo "✅ MySQL sudah terinstall"
fi

# Start MySQL service
if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start mysql
else
    sudo systemctl start mysql
fi

echo "🔧 Setting up database..."

# Create database and user
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS tpa_universitas;
CREATE USER IF NOT EXISTS 'tpa_user'@'localhost' IDENTIFIED BY 'tpa_password';
GRANT ALL PRIVILEGES ON tpa_universitas.* TO 'tpa_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Database setup selesai!"

# Create .env.local file
echo "📝 Creating .env.local file..."
cat > .env.local << EOF
DATABASE_URL="mysql://tpa_user:tpa_password@localhost:3306/tpa_universitas"
JWT_SECRET="your-super-secret-jwt-key-for-development"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"
EOF

echo "✅ .env.local file created!"

# Install Prisma dependencies
echo "📦 Installing Prisma dependencies..."
npm install @prisma/client

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "📊 Pushing schema to database..."
npx prisma db push

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo "🎉 Setup MySQL selesai!"
echo ""
echo "📊 Database Info:"
echo "   Database: tpa_universitas"
echo "   User: tpa_user"
echo "   Password: tpa_password"
echo "   Host: localhost"
echo "   Port: 3306"
echo ""
echo "🌐 phpMyAdmin: http://localhost/phpmyadmin"
echo "   (jika XAMPP/WAMP terinstall)"
echo ""
echo "🚀 Next steps:"
echo "   1. Start development server: npm run dev"
echo "   2. Access: http://localhost:3000"
echo "   3. Login with: admin@tpa.com / admin123" 