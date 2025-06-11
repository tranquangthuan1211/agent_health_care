#!/bin/bash

# GitHub AI Models Setup Script
# This script helps you set up your GitHub token for AI model access

echo "🚀 GitHub AI Models Setup"
echo "========================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please make sure you're in the correct directory."
    exit 1
fi

echo "📋 Follow these steps to get your GitHub Personal Access Token:"
echo ""
echo "1. 🌐 Go to: https://github.com/settings/tokens"
echo "2. 🔘 Click 'Generate new token (classic)'"
echo "3. 📝 Give it a descriptive name like 'AI Models Access'"
echo "4. ⏰ Set expiration (recommended: 90 days or no expiration for development)"
echo "5. ✅ Check the 'models:read' scope/permission"
echo "6. 🎯 Click 'Generate token'"
echo "7. 📋 Copy the generated token (you won't see it again!)"
echo ""

# Ask user for token
echo "🔑 Please paste your GitHub Personal Access Token:"
read -s github_token

if [ -z "$github_token" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Update .env file
echo "📝 Updating .env file..."

# Create backup
cp .env .env.backup

# Update the token in .env file
if grep -q "GITHUB_TOKEN" .env; then
    # Replace existing token
    sed -i.bak "s/GITHUB_TOKEN = .*/GITHUB_TOKEN = \"$github_token\"/" .env
    echo "✅ Updated existing GITHUB_TOKEN in .env file"
else
    # Add new token
    echo "GITHUB_TOKEN = \"$github_token\"" >> .env
    echo "✅ Added GITHUB_TOKEN to .env file"
fi

# Remove backup file
rm -f .env.bak

echo ""
echo "🧪 Testing your token..."
echo ""

# Test the API
npm run test-api

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete! Your GitHub AI Models integration is ready."
    echo ""
    echo "🚀 Next steps:"
    echo "• Run 'npm start' to start the healthcare AI agent"
    echo "• Open http://localhost:3000 in your browser"
    echo "• Start chatting with your AI healthcare assistant!"
else
    echo ""
    echo "❌ Setup failed. Please check your token and try again."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "• Make sure your token has 'models:read' permission"
    echo "• Verify the token was copied correctly (no extra spaces)"
    echo "• Check if your GitHub account has access to AI models"
fi

echo ""
echo "📚 For more help, check the README.md or STARTUP_GUIDE.md files."
