#!/bin/bash
# scripts/deploy_softkart.sh
# Run this script on your Ubuntu server to deploy or update Softkart

set -e

echo "🚀 Deploying Softkart..."

# Navigate to the correct directory (assuming the repo is cloned in ~/SoftComerce)
cd ~/SoftComerce || { echo "❌ Directory ~/SoftComerce not found. Please clone the repository first."; exit 1; }

# Pull the latest changes from Git
echo "📥 Pulling latest code..."
git pull origin main

# Rebuild and restart the containers
echo "🏗️ Building and starting Docker containers..."
docker compose up -d --build

echo "✅ Softkart deployment complete!"
echo "🌐 Your apps are running. Configure domains in Nginx Proxy Manager on port 81."
