#!/bin/bash

echo "🔧 Fixing MySQL socket for XAMPP macOS..."

# Check if XAMPP is installed
if [ ! -d "/Applications/XAMPP" ]; then
    echo "❌ XAMPP tidak ditemukan di /Applications/XAMPP"
    echo "💡 Pastikan XAMPP sudah terinstall dengan benar"
    exit 1
fi

# Stop MySQL if running
echo "🛑 Stopping MySQL..."
sudo /Applications/XAMPP/xamppfiles/bin/mysql.server stop 2>/dev/null || true

# Create MySQL socket directory
echo "📁 Creating MySQL socket directory..."
sudo mkdir -p /Applications/XAMPP/xamppfiles/var/mysql
sudo chmod 755 /Applications/XAMPP/xamppfiles/var/mysql

# Fix permissions
echo "🔐 Fixing permissions..."
sudo chown -R daemon:daemon /Applications/XAMPP/xamppfiles/var/mysql
sudo chmod -R 755 /Applications/XAMPP/xamppfiles

# Start MySQL
echo "🚀 Starting MySQL..."
sudo /Applications/XAMPP/xamppfiles/bin/mysql.server start

# Wait for MySQL to start
sleep 3

# Test MySQL connection
echo "🧪 Testing MySQL connection..."
if /Applications/XAMPP/xamppfiles/bin/mysql -u root -e "SELECT 1;" 2>/dev/null; then
    echo "✅ MySQL is running successfully!"
    echo ""
    echo "📊 MySQL Info:"
    echo "   Socket: /Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"
    echo "   Port: 3306"
    echo "   User: root"
    echo "   Password: (empty)"
    echo ""
    echo "🌐 Access Points:"
    echo "   phpMyAdmin: http://localhost/phpmyadmin"
    echo "   XAMPP Dashboard: http://localhost/dashboard/"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Buka http://localhost/phpmyadmin"
    echo "   2. Create database: tpa_universitas"
    echo "   3. Run: node setup-database.js"
else
    echo "❌ MySQL failed to start"
    echo "💡 Check XAMPP Control Panel for more details"
fi 