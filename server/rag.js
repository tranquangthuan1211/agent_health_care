// File: rag.js - Mô-đun RAG (Retrieval-Augmented Generation) cập nhật
const similarity = require('compute-cosine-similarity');
const axios = require('axios');

// Cấu hình API LLM
const API_URL = process.env.LLM_API_URL || 'https://your-llm-api-endpoint.com';
const API_KEY = process.env.LLM_API_KEY || 'your-api-key';
const MODEL = process.env.LLM_MODEL || 'your-model-name';

// Tạo client
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Cache để lưu embeddings
const embeddingsCache = new Map();

// Hàm tạo embeddings cho văn bản
async function createEmbedding(text) {
  if (embeddingsCache.has(text)) {
    return embeddingsCache.get(text);
  }

  try {
    // Thay bằng API tạo embedding tương ứng
    const response = await client.post('/embeddings', {
      model: 'embedding-model', // Thay bằng model embedding của bạn
      input: text
    });

    const embedding = response.data.data[0].embedding;
    embeddingsCache.set(text, embedding);
    return embedding;
  } catch (error) {
    console.error('Lỗi khi tạo embedding:', error);
    throw error;
  }
}

// Hàm tìm kiếm các tài liệu liên quan
async function retrieveRelevantDocuments(query, documents, topK = 3) {
  try {
    // Tạo embedding cho truy vấn
    const queryEmbedding = await createEmbedding(query);
    
    // Tính toán điểm tương đồng cho từng tài liệu
    const scoredDocuments = await Promise.all(
      documents.map(async (doc) => {
        // Tạo embedding cho tài liệu nếu chưa có
        if (!doc.embedding) {
          doc.embedding = await createEmbedding(doc.content);
        }
        
        // Tính điểm tương đồng cosine
        const score = similarity(queryEmbedding, doc.embedding);
        
        return {
          ...doc,
          score
        };
      })
    );
    
    // Sắp xếp và lấy top K tài liệu liên quan nhất
    return scoredDocuments
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error('Lỗi khi truy xuất tài liệu:', error);
    throw error;
  }
}

// Hàm tạo phản hồi dựa trên truy vấn và tài liệu liên quan
async function generateResponse(query, documents) {
  try {
    // Truy xuất các tài liệu liên quan
    const relevantDocs = await retrieveRelevantDocuments(query, documents);
    
    // Tạo ngữ cảnh từ các tài liệu liên quan
    const context = relevantDocs
      .map(doc => doc.content)
      .join('\n\n');
    
    // Tạo system prompt
    const systemPrompt = `Bạn là trợ lý y tế AI. Hãy dựa vào thông tin y tế được cung cấp để trả lời câu hỏi của người dùng một cách chính xác, đầy đủ và dễ hiểu. Chỉ sử dụng thông tin được cung cấp và kiến thức y tế phổ biến. Trong trường hợp không đủ thông tin để trả lời, hãy thừa nhận điều đó và cung cấp thông tin chung phù hợp.

QUAN TRỌNG: Khi trả lời bằng tiếng Việt, tránh sử dụng từ "nếu" - thay vào đó hãy dùng các từ thay thế như "khi", "trong trường hợp", "với", "đối với", hoặc viết lại câu để tránh câu điều kiện.

Thông tin y tế có liên quan:
${context}`;

    // Gọi API LLM theo cấu trúc bạn cung cấp
    const response = await client.post('/chat/completions', {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.7,
      top_p: 1,
      model: MODEL
    });

    // Kiểm tra lỗi
    if (response.status !== 200) {
      throw new Error(`API trả về status code: ${response.status}`);
    }

    // Trích xuất phản hồi
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Lỗi khi tạo phản hồi:', error);
    return "Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.";
  }
}

module.exports = {
  createEmbedding,
  retrieveRelevantDocuments,
  generateResponse
};