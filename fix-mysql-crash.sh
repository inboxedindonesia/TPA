#!/bin/bash

echo "🔧 Fixing MySQL crash di XAMPP macOS..."

# Check if XAMPP is installed
if [ ! -d "/Applications/XAMPP" ]; then
    echo "❌ XAMPP tidak ditemukan di /Applications/XAMPP"
    exit 1
fi

echo "🛑 Stopping all MySQL processes..."
sudo pkill -f mysql
sudo pkill -f mysqld

# Wait for processes to stop
sleep 2

echo "📁 Cleaning MySQL data directory..."
sudo rm -rf /Applications/XAMPP/xamppfiles/var/mysql/*
sudo rm -rf /Applications/XAMPP/xamppfiles/var/mysql/.*

echo "🔐 Fixing permissions..."
sudo chown -R daemon:daemon /Applications/XAMPP/xamppfiles/var/mysql
sudo chmod -R 755 /Applications/XAMPP/xamppfiles/var/mysql
sudo chmod -R 755 /Applications/XAMPP/xamppfiles

echo "🚀 Initializing MySQL database..."
sudo /Applications/XAMPP/xamppfiles/bin/mysql_install_db --user=daemon --basedir=/Applications/XAMPP/xamppfiles --datadir=/Applications/XAMPP/xamppfiles/var/mysql

echo "🔧 Creating MySQL configuration..."
sudo tee /Applications/XAMPP/xamppfiles/etc/my.cnf > /dev/null <<EOF
[mysqld]
user = daemon
port = 3306
socket = /Applications/XAMPP/xamppfiles/var/mysql/mysql.sock
pid-file = /Applications/XAMPP/xamppfiles/var/mysql/mysql.pid
datadir = /Applications/XAMPP/xamppfiles/var/mysql
log-error = /Applications/XAMPP/xamppfiles/var/mysql/mysql_error.log

[mysql]
socket = /Applications/XAMPP/xamppfiles/var/mysql/mysql.sock

[client]
socket = /Applications/XAMPP/xamppfiles/var/mysql/mysql.sock
EOF

echo "🚀 Starting MySQL..."
sudo /Applications/XAMPP/xamppfiles/bin/mysql.server start

# Wait for MySQL to start
sleep 5

echo "🧪 Testing MySQL connection..."
if /Applications/XAMPP/xamppfiles/bin/mysql -u root -e "SELECT 1;" 2>/dev/null; then
    echo "✅ MySQL is running successfully!"
    echo ""
    echo "📊 MySQL Info:"
    echo "   Status: Running"
    echo "   Port: 3306"
    echo "   Socket: /Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"
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
    echo ""
    echo "🔍 Checking error log..."
    if [ -f "/Applications/XAMPP/xamppfiles/var/mysql/mysql_error.log" ]; then
        echo "📋 Last 10 lines of error log:"
        tail -10 /Applications/XAMPP/xamppfiles/var/mysql/mysql_error.log
    fi
    echo ""
    echo "💡 Try these solutions:"
    echo "   1. Restart your Mac"
    echo "   2. Reinstall XAMPP"
    echo "   3. Use Homebrew MySQL instead"
fi 