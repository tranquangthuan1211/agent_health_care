console.log('🚀 Starting Healthcare AI Server...');

import express from "express";
import { specialties, diseases, doctors } from './mockData.js';

const PORT = 3000;
const app = express();

app.use(express.json());

console.log('📊 Loaded data:');
console.log(`- ${specialties.length} specialties`);
console.log(`- ${diseases.length} diseases`);
console.log(`- ${doctors.length} doctors`);

app.get('/', (req, res) => {
    res.json({ 
        message: 'Healthcare AI Server is running!',
        data: {
            specialties: specialties.length,
            diseases: diseases.length,
            doctors: doctors.length
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/chat', (req, res) => {
    const { question } = req.body;
    
    if (!question) {
        return res.status(400).json({
            code: 400,
            message: "Missing 'question' in request body."
        });
    }

    // Simple demo response with mockData
    const matchedDiseases = diseases.filter(d =>
        question.toLowerCase().includes(d.name.toLowerCase())
    );

    const matchedSpecialties = matchedDiseases.map(d =>
        specialties.find(s => s.id === d.specialtyId)
    ).filter(s => s !== undefined);

    const suggestedDoctors = matchedSpecialties.flatMap(s =>
        doctors.filter(d => d.specialtyId === s.id)
    );

    res.json({
        code: 200,
        message: "Success",
        data: {
            question: question,
            response: `Tôi đã phân tích câu hỏi của bạn và tìm thấy ${matchedDiseases.length} bệnh liên quan, ${matchedSpecialties.length} chuyên khoa và ${suggestedDoctors.length} bác sĩ phù hợp.`,
            diseases: matchedDiseases,
            specialties: matchedSpecialties,
            doctors: suggestedDoctors,
            timestamp: new Date().toISOString()
        }
    });
});

console.log('🎯 Starting server...');

app.listen(PORT, () => {
    console.log(`Healthcare AI Server is running on http://localhost:${PORT}`);
    console.log(`API endpoint: POST http://localhost:${PORT}/api/chat`);
    console.log(`Web interface: http://localhost:${PORT}`);
});
