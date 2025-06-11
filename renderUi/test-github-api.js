/**
 * GitHub AI Models API Test
 * This script tests your GitHub token and API connectivity
 * Based on the official GitHub AI documentation
 */

import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import 'dotenv/config';

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const model = "gpt-4o-mini";

export async function testGitHubAPI() {
    console.log('Testing GitHub AI Models API...');
    console.log('================================\n');

    // Check if token is configured
    if (!token || token === 'your_github_token_here') {
        console.log('ERROR: GITHUB_TOKEN not configured!');
        console.log('\nTo set up your GitHub token:');
        console.log('1. Go to: https://github.com/settings/tokens');
        console.log('2. Click "Generate new token (classic)"');
        console.log('3. Select "models:read" permission');
        console.log('4. Copy the token and update your .env file');
        console.log('\nIn your terminal, run:');
        console.log('export GITHUB_TOKEN="your_actual_token_here"');
        console.log('\nOr update the .env file with:');
        console.log('GITHUB_TOKEN=your_actual_token_here');
        return false;
    }

    console.log('GitHub token found');
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Model: ${model}\n`);

    try {
        const client = ModelClient(
            endpoint,
            new AzureKeyCredential(token),
        );

        console.log('Sending test request...');

        const response = await client.path("/chat/completions").post({
            body: {
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: "What is the capital of France? Please respond in one sentence." }
                ],
                temperature: 1.0,
                top_p: 1.0,
                model: model
            }
        });

        if (isUnexpected(response)) {
            throw new Error(`API Error: ${response.body?.error?.message || 'Unknown error'}`);
        }

        console.log('API Request Successful!');
        console.log('Response:', response.body.choices[0].message.content);
        console.log('Usage:', response.body.usage);
        console.log('\nYour GitHub AI Models integration is working perfectly!');
        
        return true;

    } catch (error) {
        console.log('API Test Failed:', error.message);
        
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
            console.log('\nTroubleshooting:');
            console.log('• Check that your GitHub token has "models:read" permission');
            console.log('• Verify the token is not expired');
            console.log('• Make sure the token is correctly set in environment variables');
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
            console.log('\nRate limit reached. Please try again later.');
        } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
            console.log('\nNetwork issue. Check your internet connection.');
        }
        
        return false;
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testGitHubAPI()
        .then(success => {
            if (success) {
                console.log('\nReady to start your healthcare AI agent!');
                console.log('Run: npm start');
            } else {
                console.log('\nPlease fix the configuration and try again.');
            }
        })
        .catch(error => {
            console.error('\nUnexpected error:', error);
        });
}
