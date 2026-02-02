/**
 * GitLab Tools Configuration
 * Defines AI function calling tools for GitLab operations
 */

/**
 * Get GitLab tools for AI function calling
 * @returns {Array} Array of GitLab tool definitions
 */
export function getGitLabTools() {
  return [
    // GitLab Tool: List Merge Requests
    {
      type: 'function',
      function: {
        name: 'listGitLabMergeRequests',
        description: 'Lấy danh sách Merge Requests của GitLab project. Hiển thị tất cả MRs với title, author, status.',
        parameters: {
          type: 'object',
          properties: {
            project_id: {
              type: 'number',
              description: 'GitLab Project ID (ví dụ: 12345)'
            },
            state: {
              type: 'string',
              description: 'Trạng thái MR: "opened", "closed", "merged", "all"',
              enum: ['opened', 'closed', 'merged', 'all']
            }
          },
          required: ['project_id', 'state']
        }
      }
    },

    // GitLab Tool: Get MR Changes/Diff
    {
      type: 'function',
      function: {
        name: 'getGitLabMRChanges',
        description: 'Lấy chi tiết thay đổi (diff) của một Merge Request cụ thể',
        parameters: {
          type: 'object',
          properties: {
            project_id: {
              type: 'number',
              description: 'GitLab Project ID'
            },
            mr_iid: {
              type: 'number',
              description: 'Merge Request IID (internal ID)'
            }
          },
          required: ['project_id', 'mr_iid']
        }
      }
    },

    // GitLab Tool: Get MR Commits
    {
      type: 'function',
      function: {
        name: 'getGitLabMRCommits',
        description: 'Lấy danh sách commits của một Merge Request',
        parameters: {
          type: 'object',
          properties: {
            project_id: {
              type: 'number',
              description: 'GitLab Project ID'
            },
            mr_iid: {
              type: 'number',
              description: 'Merge Request IID'
            }
          },
          required: ['project_id', 'mr_iid']
        }
      }
    }
  ];
}
