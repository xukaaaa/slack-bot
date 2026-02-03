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
    // Google Search Tool
    {
      google_search: {}
    },

    // MCP Redmine Tools
    ...getRedmineTools()
  ];
}

/**
 * Get tools for code review mode (GitLab + Google Search only)
 * @returns {Array} Array of tool definitions for code review
 */
export function getCodeReviewTools() {
  return [
    // Google Search Tool
    {
      google_search: {}
    },

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
        description: 'Xem danh sách tasks Redmine được assign cho bạn hoặc user khác với filter theo status và project.',
        parameters: {
          type: 'object',
          properties: {
            project_id: {
              type: 'number',
              description: 'Project ID (bắt buộc)'
            },
            status_filter: {
              type: 'string',
              description: 'Status filter: "open", "closed", hoặc "all"',
              enum: ['open', 'closed', 'all']
            },
            assigned_to_id: {
              type: ['number', 'string'],
              description: 'User ID hoặc "me" cho current user'
            }
          },
          required: ['project_id']
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
        description: 'Log thời gian làm việc vào Redmine issue với activity và process',
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
            },
            activity_id: {
              type: 'string',
              description: 'Activity ID: "19"=Study, "14"=Create, "15"=Review, "16"=Correct, "18"=Test',
              enum: ['19', '14', '15', '16', '18']
            },
            process: {
              type: 'string',
              description: 'Process type',
              enum: ['Preparation', 'Management', 'Requirement', 'Design', 'Coding', 'Unit Test', 'Integration Test', 'System Test', 'UAT Support']
            },
            spent_on: {
              type: 'string',
              description: 'Ngày log (YYYY-MM-DD), mặc định là hôm nay'
            }
          },
          required: ['issue_id', 'hours', 'comment', 'activity_id', 'process']
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
    },

    // MCP Redmine Tool: List Statuses
    {
      type: 'function',
      function: {
        name: 'listRedmineStatuses',
        description: 'Lấy danh sách tất cả các issue statuses có sẵn trong Redmine',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },

    // MCP Redmine Tool: Create Issue
    {
      type: 'function',
      function: {
        name: 'createRedmineIssue',
        description: 'Tạo issue mới trong Redmine (bug, feature, task, subtask). Tracker IDs: 1=Bug, 2=Feature, 3=Task, 4=Support. Priority: 1-5 (1=Low, 2=Normal, 3=High, 4=Urgent, 5=Immediate)',
        parameters: {
          type: 'object',
          properties: {
            project_id: {
              type: 'number',
              description: 'Project ID (bắt buộc)'
            },
            subject: {
              type: 'string',
              description: 'Tiêu đề issue (bắt buộc)'
            },
            description: {
              type: 'string',
              description: 'Mô tả chi tiết issue'
            },
            tracker_id: {
              type: 'number',
              description: 'Tracker ID: 1=Bug, 2=Feature, 3=Task, 4=Support'
            },
            priority_id: {
              type: 'number',
              description: 'Priority ID: 1=Low, 2=Normal, 3=High, 4=Urgent, 5=Immediate (mặc định: 2)'
            },
            assigned_to_id: {
              type: 'number',
              description: 'User ID được assign task'
            },
            estimated_hours: {
              type: 'number',
              description: 'Số giờ ước tính'
            },
            start_date: {
              type: 'string',
              description: 'Ngày bắt đầu (YYYY-MM-DD)'
            },
            due_date: {
              type: 'string',
              description: 'Deadline (YYYY-MM-DD)'
            },
            parent_issue_id: {
              type: 'number',
              description: 'Parent issue ID (dùng để tạo subtask)'
            }
          },
          required: ['project_id', 'subject']
        }
      }
    },

    // MCP Redmine Tool: Get User Info
    {
      type: 'function',
      function: {
        name: 'getRedmineUserInfo',
        description: 'Lấy thông tin user trong Redmine theo username hoặc current user',
        parameters: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'Username cần tìm (tùy chọn, mặc định là current user)'
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
