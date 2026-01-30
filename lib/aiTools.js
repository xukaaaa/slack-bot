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
        description: 'Tạo task/issue mới trong Redmine project management system. Có thể tạo task độc lập hoặc subtask (task con).',
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Tiêu đề của task/issue (bắt buộc) - sử dụng CHÍNH XÁC tiêu đề mà user cung cấp'
            },
            description: {
              type: 'string',
              description: 'Mô tả chi tiết của task/issue (tùy chọn, không bắt buộc)'
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
              description: 'Số giờ ước tính để hoàn thành (ví dụ: 2, 4, 8)'
            },
            start_date: {
              type: 'string',
              description: 'Ngày bắt đầu theo định dạng YYYY-MM-DD (ví dụ: 2026-01-29)'
            },
            due_date: {
              type: 'string',
              description: 'Ngày kết thúc/deadline theo định dạng YYYY-MM-DD (ví dụ: 2026-01-30)'
            },
            parent_issue_id: {
              type: 'number',
              description: 'ID của task cha (để tạo subtask/task con). Bỏ qua nếu tạo task độc lập.'
            },
            assigned_to_id: {
              type: 'string',
              description: 'ID hoặc username của người được assign task'
            }
          },
          required: ['subject']
        }
      }
    },

    // Redmine Issue Update Tool
    {
      type: 'function',
      function: {
        name: 'updateRedmineIssue',
        description: 'Cập nhật/sửa task/issue đã tồn tại trong Redmine. Có thể sửa bất kỳ field nào. QUAN TRỌNG: Khi update status sang Completed (7), BẮT BUỘC phải có actual_start_date và actual_finish_date.',
        parameters: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'number',
              description: 'ID của issue cần update (bắt buộc)'
            },
            subject: {
              type: 'string',
              description: 'Tiêu đề mới (nếu muốn đổi)'
            },
            description: {
              type: 'string',
              description: 'Mô tả mới (nếu muốn đổi)'
            },
            status_id: {
              type: 'number',
              description: 'Status ID mới: 11=Open, 1=Pending, 10=In Progress, 3=Resolved, 4=Feedback, 7=Completed (cần Act.Start & Act.Finish), 5=Closed, 6=Cancelled'
            },
            priority_id: {
              type: 'number',
              enum: [3, 4, 5, 6, 7],
              description: 'Độ ưu tiên mới: 3=Low, 4=Normal, 5=High, 6=Urgent, 7=Immediate'
            },
            tracker_id: {
              type: 'number',
              enum: [1, 2, 3],
              description: 'Loại task mới: 1=Bug, 2=Feature, 3=Support'
            },
            estimated_hours: {
              type: 'number',
              description: 'Số giờ ước tính mới'
            },
            start_date: {
              type: 'string',
              description: 'Ngày bắt đầu mới (YYYY-MM-DD)'
            },
            due_date: {
              type: 'string',
              description: 'Ngày kết thúc mới (YYYY-MM-DD)'
            },
            done_ratio: {
              type: 'number',
              description: 'Phần trăm hoàn thành (0-100). Nên set 100 khi status=Completed'
            },
            assigned_to_id: {
              type: 'string',
              description: 'User ID mới để assign'
            },
            notes: {
              type: 'string',
              description: 'Comment/ghi chú về việc update này'
            },
            actual_start_date: {
              type: 'string',
              description: 'Ngày bắt đầu thực tế (YYYY-MM-DD). BẮT BUỘC khi update status sang Completed (7)'
            },
            actual_finish_date: {
              type: 'string',
              description: 'Ngày kết thúc thực tế (YYYY-MM-DD). BẮT BUỘC khi update status sang Completed (7)'
            }
          },
          required: ['issue_id']
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
    },

    // Redmine Members List Tool
    {
      type: 'function',
      function: {
        name: 'getRedmineMembers',
        description: 'Lấy danh sách members (thành viên) trong Redmine project để biết user ID khi assign tasks',
        parameters: {
          type: 'object',
          properties: {},
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
  + Sử dụng CHÍNH XÁC tiêu đề mà user cung cấp, không tự ý thay đổi
  + Có thể tạo subtask (task con) bằng cách chỉ định parent_issue_id
  + Hỗ trợ start_date, due_date, estimated_hours, assigned_to_id
  + Khi cần assign cho user, GỌI getRedmineMembers() TRƯỚC để lấy user ID
- Bạn có thể cập nhật/sửa task/issue trong Redmine (ví dụ: "sửa task #123", "update estimate task #456", "đổi deadline task #789")
  + Có thể sửa: tiêu đề, mô tả, status, priority, tracker, estimated_hours, start_date, due_date, done_ratio, assigned_to
  + Có thể thêm comment/notes khi update
  + Cần có issue_id để xác định task cần sửa
- Bạn có thể xem danh sách tasks/issues trong Redmine khi người dùng yêu cầu (ví dụ: "xem task", "danh sách task", "task của tôi", "task đang mở")
  + Có thể lọc theo trạng thái: open (đang mở), closed (đã đóng), all (tất cả)
  + Có thể lọc theo người được assign
  + Có thể sắp xếp theo thời gian cập nhật, độ ưu tiên, trạng thái
  + Có thể tìm parent task để lấy parent_issue_id khi tạo subtask
- Bạn có thể xem danh sách members trong project (ví dụ: "xem members", "danh sách thành viên")
  + Dùng để lấy user ID khi cần assign task cho ai đó`;
}
