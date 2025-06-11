import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import express from "express";
import dotenv from 'dotenv';
import rabbitmq from "./config/rabbitMq.js"; 
const PORT = process.env.PORT || 3000;  
import path from 'path'; 
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; 
import { specialties, diseases, doctors } from './mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Mock clinics data
const clinics = [
    { id: "clinic_hcm_1", name: "Phòng khám Quốc tế Sài Gòn", address: "123 Nguyễn Huệ, Q1, TP.HCM", phone: "028-1234-5678", hours: "8:00-17:00" },
    { id: "clinic_hn_1", name: "Bệnh viện Đa khoa Trung ương Hà Nội", address: "456 Lê Duẩn, Hai Bà Trưng, Hà Nội", phone: "024-8765-4321", hours: "7:00-18:00" }
];

const token = process.env.OPENAI_API_KEY; 
const endpoint = process.env.OPENAI_API_ENDPOINT; 
const model = process.env.OPENAI_CHAT_MODEL || "openai/gpt-4.1";
// ---------------------------------------------------------------------------------
const availableFunctions = [
    {
        "name": "search_doctors",
        "description": "Tìm kiếm bác sĩ chuyên khoa theo địa điểm. Sử dụng chức năng này khi người dùng muốn tìm bác sĩ hoặc chuyên gia y tế cho một vấn đề sức khỏe cụ thể hoặc theo chuyên khoa/địa điểm.",
        "parameters": {
            "type": "object",
            "properties": {
                "specialty": {
                    "type": "string",
                    "description": "Chuyên khoa y tế cần tìm (ví dụ: Tiêu hóa, Tim mạch, Da Liễu, Thần kinh, Nhi). Bắt buộc."
                },
                "location": {
                    "type": "string",
                    "description": "Địa điểm hoặc khu vực cần tìm bác sĩ (ví dụ: Hà Nội, TP.HCM, Quận 1). Không bắt buộc."
                }
            },
            "required": ["specialty"]
        }
    },
     {
        "name": "get_disease_info",
        "description": "Cung cấp thông tin chung về một bệnh lý hoặc triệu chứng cụ thể. Sử dụng chức năng này khi người dùng hỏi về một loại bệnh, triệu chứng, nguyên nhân, cách phòng ngừa hoặc cách điều trị chung (không phải lời khuyên y tế cá nhân).",
         "parameters": {
            "type": "object",
            "properties": {
                "diseaseName": {
                    "type": "string",
                    "description": "Tên bệnh lý hoặc triệu chứng mà người dùng quan tâm. Bắt buộc."
                }
            },
             "required": ["diseaseName"]
        }
    },
    {
        "name": "book_appointment",
        "description": "Hỗ trợ người dùng đặt lịch khám với bác sĩ cụ thể vào ngày giờ nhất định. Sử dụng chức năng này khi người dùng thể hiện ý muốn đặt lịch hẹn.",
         "parameters": {
            "type": "object",
            "properties": {
                "doctorIdentifier": { // Có thể là ID hoặc tên bác sĩ. LLM cần trích xuất.
                    "type": "string",
                    "description": "ID hoặc tên của bác sĩ mà người dùng muốn đặt lịch. Bắt buộc."
                },
                "date": {
                    "type": "string",
                    "description": "Ngày đặt lịch theo định dạng YYYY-MM-DD. Bắt buộc."
                },
                "time": {
                    "type": "string",
                    "description": "Giờ đặt lịch theo định dạng HH:MM. Bắt buộc."
                },
                "patientName": { // Tên người bệnh. Có thể lấy từ thông tin user hoặc hỏi.
                    "type": "string",
                    "description": "Tên của bệnh nhân đặt lịch. Bắt buộc."
                },
                 "patientPhone": { // Số điện thoại người bệnh. Có thể lấy từ thông tin user hoặc hỏi.
                    "type": "string",
                    "description": "Số điện thoại liên hệ của bệnh nhân. Bắt buộc."
                },
                "notes": {
                    "type": "string",
                    "description": "Lý do khám hoặc ghi chú thêm. Không bắt buộc."
                }
            },
            "required": ["doctorIdentifier", "date", "time", "patientName", "patientPhone"]
        }
    },
     {
        "name": "get_user_appointments",
        "description": "Lấy danh sách các lịch khám sắp tới của người dùng hiện tại. Sử dụng chức năng này khi người dùng muốn xem lại lịch hẹn đã đặt hoặc hỏi về các cuộc hẹn của mình.",
         "parameters": {
            "type": "object",
            "properties": {
                "userId": { // Trong ứng dụng thật, bạn sẽ lấy cái này từ context xác thực
                    "type": "string",
                    "description": "ID duy nhất của người dùng đang trò chuyện. Bắt buộc."
                }
            },
             "required": ["userId"]
        }
    },
     {
        "name": "get_clinic_details",
        "description": "Lấy thông tin chi tiết về một phòng khám hoặc bệnh viện, bao gồm địa chỉ, số điện thoại, giờ làm việc, v.v. Sử dụng chức năng này khi người dùng hỏi về thông tin của một địa điểm khám bệnh cụ thể.",
         "parameters": {
            "type": "object",
            "properties": {
                "clinicIdentifier": { // Có thể là ID hoặc tên
                    "type": "string",
                    "description": "ID hoặc tên của phòng khám hoặc bệnh viện cần tìm thông tin. Bắt buộc."
                }
            },
             "required": ["clinicIdentifier"]
        }
    }
];
async function callBackendApi(functionName, functionArgs) {
    console.log(`--- Đang giả lập gọi API backend: ${functionName} với args: ${JSON.stringify(functionArgs)} ---`);

    // --- Giả lập dữ liệu trả về (Chỉ dùng cho mục đích demo) ---
    await new Promise(resolve => setTimeout(resolve, 500)); // Giả lập độ trễ mạng

    try {
        if (functionName === 'search_doctors') {
             const specialty = functionArgs.specialty;
             const location = functionArgs.location || '';
             const matchedSpec = specialties.find(s => specialty.toLowerCase().includes(s.name.toLowerCase()));

            if (!matchedSpec) {
                return { success: false, message: `Không tìm thấy chuyên khoa "${specialty}". Vui lòng thử lại với chuyên khoa khác.`, data: null };
            }

             let foundDocs = doctors.filter(d => d.specialtyId === matchedSpec.id);

             if(location) {
                 // Lọc giả lập theo location
                  foundDocs = foundDocs.filter(doc =>
                     doc.location && doc.location.toLowerCase().includes(location.toLowerCase())
                   );
             }

             if (foundDocs.length > 0) {
                 return {
                     success: true,
                     message: `Đã tìm thấy ${foundDocs.length} bác sĩ chuyên khoa ${matchedSpec.name} ${location ? 'tại ' + location : ''}:`,
                     data: foundDocs.map(doc => ({
                          id: doc.id,
                          name: doc.name,
                          specialty: specialties.find(s => s.id === doc.specialtyId)?.name || 'Không rõ chuyên khoa',
                          clinicId: doc.clinicId // Trả về clinicId để có thể hỏi tiếp thông tin phòng khám
                     })),
                 };
             } else {
                  return {
                      success: true, // Thành công trong việc tìm kiếm, nhưng không có kết quả
                      message: `Không tìm thấy bác sĩ chuyên khoa ${matchedSpec.name} ${location ? 'tại ' + location : ''} trong hệ thống.`,
                      data: [],
                  };
             }

        } else if (functionName === 'get_disease_info') {
             const diseaseName = functionArgs.diseaseName;
             // Tìm bệnh trong dummy data để lấy specialtyId liên quan
             const matchedDisease = diseases.find(d => diseaseName.toLowerCase().includes(d.name.toLowerCase()));
             let specialtyInfo = '';
             if(matchedDisease) {
                 const spec = specialties.find(s => s.id === matchedDisease.specialtyId);
                 if(spec) specialtyInfo = ` Chuyên khoa liên quan thường là ${spec.name}.`;
             }

             let info = `Thông tin chung về "${diseaseName}": Đây là một vấn đề sức khỏe phổ biến.`;
             // Thêm thông tin giả lập chi tiết hơn dựa trên tên bệnh
             if (diseaseName.toLowerCase().includes('đau dạ dày') || diseaseName.toLowerCase().includes('viêm loét dạ dày')) {
                  info += ` Đau dạ dày (hay viêm loét dạ dày - tá tràng) thường do vi khuẩn HP, stress, thói quen ăn uống không lành mạnh hoặc sử dụng thuốc giảm đau. Triệu chứng thường gặp là đau vùng thượng vị, ợ hơi, ợ chua, buồn nôn.${specialtyInfo}`;
             } else if (diseaseName.toLowerCase().includes('đau đầu')) {
                  info += ` Đau đầu có nhiều nguyên nhân, từ căng thẳng, thiếu ngủ đến các vấn đề sức khỏe nghiêm trọng hơn. Các loại đau đầu phổ biến bao gồm đau đầu do căng thẳng, đau nửa đầu (migraine), đau đầu cụm.${specialtyInfo}`;
             } else {
                 info += `${specialtyInfo}`;
             }

             info += ` Thông tin này chỉ mang tính tham khảo và không thay thế lời khuyên y tế chuyên nghiệp. Bạn nên tham khảo ý kiến bác sĩ để được chẩn đoán và tư vấn cụ thể cho tình trạng của mình.`;

            return { success: true, data: { name: diseaseName, info: info }, message: info };

        } else if (functionName === 'book_appointment') {
             // Giả lập đặt lịch thành công
             const { doctorIdentifier, date, time, patientName, patientPhone, notes } = functionArgs;
             // Trong thực tế, bạn cần check doctorIdentifier có tồn tại không, giờ đó có trống không, v.v.
             // Giả lập tìm bác sĩ theo ID hoặc tên
             const doctor = doctors.find(d =>
                 d.id == doctorIdentifier || // So sánh ID (có thể là number)
                 d.name.toLowerCase().includes(doctorIdentifier.toLowerCase()) // So sánh tên
             );

             if (!doctor) {
                  return { success: false, message: `Không tìm thấy thông tin bác sĩ bạn yêu cầu ("${doctorIdentifier}"). Vui lòng kiểm tra lại tên hoặc mã bác sĩ.`, data: null };
             }
             if (!date || !time || !patientName || !patientPhone) {
                  return { success: false, message: `Thiếu thông tin cần thiết để đặt lịch (ngày, giờ, tên bệnh nhân, số điện thoại). Vui lòng cung cấp đủ.`, data: null };
             }

             // Giả lập lưu vào DB và trả về bookingId
             const bookingId = `BOOK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
             console.log(`Giả lập đặt lịch thành công: ${bookingId} cho ${patientName} (${patientPhone}) với BS. ${doctor.name} vào ${date} lúc ${time}. Ghi chú: ${notes || 'Không có'}`);

             return {
                 success: true,
                 message: `Chúc mừng ${patientName}, bạn đã đặt lịch khám thành công với Bác sĩ ${doctor.name} vào ngày ${date} lúc ${time}. Mã đặt lịch của bạn là ${bookingId}. Vui lòng có mặt trước giờ hẹn 15 phút.`,
                 data: { // Trả về dữ liệu chi tiết để LLM có thể tóm tắt
                     bookingId: bookingId,
                     doctorId: doctor.id,
                     doctorName: doctor.name,
                     date: date,
                     time: time,
                     patientName: patientName,
                     clinicId: doctor.clinicId // Có thể trả về clinicId để gợi ý xem thông tin phòng khám
                 }
             };

        } else if (functionName === 'get_user_appointments') {
            // Giả lập trả về lịch hẹn của người dùng (cần userId thực tế)
             const userId = functionArgs.userId || 'demo_user_123'; // Dùng ID giả lập nếu không có
            console.log(`Giả lập lấy lịch hẹn cho người dùng: ${userId}`);
             // Giả lập dữ liệu lịch hẹn (lý tưởng là lọc theo userId)
            const dummyAppointments = [
                { id: "app1", doctorName: "BS. Nguyễn Văn A", specialty: "Nội Tổng quát", date: "2023-10-27", time: "10:00", clinicName: "Phòng khám Quốc tế Sài Gòn", clinicId: "clinic_hcm_1" },
                { id: "app2", doctorName: "BS. Phạm Thị D", specialty: "Khoa Thần kinh", date: "2023-11-10", time: "14:30", clinicName: "Bệnh viện Đa khoa Trung ương Hà Nội", clinicId: "clinic_hn_1" }
            ];
            if (dummyAppointments.length > 0) {
                return { success: true, message: "Đây là các lịch hẹn sắp tới của bạn:", data: dummyAppointments };
            } else {
                return { success: true, message: "Bạn hiện không có lịch hẹn nào sắp tới.", data: [] };
            }

        } else if (functionName === 'get_clinic_details') {
            // Giả lập trả về thông tin phòng khám (cần clinicIdentifier thực tế)
             const clinicIdentifier = functionArgs.clinicIdentifier;
             console.log(`Giả lập lấy thông tin phòng khám: ${clinicIdentifier}`);
             // Tìm phòng khám dựa trên ID hoặc tên gần đúng trong data giả
             const foundClinic = clinics.find(c =>
                c.id === clinicIdentifier ||
                c.name.toLowerCase().includes(clinicIdentifier.toLowerCase())
             );

            if (foundClinic) {
                return {
                    success: true,
                    message: `Thông tin về ${foundClinic.name}:`,
                    data: { // Trả về chi tiết phòng khám
                        id: foundClinic.id,
                        name: foundClinic.name,
                        address: foundClinic.address,
                        phone: foundClinic.phone,
                        hours: foundClinic.hours,
                        lat: foundClinic.lat,
                        lng: foundClinic.lng,
                    }
                };
            } else {
                return { success: false, message: `Không tìm thấy thông tin phòng khám hoặc bệnh viện với tên/mã "${clinicIdentifier}".`, data: null };
            }
        }

        // Mặc định nếu không tìm thấy function (LLM yêu cầu gọi hàm không tồn tại trong backend của bạn)
        console.warn(`[callBackendApi] Chức năng không được xử lý: ${functionName}`);
        return { success: false, message: `Hệ thống backend không hỗ trợ chức năng "${functionName}".`, data: null };

    } catch (error) {
         console.error(`[callBackendApi] Lỗi khi xử lý hàm giả lập ${functionName}:`, error);
         // Quan trọng: Khi có lỗi trong backend API thật, bạn nên trả về cấu trúc lỗi phù hợp
         return { success: false, message: `Đã xảy ra lỗi khi xử lý yêu cầu của bạn trong hệ thống backend. Chi tiết: ${error.message}`, data: null };
    }
}
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
    // Mock chat history for demo
    const mockChatHistory = [
        { id: 1, message: "Chào bạn! Tôi có thể giúp gì cho bạn?", sender: "bot", timestamp: new Date() },
        { id: 2, message: "Xin chào, tôi muốn tìm bác sĩ chuyên khoa tim mạch", sender: "user", timestamp: new Date() }
    ];
    res.render('index', { chatHistory: mockChatHistory });
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
            3. Một danh sách từ 2 đến 4 câu gợi ý tiếp theo để người dùng nhấn vào đó tiếp tục tương tác với hệ thống.

        Quy tắc:
        - KHÔNG trả về HTML.
        - KHÔNG giải thích.

        Định dạng trả về:
        - data: trả về dữ liệu JSON từ database.
        - Gợi ý: Danh sách các câu hỏi gợi ý tiếp theo để người dùng nhấn vào đó tiếp tục tương tác với hệ thống.
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
            ],
        }

        Gợi ý:
        - "triệu chứng đau đầu?"
        - "đặt lịch khám với bác sĩ?"
        - "danh sách bác sĩ gần khu vực của tôi?"

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
            temperature: 1.0,
            top_p: 1.0,
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
        
        // For now, return the advice directly. You can parse and structure it later
        const mockData = {
            response: advice,
            doctors: suggestedDoctors,
            diseases: matchedDiseases,
            specialties: matchedSpecialties
        };
        
        res.status(200).json({
            code: 200,
            message: "Success",
            data: mockData,
            // suggestions: suggestions
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
        // Temporarily disabled for testing
        // await rabbitmq.publish('email.send', { to, subject, body });
        res.json({ message: 'Email functionality temporarily disabled for testing' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to publish message' });
    }
});
const startServer = async () => {
    try {
        // Temporarily disable RabbitMQ connection for testing
        // await rabbitmq.connect(); // kết nối RabbitMQ
        console.log('RabbitMQ connection disabled for testing');
        
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();