#!/bin/bash

# Giaom Marketplace Client PM2 Start Script
# Run this script from the client directory

set -e

echo "🚀 Starting Giaom Marketplace Client with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Install dependencies if node_modules don't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Stop existing PM2 process if running
pm2 stop giaom-client 2>/dev/null || true
pm2 delete giaom-client 2>/dev/null || true

# Start client with PM2
echo "▶️  Starting client..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "✅ Client started successfully!"
echo ""
echo "📊 PM2 Status:"
pm2 status giaom-client
echo ""
echo "📝 Useful commands:"
echo "  - pm2 logs giaom-client   : View client logs"
echo "  - pm2 restart giaom-client: Restart client"
echo "  - pm2 stop giaom-client   : Stop client"
