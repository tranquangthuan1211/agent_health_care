import 'dotenv/config';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { specialties, diseases, doctors } from '../../renderUi/mockData.js';
import requestPrompt from "../promt/requestProme.js"

class HealthCareAIModel {
    constructor() {
        this.endpoint = "https://models.inference.ai.azure.com";
        this.modelName = "gpt-4o-mini"; // You can change this to other available models
        
        this.client = ModelClient(
            this.endpoint, 
            new AzureKeyCredential(process.env.GITHUB_TOKEN)
        );
        
// --------- Note: This is a simplified example. In production, you should use environment variables for sensitive data.
        this.systemPrompt = requestPrompt(specialties, diseases, doctors) 
    }
// Method to generate AI response based on user message and conversation history
    async generateResponse(userMessage, conversationHistory = []) {
        try {
            const messages = [
                { role: "system", content: this.systemPrompt }
            ];

            if (conversationHistory && conversationHistory.length > 0) {
                messages.push(...conversationHistory);
            }

            messages.push({ role: "user", content: userMessage });

            console.log('Sending request to GitHub AI model...');

            const response = await this.client.path("/chat/completions").post({
                body: {
                    messages: messages,
                    model: this.modelName,
                    temperature: 0.7,
                    max_tokens: 1000,
                    top_p: 1.0
                }
            });

            if (isUnexpected(response)) {
                throw new Error(`Model request failed: ${response.body?.error?.message || 'Unknown error'}`);
            }

            const result = response.body;
            const aiResponse = result.choices[0]?.message?.content;

            console.log('AI Response generated successfully');
            return {
                success: true,
                response: aiResponse,
                usage: result.usage
            };

        } catch (error) {
            console.error('Error generating AI response:', error);
            return {
                success: false,
                error: error.message,
                response: "I'm sorry, I'm having trouble processing your request right now. Please try again or consult with a healthcare professional for immediate assistance."
            };
        }
    }

    async processHealthQuery(query, context = {}) {
        try {
            // Add relevant medical context from knowledge base
            const medicalContext = this.formatMedicalContext(query);
            
            // Format the query for healthcare context
            const formattedQuery = `Health Query: ${query}

            ${context.symptoms ? `Symptoms mentioned: ${context.symptoms}` : ''}
            ${context.age ? `Patient age: ${context.age}` : ''}
            ${context.gender ? `Patient gender: ${context.gender}` : ''}
            ${context.medications ? `Current medications: ${context.medications}` : ''}

            ${medicalContext}

            Please provide helpful health information and guidance based on the medical knowledge base above. Always reference specific doctors, specialties, or conditions from the knowledge base when relevant.`;

            const result = await this.generateResponse(formattedQuery);
            return result;

        } catch (error) {
            console.error('Error processing health query:', error);
            return {
                success: false,
                error: error.message,
                response: "I apologize, but I'm unable to process your health query at the moment. Please consult with a healthcare professional."
            };
        }
    }

    isEmergencyQuery(query) {
        const emergencyKeywords = [
            'emergency', 'urgent', 'chest pain', 'heart attack', 'stroke',
            'bleeding', 'unconscious', 'breathing problem', 'severe pain',
            'overdose', 'poisoning', 'accident', 'trauma'
        ];

        return emergencyKeywords.some(keyword => 
            query.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    getEmergencyResponse() {
        return {
            success: true,
            response: `MEDICAL EMERGENCY DETECTED

            If this is a medical emergency, please:
            1. Call emergency services immediately (911 in US, 999 in UK, 112 in EU)
            2. Go to the nearest emergency room
            3. Contact your local emergency medical services

            Do not delay seeking immediate medical attention for emergency situations. This AI assistant cannot replace emergency medical care.

            If this is not an emergency, please rephrase your question and I'll be happy to provide general health information.`,
            isEmergency: true
        };
    }

    searchMedicalData(query) {
        const queryLower = query.toLowerCase();
    
        const relevantSpecialties = specialties.filter(specialty => 
            specialty.name.toLowerCase().includes(queryLower) || 
            queryLower.includes(specialty.name.toLowerCase())
        );

        // Search for relevant diseases
        const relevantDiseases = diseases.filter(disease => 
            disease.name.toLowerCase().includes(queryLower) || 
            queryLower.includes(disease.name.toLowerCase())
        );

        // Search for relevant doctors based on specialties found
        const relevantDoctors = doctors.filter(doctor => 
            relevantSpecialties.some(specialty => specialty.id === doctor.specialtyId) ||
            relevantDiseases.some(disease => {
                const specialty = specialties.find(s => s.id === disease.specialtyId);
                return specialty && doctor.specialtyId === specialty.id;
            })
        );

        return {
            specialties: relevantSpecialties,
            diseases: relevantDiseases,
            doctors: relevantDoctors
        };
    }

    // Method to format medical context for AI
    formatMedicalContext(query) {
        const searchResults = this.searchMedicalData(query);
        
        let contextInfo = "\n\nRELEVANT MEDICAL INFORMATION FOR THIS QUERY:\n";
        
        if (searchResults.diseases.length > 0) {
            contextInfo += "\nRelevant Conditions/Diseases:\n";
            searchResults.diseases.forEach(disease => {
                const specialty = specialties.find(s => s.id === disease.specialtyId);
                contextInfo += `- ${disease.name} (Specialty: ${specialty ? specialty.name : 'N/A'})\n`;
            });
        }

        if (searchResults.specialties.length > 0) {
            contextInfo += "\nRelevant Specialties:\n";
            searchResults.specialties.forEach(specialty => {
                contextInfo += `- ${specialty.name}\n`;
            });
        }

        if (searchResults.doctors.length > 0) {
            contextInfo += "\nRecommended Specialists:\n";
            searchResults.doctors.forEach(doctor => {
                const specialty = specialties.find(s => s.id === doctor.specialtyId);
                contextInfo += `- ${doctor.name} (${specialty ? specialty.name : 'N/A'})\n`;
            });
        }

        return contextInfo;
    }
}

export default new HealthCareAIModel();