import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import express from "express";
import dotenv from 'dotenv';
import rabbitmq from "./config/rabbitMq.js";
const PORT = process.env.PORT || 3000;
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Cần cho route '/' nếu bạn dùng fetch tới 8080

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// --- Dummy Data (Được dùng trong hàm giả lập gọi backend - callBackendApi) ---
// Bổ sung thêm dữ liệu cần thiết cho Function Calling
const specialties = [
    { id: 1, name: "Khoa Nội Tổng quát" },
    { id: 2, name: "Khoa Tim mạch" },
    { id: 3, name: "Khoa Da liễu" },
    { id: 4, name: "Khoa Thần kinh" },
    { id: 5, name: "Khoa Nhi" },
    { id: 6, name: "Nội Tiêu hóa" }, // Thêm Nội Tiêu hóa
    // Thêm các chuyên khoa khác nếu cần cho data bác sĩ thật
];

const diseases = [
    { id: 101, name: "Cảm cúm", specialtyId: 1 },
    { id: 102, name: "Đau đầu", specialtyId: 4 },
    { id: 103, name: "Cao huyết áp", specialtyId: 2 },
    { id: 104, name: "Mụn trứng cá", specialtyId: 3 },
    { id: 105, name: "Tiểu đường", specialtyId: 1 },
    { id: 106, name: "Đột quỵ", specialtyId: 4 },
    { id: 107, name: "Đau dạ dày", specialtyId: 6 }, // Kết nối với Nội Tiêu hóa
    { id: 108, name: "Viêm loét dạ dày tá tràng", specialtyId: 6 }, // Kết nối với Nội Tiêu hóa
    // Thêm các bệnh khác
];

const doctors = [
    { id: 1001, name: "BS. Nguyễn Văn A", specialtyId: 1, clinicId: "clinic_hcm_1", location: "TP.HCM" },
    { id: 1002, name: "BS. Trần Thị B", specialtyId: 2, clinicId: "clinic_hn_1", location: "Hà Nội" },
    { id: 1003, name: "BS. Lê Văn C", specialtyId: 3, clinicId: "clinic_dn_1", location: "Đà Nẵng" },
    { id: 1004, name: "BS. Phạm Thị D", specialtyId: 4, clinicId: "clinic_hn_1", location: "Hà Nội" },
    { id: 1005, name: "BS. Hoàng Văn E", specialtyId: 1, clinicId: "clinic_hcm_1", location: "TP.HCM" },
    { id: 1006, name: "BS. Phan Thị F", specialtyId: 4, clinicId: "clinic_dn_1", location: "Đà Nẵng" },
     { id: 1007, name: "BS. Bùi Văn G", specialtyId: 6, clinicId: "clinic_hcm_1", location: "TP.HCM" }, // Bác sĩ tiêu hóa
    { id: 1008, name: "BS. Đỗ Thị H", specialtyId: 6, clinicId: "clinic_hn_1", location: "Hà Nội" }, // Bác sĩ tiêu hóa
];

const clinics = [
    { id: "clinic_hcm_1", name: "Phòng khám Quốc tế Sài Gòn", address: "123 Nguyễn Văn Cừ, Quận 1, TP.HCM", phone: "028 1234 5678", hours: "Thứ 2 - Thứ 6: 7h30 - 17h00", lat: 10.77, lng: 106.69 },
    { id: "clinic_hn_1", name: "Bệnh viện Đa khoa Trung ương Hà Nội", address: "45 Trần Hưng Đạo, Quận Hoàn Kiếm, Hà Nội", phone: "024 9876 5432", hours: "Thứ 2 - Thứ 7: 7h00 - 16h30", lat: 21.02, lng: 105.85 },
    { id: "clinic_dn_1", name: "Phòng khám Gia đình Đà Nẵng", address: "67 Lê Lợi, Quận Hải Châu, Đà Nẵng", phone: "0236 1122 3344", hours: "Thứ 2 - Chủ nhật: 8h00 - 20h00", lat: 16.07, lng: 108.22},
];
// --- End Dummy Data ---


// --- Cấu hình Azure OpenAI ---
// Đảm bảo các biến môi trường này được thiết lập đúng trong file .env của bạn
const azureApiKey = process.env.OPENAI_API_KEY;
const azureEndpoint = process.env.OPENAI_API_ENDPOINT;
const azureDeploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini-deployment"; // Thay bằng tên deployment của bạn

if (!azureApiKey || !azureEndpoint || !azureDeploymentName) {
    console.error("Lỗi: Thiếu biến môi trường AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_ENDPOINT, hoặc AZURE_OPENAI_DEPLOYMENT_NAME.");
    console.error(`Kiểm tra các biến:
    AZURE_OPENAI_API_KEY=${azureApiKey ? '****' : 'UNDEFINED'}
    AZURE_OPENAI_API_ENDPOINT=${azureEndpoint ? azureEndpoint : 'UNDEFINED'}
    AZURE_OPENAI_DEPLOYMENT_NAME=${azureDeploymentName ? azureDeploymentName : 'UNDEFINED'}
    `);
    process.exit(1);
}

// Sử dụng AzureKeyCredential với API Key
const client = ModelClient(
    azureEndpoint,
    new AzureKeyCredential(azureApiKey),
);

// --- API Function Definitions cho LLM ---
// Định nghĩa các "công cụ" mà chatbot có thể sử dụng
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

// --- Hàm giả lập gọi API backend (THAY THẾ BẰNG CODE GỌI API THẬT CỦA BẠN) ---
// Hàm này mô phỏng việc gọi các API backend của bạn và trả về kết quả
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
// --- End Hàm giả lập ---


// --- Express App Setup ---
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route demo hiển thị lịch sử chat (giữ nguyên)
app.get('/', async (req, res) => {
    // Lưu ý: Endpoint chat-history/26c09d76-291c-4003-ac03-45589c66c0d4
    // cần trả về dữ liệu chat đúng định dạng để hiển thị trong EJS template
    // Code này giả định endpoint đó đã tồn tại và hoạt động trên cổng 8080
    try {
        const response = await fetch(`http://localhost:8080/api/v1/chat-history/26c09d76-291c-4003-ac03-45589c66c0d4`);
         if (!response.ok) {
             console.error(`Error fetching chat history from 8080: ${response.status} ${response.statusText}`);
              // Fallback to empty history on error
             return res.render('index', { chatHistory: [] });
         }
        const chatHistoryResponse = await response.json(); // Lấy body là JSON
         // Giả định response JSON có cấu trúc { data: [...] }
         const chatHistoryData = chatHistoryResponse.data || [];
        console.log("Fetched chat history:", chatHistoryData);
        res.render('index', { chatHistory: chatHistoryData });
    } catch (error) {
        console.error("Error in / route fetching chat history:", error);
        // Trả về trạng thái lỗi hoặc trang trống thân thiện hơn
        res.status(500).send("Error loading chat history.");
    }
});

// --- Chat Endpoint đã sửa dụng Function Calling ---
app.post('/api/chat', async (req, res) => {
    // Frontend nên gửi câu hỏi dưới dạng { "question": "...", "userId": "...", "conversationHistory": [...] }
    // Trong ứng dụng thực tế, conversationHistory và userId là cần thiết để duy trì ngữ cảnh
    const userQuestion = req.body.question;
    const userId = req.body.userId || "demo_user_123"; // Lấy userId từ request hoặc dùng giả lập
    // Lấy lịch sử hội thoại từ request hoặc dùng mảng trống nếu không có
    // Trong ứng dụng thật, bạn cần lưu và tải lịch sử chat cho mỗi user/session
    const conversationHistory = req.body.conversationHistory || [];

    if (!userQuestion) {
        return res.status(400).json({
            code: 400,
            message: "Thiếu 'question' trong request body."
        });
    }

    console.log(`[User ${userId}] Question: "${userQuestion}"`);
    // console.log(`[User ${userId}] Conversation History (${conversationHistory.length} messages):`, conversationHistory);


    try {
        // Bước 1: Chuẩn bị tin nhắn và gọi LLM lần đầu
        // Thêm system message hướng dẫn LLM sử dụng các functions
        const systemMessage = {
            role: "system",
            content: `Bạn là một trợ lý y tế ảo thân thiện và hữu ích.
Nhiệm vụ của bạn là giúp người dùng tìm thông tin sức khỏe, bác sĩ, đặt lịch và xem lịch hẹn bằng cách sử dụng các công cụ (functions) được cung cấp.
Hãy luôn trả lời một cách chuyên nghiệp nhưng dễ hiểu. Khi trình bày kết quả từ các chức năng, hãy diễn giải nó thành ngôn ngữ tự nhiên, thân thiện với người dùng.
Nhấn mạnh rằng thông tin chỉ mang tính tham khảo và không thay thế lời khuyên y tế chuyên nghiệp từ bác sĩ.
Nếu không có công cụ nào phù hợp, hãy trả lời câu hỏi bằng kiến thức chung (nếu có) hoặc yêu cầu làm rõ thêm.
Đừng ngần ngại hỏi thêm thông tin nếu cần để sử dụng các công cụ (ví dụ: cần ngày giờ để đặt lịch, cần tên bệnh để tìm thông tin).`
        };

        // Tạo mảng messages cho LLM, bao gồm system, lịch sử chat (nếu có) và tin nhắn user mới nhất
        const messagesForLLM = [
            systemMessage,
            ...conversationHistory, // Thêm lịch sử chat cũ vào context
            { role: "user", content: userQuestion } // Thêm tin nhắn mới nhất của user
        ];

        console.log("--- Gọi Azure OpenAI API lần 1 (tìm function call) ---");
        const initialResponse = await client.path("/chat/completions").post({
            body: {
                messages: messagesForLLM,
                temperature: 0.7,
                top_p: 1,
                model:"openai/gpt-4.1"// Sử dụng deployment_name
            }
        });

         if (isUnexpected(initialResponse)) {
             // SỬA LỖI Ở ĐÂY: Truy cập body trực tiếp thay vì gọi .json()
             const errorBody = initialResponse.body;
             console.error("Azure OpenAI API Error (Initial Call):", initialResponse.status, errorBody);
             // Trả về lỗi chi tiết từ API nếu có (sử dụng optional chaining ?. để an toàn)
             throw new Error(`Azure OpenAI API Error: ${initialResponse.status} - ${errorBody?.error?.message || JSON.stringify(errorBody)}`);
         }
         return res.status(200).json({
                code: 200,
                message: "OK",
                data: {
                    content: initialResponse.body.choices[0].message.content, // Nội dung phản hồi từ LLM
                }
            });
    } catch (err) {
        console.error(`[User ${userId}] Error processing chat request:`, err);
        // Xử lý lỗi chung
        let errorMessage = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.";
         if (err.message) {
              errorMessage += ` Chi tiết: ${err.message}`;
         }

        res.status(500).json({
            code: 500,
            message: errorMessage,
            error: err.message || "Internal Server Error",
            // Có thể thêm thông tin chi tiết lỗi từ err nếu không quá nhạy cảm
             details: process.env.NODE_ENV !== 'production' && err.stack ? err.stack : undefined // Chỉ hiện stack trace khi không ở production
        });
    }
});

// Route send-email (giữ nguyên)
app.post('/send-email', async (req, res) => {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
        return res.status(400).json({ code: 400, message: "Missing required fields (to, subject, body)." });
    }
    try {
        // Giả định rabbitmq đã connect
        if (!rabbitmq || !rabbitmq.publish) {
             console.warn('RabbitMQ is not initialized or connected. Cannot publish email.');
             return res.status(500).json({ code: 500, message: 'RabbitMQ service is not available.' });
        }
        await rabbitmq.publish('email.send', { to, subject, body });
        res.json({ code: 200, message: 'Email task published to RabbitMQ' });
    } catch (error) {
        console.error('Failed to publish message to RabbitMQ:', error);
        res.status(500).json({ code: 500, message: 'Failed to publish message', error: error.message });
    }
});

// Khởi chạy server Express
const startServer = async () => {
    try {
        // Kết nối RabbitMQ trước khi khởi động server
        if (rabbitmq && rabbitmq.connect) {
            await rabbitmq.connect();
            console.log('Connected to RabbitMQ');
        } else {
             console.warn('RabbitMQ configuration seems missing or incomplete. Skipping RabbitMQ connection.');
        }

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1); // Thoát ứng dụng nếu không kết nối được DB/RabbitMQ quan trọng
    }
};

startServer();