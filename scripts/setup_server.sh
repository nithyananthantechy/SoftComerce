#!/bin/bash
# scripts/setup_server.sh
# Run this script on your Ubuntu server to install Docker and setup the firewall

set -e

echo "🚀 Starting Server Setup for Softkart & Nitehire..."

# 1. Update system packages
echo "📦 Updating packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Docker Compose
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
else
    echo "Docker is already installed."
fi

# Add current user to docker group
echo "👤 Adding user to docker group..."
sudo usermod -aG docker $USER

# 3. Setup UFW Firewall
echo "🛡️ Configuring Firewall (UFW)..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 81/tcp  # For Nginx Proxy Manager UI
sudo ufw --force enable

echo "✅ Server setup complete!"
echo "⚠️  IMPORTANT: Please log out and log back in for Docker group changes to take effect."
