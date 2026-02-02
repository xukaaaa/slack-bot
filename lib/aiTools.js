/**
 * AI Tools Configuration
 * Defines all available function calling tools for the AI
 */

import { getGitLabTools } from './gitlabTools.js';

/**
 * Get all available tools for AI function calling
 * @returns {Array} Array of tool definitions
 */
export function getAITools() {
  return [
    // MCP Redmine Tools
    ...getRedmineTools(),

    // GitLab Tools
    ...getGitLabTools()
  ];
}

/**
 * Get Redmine tools
 * @returns {Array} Array of Redmine tool definitions
 */
function getRedmineTools() {
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
            comment: {
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
        description: 'Thay đổi status của issue. Status IDs: 1=New, 2=In Progress, 3=Resolved, 4=Feedback, 5=Closed, 6=Rejected',
        parameters: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'number',
              description: 'ID của issue'
            },
            status_id: {
              type: 'number',
              description: 'Status ID (1=New, 2=In Progress, 3=Resolved, 4=Feedback, 5=Closed, 6=Rejected)'
            }
          },
          required: ['issue_id', 'status_id']
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
            percent: {
              type: 'number',
              description: 'Phần trăm hoàn thành (0-100)'
            }
          },
          required: ['issue_id', 'percent']
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
            from_date: {
              type: 'string',
              description: 'Ngày bắt đầu (YYYY-MM-DD)'
            },
            to_date: {
              type: 'string',
              description: 'Ngày kết thúc (YYYY-MM-DD)'
            }
          },
          required: ['from_date', 'to_date']
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
- Nếu không tìm thấy thông tin, hãy thừa nhận thay vì bịa đặt`;
}
