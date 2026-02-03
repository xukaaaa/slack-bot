/**
 * AI Service Module
 * Handles communication with AI API and tool execution
 */

import { getAITools, getCodeReviewTools, getSystemPrompt } from './aiTools.js';
import { callMCPTool } from './mcpManager.js';
import { getCodeReviewPrompt } from './codeReviewPrompt.js';
import {
  listMergeRequests,
  getMergeRequestChanges,
  getMergeRequestCommits
} from './gitlabApi.js';

/**
 * Call AI API with thread messages and handle tool calls
 * @param {Array} threadMessages - Array of thread messages
 * @param {string} apiKey - AI API key
 * @param {string} model - AI model name
 * @param {string} projectId - Redmine project ID (optional)
 * @returns {Promise<string>} AI response text
 */
export async function callAI(threadMessages, apiKey, model, projectId = null) {
  try {
    // Log thread messages
    console.log('Thread messages:', JSON.stringify(threadMessages.map(msg => ({
      role: msg.role,
      username: msg.username,
      email: msg.email,
      content: msg.content
    }))));

    // Build messages array cho AI
    const messages = threadMessages
      .filter(msg => msg.content) // Loại bỏ messages rỗng
      .map(msg => ({
        role: msg.role,
        content: msg.role === 'user' ? `[${msg.username}]: ${msg.content}` : msg.content
      }));

    // Lấy ngày giờ hiện tại (timezone Việt Nam)
    const now = new Date();
    const vnTime = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(now);

    // Check if user is requesting code review
    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const isCodeReview = userMessage.includes('review');

    // Build system prompt and tools based on mode
    let systemPrompt;
    let tools;

    if (isCodeReview) {
      // Code review mode: use dedicated prompt and tools (GitLab + Google Search only)
      systemPrompt = getCodeReviewPrompt();
      tools = getCodeReviewTools();
      console.log('Code review mode activated');
    } else {
      // Normal mode: use standard prompt and all tools
      systemPrompt = getSystemPrompt(vnTime);
      tools = getAITools();
    }

    // Add project context if available
    if (projectId) {
      systemPrompt += `\n\nCONTEXT: Bạn đang làm việc với Redmine Project ID: ${projectId}`;
      console.log('Project context added:', projectId);
    }

    // Thêm system prompt ở đầu với ngày giờ hiện tại
    messages.unshift({
      role: 'system',
      content: systemPrompt
    });

    console.log('Sending to AI with model:', model);
    console.log('Message count:', messages.length);

    // Get tools configuration
    console.log('Tools count:', tools.length);

    // Loop để xử lý multiple tool calls
    let conversationMessages = [...messages];
    let loopCount = 0;
    const maxLoops = 5; // Giới hạn để tránh infinite loop

    while (loopCount < maxLoops) {
      loopCount++;
      console.log(`\n=== Loop ${loopCount} ===`);

      // Gọi AI API
      const response = await fetch('https://cliproxyapi-5aib.onrender.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: conversationMessages,
          tools: tools
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error:', response.status, errorText);
        return 'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.';
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      console.log('AI response - finish_reason:', choice?.finish_reason, 'has_tool_calls:', !!message?.tool_calls);

      // Check if AI wants to call functions
      if (message?.tool_calls && message.tool_calls.length > 0) {
        console.log(`AI requested ${message.tool_calls.length} tool call(s)`);

        // Add assistant message with tool calls
        conversationMessages.push({
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls
        });

        // Process each tool call
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function?.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          console.log(`Tool call: ${toolName}(${JSON.stringify(toolArgs)})`);

          const result = await executeToolCall(toolCall);

          // Log full tool result
          console.log(`Tool result:`, JSON.stringify(result));

          // Add tool response to conversation
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function?.name,
            content: JSON.stringify(result)
          });
        }

        // Continue loop to get AI's next response
        console.log('Sending tool results back to AI...');
        continue;
      }

      // No more tool calls, return final response
      const finalReply = message?.content;

      if (!finalReply || finalReply.trim() === '') {
        console.warn('AI returned empty response');
        return 'Tôi không có gì để thêm vào cuộc trò chuyện này.';
      }

      const replyPreview = finalReply.length > 100
        ? finalReply.substring(0, 100) + '...'
        : finalReply;
      console.log('Final AI response:', replyPreview);
      return finalReply;
    }

    // Max loops reached
    console.warn('Max loops reached, returning last message');
    return 'Đã xử lý xong các yêu cầu của bạn.';

  } catch (error) {
    console.error('Error calling AI:', error);
    return 'Đã xảy ra lỗi khi gọi AI.';
  }
}

/**
 * Execute a tool call based on function name
 * @param {Object} toolCall - Tool call object from AI
 * @returns {Promise<Object>} Tool execution result
 */
async function executeToolCall(toolCall) {
  const functionName = toolCall.function?.name;
  const args = JSON.parse(toolCall.function.arguments);

  console.log(`Executing ${functionName}`);

  switch (functionName) {
    // MCP Redmine Tools
    case 'listMyRedmineTasks':
      return await callMCPTool('redmine_list_my_tasks', {
        project_id: args.project_id,
        status_filter: args.status_filter || 'open',
        assigned_to_id: args.assigned_to_id || 'me'
      });

    case 'getRedmineIssueDetails':
      return await callMCPTool('redmine_get_issue_details', {
        issue_id: args.issue_id
      });

    case 'logRedmineTime':
      return await callMCPTool('redmine_log_time', {
        issue_id: args.issue_id,
        hours: args.hours,
        comment: args.comment,
        activity_id: args.activity_id,
        process: args.process,
        spent_on: args.spent_on
      });

    case 'updateRedmineIssueStatus':
      return await callMCPTool('redmine_update_issue_status', {
        issue_id: args.issue_id,
        status_id: args.status_id
      });

    case 'updateRedmineProgress':
      return await callMCPTool('redmine_update_progress', {
        issue_id: args.issue_id,
        percent: args.percent
      });

    case 'addRedmineNote':
      return await callMCPTool('redmine_add_note', {
        issue_id: args.issue_id,
        note: args.note
      });

    case 'getTodayRedmineLogs':
      return await callMCPTool('redmine_get_today_logs', {});

    case 'getRedmineLogsRange':
      return await callMCPTool('redmine_get_time_logs_range', {
        from_date: args.from_date,
        to_date: args.to_date
      });

    case 'listRedmineStatuses':
      return await callMCPTool('redmine_list_statuses', {});

    case 'createRedmineIssue':
      return await callMCPTool('redmine_create_issue', {
        project_id: args.project_id,
        subject: args.subject,
        description: args.description,
        tracker_id: args.tracker_id,
        priority_id: args.priority_id,
        assigned_to_id: args.assigned_to_id,
        estimated_hours: args.estimated_hours,
        start_date: args.start_date,
        due_date: args.due_date,
        parent_issue_id: args.parent_issue_id
      });

    case 'getRedmineUserInfo':
      return await callMCPTool('redmine_get_user_info', {
        username: args.username
      });

    // GitLab Tools
    case 'listGitLabMergeRequests':
      return await listMergeRequests(args.project_path, args.state);

    case 'getGitLabMRChanges':
      return await getMergeRequestChanges(args.project_path, args.mr_iid);

    case 'getGitLabMRCommits':
      return await getMergeRequestCommits(args.project_path, args.mr_iid);

    default:
      console.log('Unknown tool call:', functionName);
      return {
        success: false,
        message: `Unknown function: ${functionName}`
      };
  }
}
