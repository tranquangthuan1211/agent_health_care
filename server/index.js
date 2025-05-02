import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import express from "express";
import dotenv from 'dotenv';
import rabbitmq from "./config/rabbitMq.js"; 
const PORT = process.env.PORT || 3000;  
import path from 'path'; 
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const specialties = [
    { id: 1, name: "Khoa Nội Tổng quát" },
    { id: 2, name: "Khoa Tim mạch" },
    { id: 3, name: "Khoa Da liễu" },
    { id: 4, name: "Khoa Thần kinh" },
];

const diseases = [
    { id: 101, name: "Cảm cúm", specialtyId: 1 },
    { id: 102, name: "Đau đầu", specialtyId: 4 },
    { id: 103, name: "Cao huyết áp", specialtyId: 2 },
    { id: 104, name: "Mụn trứng cá", specialtyId: 3 },
    { id: 105, name: "Tiểu đường", specialtyId: 1 },
     { id: 106, name: "Đột quỵ", specialtyId: 4 },
    // Thêm các bệnh khác
];

const doctors = [
    { id: 1001, name: "BS. Nguyễn Văn A", specialtyId: 1 },
    { id: 1002, name: "BS. Trần Thị B", specialtyId: 2 },
    { id: 1003, name: "BS. Lê Văn C", specialtyId: 3 },
    { id: 1004, name: "BS. Phạm Thị D", specialtyId: 4 },
    { id: 1005, name: "BS. Hoàng Văn E", specialtyId: 1 },
     { id: 1006, name: "BS. Phan Thị F", specialtyId: 4 },
];

const token = process.env.OPENAI_API_KEY; 
const endpoint = process.env.OPENAI_API_ENDPOINT; 
const model = process.env.OPENAI_CHAT_MODEL || "openai/gpt-4o-mini";

if (!token || !endpoint) {
    console.error("Lỗi: Thiếu biến môi trường OPENAI_API_KEY hoặc OPENAI_API_ENDPOINT.");
    process.exit(1);
}

const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.get('/', async (req, res) => {
    const response = await fetch(`http://localhost:8080/api/v1/chat-history/26c09d76-291c-4003-ac03-45589c66c0d4`);
    const chatHistory = await response.json();
    console.log(chatHistory.data);
    res.render('index', { chatHistory: chatHistory.data });
  });
app.post('/api/chat', async (req, res) => {
    // Chú ý: Frontend nên gửi câu hỏi dưới dạng { "question": "Người dùng hỏi gì?" }
    const userQuestion = req.body.question;

    if (!userQuestion) {
        return res.status(400).json({
            code: 400,
            message: "Thiếu 'question' trong request body."
        });
    }

    console.log("User Question:", userQuestion);

    try {
        const matchedDiseases = diseases.filter(d =>
            userQuestion.toLowerCase().includes(d.name.toLowerCase())
        );

        const matchedSpecialties = matchedDiseases.map(d =>
            specialties.find(s => s.id === d.specialtyId)
        ).filter(s => s !== undefined);

        const suggestedDoctors = matchedSpecialties.flatMap(s =>
            doctors.filter(d => d.specialtyId === s.id)
        );

        let context = "";

        if (matchedDiseases.length > 0) {
            context += `Người dùng có thể đang quan tâm đến các vấn đề sức khỏe sau (dựa trên phân tích sơ bộ): ${matchedDiseases.map(d => d.name).join(", ")}.`;
            context += `\nCác chuyên khoa liên quan: ${matchedSpecialties.map(s => s.name).join(", ")}.`;
            if (suggestedDoctors.length > 0) {
                context += `\nCác bác sĩ có thể phù hợp với các chuyên khoa này:\n`;
                suggestedDoctors.forEach(doc => {
                    const spec = specialties.find(s => s.id === doc.specialtyId);
                    context += `- ${doc.name} (${spec ? spec.name : 'Chuyên khoa không xác định'})\n`;
                });
            } else {
                 context += `\nKhông tìm thấy bác sĩ phù hợp trong dữ liệu cho các chuyên khoa này.`;
            }
        } else {
            context += "Hệ thống không tìm thấy bệnh hoặc triệu chứng cụ thể nào trong câu hỏi của người dùng dựa trên dữ liệu có sẵn.";
        }

        const systemMessage = `
        Bạn là một trợ lý y tế ảo thân thiện.

        Nhiệm vụ của bạn:
        - Khi người dùng cung cấp thông tin liên quan đến bệnh, triệu chứng, bác sĩ, chuyên khoa hoặc lịch khám:
            - Nếu người dùng hỏi về bệnh, triệu chứng → trả về route: \`/disease\`
            - Nếu người dùng hỏi về bác sĩ, chuyên khoa → trả về route: \`/doctor\`
            - Nếu người dùng muốn đặt lịch khám, xem lịch khám → trả về route: \`/booking\`

        - Sau đó, TRẢ VỀ:
            1. dữ liệu query từ database (nếu có) dưới dạng JSON.
            3. Một danh sách từ 2 đến 4 câu gợi ý tiếp theo giúp người dùng hỏi thêm.

        Quy tắc:
        - KHÔNG trả về HTML.
        - KHÔNG giải thích.

        Định dạng trả về:
        - data: JSON (dữ liệu query từ database)
        - Gợi ý:
        - "..."
        - "..."
        - "..."

        Ví dụ:

        Nếu người dùng nói: "Tôi bị đau đầu, cho tôi danh sách bác sĩ"

        Trả về:

        data: {
            "doctors": [
                { "name": "BS. Lê Văn C", "specialty": "Khoa Thần kinh" },
                { "name": "BS. Phạm Thị D", "specialty": "Khoa Thần kinh" }
            ]
        }

        Gợi ý:
        - "Bạn có muốn xem lịch khám của bác sĩ không?"
        - "Bạn có muốn đặt lịch khám ngay không?"
        - "Bạn có muốn xem các bác sĩ gần vị trí của bạn không?"

        ---
        Nếu đã rõ, hãy chỉ tập trung thực hiện đúng theo hướng dẫn trên mỗi khi có yêu cầu từ người dùng.
        `;

        const prompt = `
            Câu hỏi của người dùng: "${userQuestion}"

            Thông tin hệ thống cung cấp:
            ${context}

            Hãy trả lời câu hỏi của người dùng dựa trên thông tin hệ thống.
        `;

        const messagesForLLM = [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
        ];

        const response = await client.path("/chat/completions").post({
            body: {
                messages: messagesForLLM,
                temperature: 0.7, 
                top_p: 1,
                model: model
            }
        });

        if (isUnexpected(response)) {
            console.error("LLM API Error:", response.body);
            // Cố gắng lấy thông báo lỗi từ body nếu có
            const errorMessage = response.body && typeof response.body === 'object' && 'error' in response.body && typeof response.body.error === 'string'
                               ? response.body.error
                               : JSON.stringify(response.body);
            throw new Error(`Unexpected response from LLM API: ${response.status} - ${errorMessage}`);
        }

        const advice = response.body.choices[0].message.content;

        res.status(200).json({
            code: 200,
            message: "Success",
            answer: advice 
        });

    } catch (err) {
        console.error("Error processing chat request:", err);
        res.status(500).json({
            code: 500,
            message: "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
            error: err.message || "Internal Server Error"
        });
    }
});
app.post('/send-email', async (req, res) => {
    const { to, subject, body } = req.body;

    try {
        await rabbitmq.publish('email.send', { to, subject, body });
        res.json({ message: 'Email task published to RabbitMQ' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to publish message' });
    }
});
const startServer = async () => {
    try {
        await rabbitmq.connect(); // kết nối RabbitMQ
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();