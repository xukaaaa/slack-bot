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
    // MCP Redmine Tool: List My Tasks
    {
      type: 'function',
      function: {
        name: 'listMyRedmineTasks',
        description: 'Xem danh sách tasks Redmine được assign cho bạn. Hiển thị tất cả tasks với status, progress, deadline.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },

    // MCP Redmine Tool: Get Issue Details
    {
      type: 'function',
      function: {
        name: 'getRedmineIssueDetails',
        description: 'Xem chi tiết một issue/task cụ thể trong Redmine',
        parameters: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'number',
              description: 'ID của issue cần xem (ví dụ: 225061)'
            }
          },
          required: ['issue_id']
        }
      }
    },

    // MCP Redmine Tool: Log Time
    {
      type: 'function',
      function: {
        name: 'logRedmineTime',
        description: 'Log thời gian làm việc vào Redmine issue',
        parameters: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'number',
              description: 'ID của issue'
            },
            hours: {
              type: 'number',
              description: 'Số giờ làm việc (ví dụ: 2, 4, 8)'
            },
            comments: {
              type: 'string',
              description: 'Mô tả công việc đã làm'
            }
          },
          required: ['issue_id', 'hours']
        }
      }
    },

    // MCP Redmine Tool: Update Issue Status
    {
      type: 'function',
      function: {
        name: 'updateRedmineIssueStatus',
        description: 'Thay đổi status của issue (Open, In Progress, Completed, etc.)',
        parameters: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'number',
              description: 'ID của issue'
            },
            status: {
              type: 'string',
              description: 'Status mới (ví dụ: "In Progress", "Completed", "Open")'
            }
          },
          required: ['issue_id', 'status']
        }
      }
    },

    // MCP Redmine Tool: Update Progress
    {
      type: 'function',
      function: {
        name: 'updateRedmineProgress',
        description: 'Cập nhật phần trăm hoàn thành của issue (0-100%)',
        parameters: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'number',
              description: 'ID của issue'
            },
            progress: {
              type: 'number',
              description: 'Phần trăm hoàn thành (0-100)'
            }
          },
          required: ['issue_id', 'progress']
        }
      }
    },

    // MCP Redmine Tool: Add Note/Comment
    {
      type: 'function',
      function: {
        name: 'addRedmineNote',
        description: 'Thêm comment/ghi chú vào issue',
        parameters: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'number',
              description: 'ID của issue'
            },
            note: {
              type: 'string',
              description: 'Nội dung comment'
            }
          },
          required: ['issue_id', 'note']
        }
      }
    },

    // MCP Redmine Tool: Get Today's Time Logs
    {
      type: 'function',
      function: {
        name: 'getTodayRedmineLogs',
        description: 'Xem tổng thời gian đã log hôm nay trong Redmine',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },

    // MCP Redmine Tool: Get Time Logs by Date Range
    {
      type: 'function',
      function: {
        name: 'getRedmineLogsRange',
        description: 'Xem time logs trong khoảng thời gian cụ thể',
        parameters: {
          type: 'object',
          properties: {
            start_date: {
              type: 'string',
              description: 'Ngày bắt đầu (YYYY-MM-DD)'
            },
            end_date: {
              type: 'string',
              description: 'Ngày kết thúc (YYYY-MM-DD)'
            }
          },
          required: ['start_date', 'end_date']
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

ĐỊNH DẠNG RESPONSE - QUAN TRỌNG:
- LUÔN format response thành Markdown để hiển thị đẹp trên Slack
- Sử dụng # cho tiêu đề chính, ## cho tiêu đề phụ
- Sử dụng - hoặc * cho danh sách bullet points
- Sử dụng \`\`\` cho code blocks
- Sử dụng > cho quotes/ghi chú
- Sử dụng **text** cho bold, *text* cho italic
- Tách các phần bằng dòng trống để dễ đọc

QUAN TRỌNG:
- LUÔN sử dụng Google Search để tìm kiếm thông tin mới nhất và chính xác nhất
- Ưu tiên kết quả tìm kiếm gần đây nhất
- Trả lời dựa trên dữ liệu real-time từ Google Search
- Nếu câu hỏi liên quan đến thời gian (hôm nay, hiện tại, mới nhất), BẮT BUỘC phải search
- Trả lời ngắn gọn, rõ ràng và chính xác
- Nếu không tìm thấy thông tin, hãy thừa nhận thay vì bịa đặt

REDMINE MANAGEMENT VIA MCP (Model Context Protocol):
  + XEM TASKS: "xem task của tôi", "danh sách task" → Gọi listMyRedmineTasks()
  + XEM CHI TIẾT: "xem task #225061" → Gọi getRedmineIssueDetails(issue_id)
  + LOG THỜI GIAN: "log 4 giờ vào task #123" → Gọi logRedmineTime(issue_id, hours, comments)
  + ĐỔI STATUS: "chuyển task #123 sang In Progress" → Gọi updateRedmineIssueStatus(issue_id, status)
  + CẬP NHẬT PROGRESS: "task #123 đã xong 80%" → Gọi updateRedmineProgress(issue_id, progress)
  + THÊM COMMENT: "comment vào task #123: đã xong phần frontend" → Gọi addRedmineNote(issue_id, note)
  + XEM TIME LOG: "xem giờ đã log hôm nay" → Gọi getTodayRedmineLogs()
  + XEM TIME LOG RANGE: "xem giờ từ 2026-01-01 đến 2026-01-31" → Gọi getRedmineLogsRange(start_date, end_date)

QUAN TRỌNG - PHÂN BIỆT HỎI ĐÁP VÀ HÀNH ĐỘNG:
- Nếu user HỎI về task (ví dụ: "task này như thế nào?", "có bao nhiêu task?") → GỌI listMyRedmineTasks() hoặc getRedmineIssueDetails()
- Nếu user YÊU CẦU HÀNH ĐỘNG (ví dụ: "log giờ", "đổi status", "update progress") → Gọi function tương ứng
- MỌI THAO TÁC với Redmine đều qua MCP tools, KHÔNG có REST API trực tiếp`;
}
