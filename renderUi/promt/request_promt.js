const promt_ui = `
Hãy viết một đoạn mã HTML + CSS + JavaScript đơn giản để tạo một khối giao diện dạng chatbot.
Giao diện gồm:

Một câu hỏi hiển thị trên cùng (lấy từ data.question)

Các nút lựa chọn tương ứng với data.options (số lượng nút có thể thay đổi linh hoạt).

Yêu cầu:

Giao diện đẹp, hiện đại, responsive.

Các nút được sinh tự động dựa trên dữ liệu đầu vào (không hardcode).

Dữ liệu có cấu trúc như sau:
\`\`\`json
{
  "question": "Bạn muốn làm gì hôm nay?",
  "options": [
    { "text": "Xem thời tiết", "action": "weather" },
    { "text": "Đặt lịch hẹn", "action": "appointment" },
    { "text": "Tìm kiếm thông tin", "action": "search" }
  ]
}
\`\`\`
Yêu cầu sử dụng các công nghệ HTML, CSS, JavaScript thuần túy (không sử dụng framework như React, Vue, Angular).
Yêu cầu có thể chạy trực tiếp trên trình duyệt mà không cần build tool hay server.
`