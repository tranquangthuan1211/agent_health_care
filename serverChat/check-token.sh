#!/bin/bash

# GitHub Token Permission Checker
echo "🔍 Checking GitHub Token Permissions..."
echo "======================================"
echo ""

# Read token from .env
GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d'"' -f2)

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No GitHub token found in .env file"
    exit 1
fi

echo "📋 Token found: ${GITHUB_TOKEN:0:20}..."
echo ""

# Check token permissions using GitHub API
echo "🔍 Checking token scopes..."
RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
               -H "Accept: application/vnd.github.v3+json" \
               -I https://api.github.com/user)

if echo "$RESPONSE" | grep -q "200 OK"; then
    echo "✅ Token is valid"
    
    # Extract scopes from headers
    SCOPES=$(echo "$RESPONSE" | grep -i "x-oauth-scopes:" | cut -d' ' -f2- | tr -d '\r\n')
    
    if [ -n "$SCOPES" ]; then
        echo "📝 Current scopes: $SCOPES"
        
        if echo "$SCOPES" | grep -q "models"; then
            echo "✅ 'models' scope found"
        else
            echo "❌ 'models' scope missing!"
            echo ""
            echo "🛠️  To fix this:"
            echo "1. Go to: https://github.com/settings/tokens"
            echo "2. Find your token and click 'Edit'"
            echo "3. Check the 'models:read' permission"
            echo "4. Click 'Update token'"
            echo "5. Re-run this script to verify"
        fi
    else
        echo "⚠️  Could not determine scopes"
    fi
else
    echo "❌ Token validation failed"
    echo "Response: $RESPONSE"
    echo ""
    echo "🛠️  Possible issues:"
    echo "• Token is invalid or expired"
    echo "• Token was copied incorrectly"
    echo "• Token doesn't have basic read permissions"
fi

echo ""
echo "🔗 GitHub Token Settings: https://github.com/settings/tokens"
