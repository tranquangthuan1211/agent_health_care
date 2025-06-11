#!/usr/bin/env node

/**
 * Test script for Healthcare AI Agent
 * This script demonstrates the AI model functionality without requiring RabbitMQ
 */

import 'dotenv/config';
import healthCareAI from './config/llm-model.js';

console.log('Healthcare AI Agent Test');
console.log('================================\n');

// Test cases
const testCases = [
    {
        name: "General Health Query",
        message: "What are some tips for maintaining good heart health?",
        context: {}
    },
    {
        name: "Emergency Detection Test",
        message: "I'm having severe chest pain and trouble breathing",
        context: {}
    },
    {
        name: "Wellness Question",
        message: "How much water should I drink daily?",
        context: { age: "30", gender: "female" }
    }
];

async function runTests() {
    // Check environment setup
    if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN === 'your_github_token_here') {
        console.log('ERROR: GITHUB_TOKEN not configured properly');
        console.log('Please update your .env file with a valid GitHub Personal Access Token');
        console.log('Visit: https://github.com/settings/tokens to create one with models:read permission\n');
        return;
    }

    console.log('Environment configured');
    console.log('Testing GitHub AI Model Integration...\n');

    for (const testCase of testCases) {
        console.log(`Test: ${testCase.name}`);
        console.log(`Query: "${testCase.message}"`);
        
        try {
            // Test emergency detection first
            if (healthCareAI.isEmergencyQuery(testCase.message)) {
                console.log('Emergency detected!');
                const emergencyResponse = healthCareAI.getEmergencyResponse();
                console.log('Response:', emergencyResponse.response.substring(0, 200) + '...');
            } else {
                console.log('Processing with AI model...');
                const result = await healthCareAI.processHealthQuery(testCase.message, testCase.context);
                
                if (result.success) {
                    console.log('Success!');
                    console.log('Response:', result.response.substring(0, 300) + '...');
                    if (result.usage) {
                        console.log('Token Usage:', result.usage);
                    }
                } else {
                    console.log('Failed:', result.error);
                    console.log('Fallback Response:', result.response);
                }
            }
        } catch (error) {
            console.log('Test failed:', error.message);
        }
        
        console.log('\n' + '─'.repeat(60) + '\n');
    }

    console.log('Test completed!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Open browser: http://localhost:3000');
    console.log('3. Test the chat interface');
}

// Run tests
runTests().catch(console.error);
