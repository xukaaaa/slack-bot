/**
 * AI Tools Configuration
 * Defines all available function calling tools for the AI
 */

/**
 * Get all available tools for AI function calling
 * @returns {Array} Array of tool definitions
 */
export function getAITools() {
  return [
    // Google Search Tool
    {
      google_search: {}
    },

    // Smart Light Control Tool
    {
      type: 'function',
      function: {
        name: 'controlLight',
        description: 'Điều khiển đèn thông minh: bật/tắt và điều chỉnh độ sáng',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['on', 'off'],
              description: 'Hành động: bật (on) hoặc tắt (off) đèn'
            },
            brightness: {
              type: 'number',
              description: 'Độ sáng từ 0-100 (chỉ áp dụng khi action là "on")'
            }
          },
          required: ['action']
        }
      }
    },

    // Redmine Issue Creation Tool
    {
      type: 'function',
      function: {
        name: 'createRedmineIssue',
        description: 'Tạo task/issue mới trong Redmine project management system',
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Tiêu đề của task/issue (bắt buộc)'
            },
            description: {
              type: 'string',
              description: 'Mô tả chi tiết của task/issue'
            },
            priority_id: {
              type: 'number',
              enum: [3, 4, 5, 6, 7],
              description: 'Độ ưu tiên: 3=Low, 4=Normal (default), 5=High, 6=Urgent, 7=Immediate'
            },
            tracker_id: {
              type: 'number',
              enum: [1, 2, 3],
              description: 'Loại task: 1=Bug, 2=Feature, 3=Support (default=2)'
            },
            estimated_hours: {
              type: 'number',
              description: 'Số giờ ước tính để hoàn thành'
            }
          },
          required: ['subject']
        }
      }
    },

    // Redmine Issues List Tool
    {
      type: 'function',
      function: {
        name: 'getRedmineIssues',
        description: 'Lấy danh sách tasks/issues từ Redmine project',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['open', 'closed', '*'],
              description: 'Trạng thái: open (đang mở), closed (đã đóng), * (tất cả). Default: open'
            },
            assigned_to_id: {
              type: 'string',
              description: 'Lọc theo người được assign: user_id hoặc "me" (tasks của tôi)'
            },
            limit: {
              type: 'number',
              description: 'Số lượng issues trả về (default: 10, max: 100)'
            },
            sort: {
              type: 'string',
              enum: ['updated_on:desc', 'updated_on:asc', 'priority:desc', 'priority:asc', 'status:asc', 'status:desc'],
              description: 'Sắp xếp theo: updated_on (cập nhật), priority (ưu tiên), status (trạng thái). Thêm :desc để giảm dần'
            }
          },
          required: []
        }
      }
    }
  ];
}

/**
 * Get system prompt for AI
 * @param {string} vnTime - Current Vietnam time formatted string
 * @returns {string} System prompt
 */
export function getSystemPrompt(vnTime) {
  return `Bạn là một trợ lý AI thông minh và hữu ích.

THỜI GIAN HIỆN TẠI: ${vnTime}

QUAN TRỌNG:
- LUÔN sử dụng Google Search để tìm kiếm thông tin mới nhất và chính xác nhất
- Ưu tiên kết quả tìm kiếm gần đây nhất
- Trả lời dựa trên dữ liệu real-time từ Google Search
- Nếu câu hỏi liên quan đến thời gian (hôm nay, hiện tại, mới nhất), BẮT BUỘC phải search
- Trả lời ngắn gọn, rõ ràng và chính xác
- Nếu không tìm thấy thông tin, hãy thừa nhận thay vì bịa đặt

CÔNG CỤ KHẢ DỤNG:
- Bạn có thể điều khiển đèn thông minh khi người dùng yêu cầu
- Bạn có thể tạo task/issue trong Redmine khi người dùng yêu cầu (ví dụ: "tạo task", "tạo issue", "thêm task")
  + Tự động phân tích độ ưu tiên từ keywords: urgent/khẩn cấp (6), high/cao (5), normal/bình thường (4), low/thấp (3)
  + Tự động phân tích loại task: bug/lỗi (1), feature/tính năng (2), support/hỗ trợ (3)
  + Trích xuất tiêu đề và mô tả từ yêu cầu của người dùng
- Bạn có thể xem danh sách tasks/issues trong Redmine khi người dùng yêu cầu (ví dụ: "xem task", "danh sách task", "task của tôi", "task đang mở")
  + Có thể lọc theo trạng thái: open (đang mở), closed (đã đóng), all (tất cả)
  + Có thể lọc theo người được assign
  + Có thể sắp xếp theo thời gian cập nhật, độ ưu tiên, trạng thái`;
}
