// File: server.js - Máy chủ Express chính
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { generateResponse } = require('./rag');
const { loadDocuments } = require('./dataLoader');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Khởi tạo dữ liệu
let healthcareData = [];

// API endpoints
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Vui lòng nhập câu hỏi' });
    }

    const response = await generateResponse(message, healthcareData);
    res.json({ response });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn' });
  }
});

// API để thêm dữ liệu mới
app.post('/api/data', async (req, res) => {
  try {
    const { documents } = req.body;
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'Định dạng dữ liệu không hợp lệ' });
    }
    
    documents.forEach(doc => {
      healthcareData.push(doc);
    });
    
    res.json({ success: true, count: healthcareData.length });
  } catch (error) {
    console.error('Error adding data:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi thêm dữ liệu' });
  }
});

// Khởi tạo server
async function startServer() {
  try {
    // Tải dữ liệu healthcare từ nguồn dữ liệu
    healthcareData = await loadDocuments();
    console.log(`Đã tải ${healthcareData.length} tài liệu healthcare`);
    
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Không thể khởi động server:', error);
    process.exit(1);
  }
}

startServer();