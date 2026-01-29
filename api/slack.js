import { WebClient } from '@slack/web-api';

// Cache để track processed events (tránh duplicate)
const processedEvents = new Set();

export default async function handler(req, res) {
  // Chỉ accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // DEBUG
    console.log('Received event:', data.type, data.event?.type);
    console.log('Event ID:', data.event_id);
    console.log('Has token?', !!process.env.SLACK_BOT_TOKEN);
    console.log('Has AI key?', !!process.env.AI_API_KEY);

    // Slack URL verification
    if (data.type === 'url_verification') {
      return res.status(200).send(data.challenge);
    }

    // Xử lý mention event
    if (data.event?.type === 'app_mention') {
      const eventId = data.event_id;

      // Check duplicate event
      if (processedEvents.has(eventId)) {
        console.log('Duplicate event detected, skipping:', eventId);
        return res.status(200).send('ok');
      }

      // Mark event as processed
      processedEvents.add(eventId);

      // Clean up old events (giữ tối đa 1000 events)
      if (processedEvents.size > 1000) {
        const firstItem = processedEvents.values().next().value;
        processedEvents.delete(firstItem);
      }

      // Xử lý và đợi hoàn thành
      await handleMention(data.event, process.env.SLACK_BOT_TOKEN, process.env.AI_API_KEY, process.env.AI_MODEL || 'gemini-3-flash-preview');
      return res.status(200).send('ok');
    }

    return res.status(200).send('ok');
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}

async function handleMention(event, token, aiApiKey, aiModel) {
  const startTime = Date.now();

  try {
    const text = event.text;
    const channel = event.channel;
    const threadTs = event.thread_ts || event.ts;

    console.log('Handling mention:', text);
    console.log('Channel:', channel);
    console.log('Thread TS:', threadTs);
    console.log('AI Model:', aiModel);

    const client = new WebClient(token);

    // Lấy toàn bộ messages trong thread
    console.log('Fetching thread messages...');
    const threadMessages = await getThreadMessages(client, channel, threadTs);
    console.log('Thread messages count:', threadMessages.length);
    console.log('Time elapsed:', Date.now() - startTime, 'ms');

    // Gọi AI để trả lời
    console.log('Calling AI...');
    const aiResponse = await callAI(threadMessages, aiApiKey, aiModel);
    console.log('AI response received:', aiResponse.substring(0, 100));
    console.log('Time elapsed:', Date.now() - startTime, 'ms');

    // Gửi reply vào thread
    console.log('Sending reply to Slack...');
    const result = await client.chat.postMessage({
      channel: channel,
      text: aiResponse,
      thread_ts: threadTs
    });

    console.log('Slack response OK:', result.ok);
    console.log('Total time:', Date.now() - startTime, 'ms');
  } catch (error) {
    console.error('Error handling mention:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Time elapsed before error:', Date.now() - startTime, 'ms');

    // Gửi error message về Slack
    try {
      const client = new WebClient(token);
      await client.chat.postMessage({
        channel: event.channel,
        text: `Xin lỗi, đã xảy ra lỗi: ${error.message}`,
        thread_ts: event.thread_ts || event.ts
      });
    } catch (slackError) {
      console.error('Failed to send error message to Slack:', slackError);
    }
  }
}

async function getThreadMessages(client, channel, threadTs) {
  try {
    const result = await client.conversations.replies({
      channel: channel,
      ts: threadTs,
      limit: 1000 // Lấy tối đa 1000 messages (full thread)
    });

    if (!result.ok) {
      console.error('Failed to fetch thread messages:', result.error);
      return [];
    }

    // Format messages thành context cho AI
    // Loại bỏ bot mention tag
    return result.messages.map(msg => {
      let content = msg.text || '';
      // Remove bot mention (e.g., <@U0ABQA93VK7>)
      content = content.replace(/<@[A-Z0-9]+>/g, '').trim();

      return {
        role: msg.bot_id ? 'assistant' : 'user',
        content: content,
        timestamp: msg.ts
      };
    });
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    return [];
  }
}

async function callAI(threadMessages, apiKey, model) {
  try {
    // Build messages array cho AI
    const messages = threadMessages
      .filter(msg => msg.content) // Loại bỏ messages rỗng
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Lấy ngày giờ hiện tại (timezone Việt Nam)
    const now = new Date();
    const vnTime = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(now);

    // Thêm system prompt ở đầu với ngày giờ hiện tại
    messages.unshift({
      role: 'system',
      content: `Bạn là một trợ lý AI thông minh và hữu ích.

THỜI GIAN HIỆN TẠI: ${vnTime}

QUAN TRỌNG:
- LUÔN sử dụng Google Search để tìm kiếm thông tin mới nhất và chính xác nhất
- Ưu tiên kết quả tìm kiếm gần đây nhất
- Trả lời dựa trên dữ liệu real-time từ Google Search
- Nếu câu hỏi liên quan đến thời gian (hôm nay, hiện tại, mới nhất), BẮT BUỘC phải search
- Trả lời ngắn gọn, rõ ràng và chính xác
- Nếu không tìm thấy thông tin, hãy thừa nhận thay vì bịa đặt
- Bạn có thể điều khiển đèn thông minh khi người dùng yêu cầu`
    });

    console.log('Sending to AI with model:', model);
    console.log('Initial messages:', JSON.stringify(messages));

    // Define tools (Google Search + Control Light)
    const tools = [
      {
        google_search: {}
      },
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
      }
    ];

    console.log('Tools:', JSON.stringify(tools));

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
      console.log('AI API response:', JSON.stringify(data));

      const choice = data.choices?.[0];
      const message = choice?.message;

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
          console.log('Processing tool call:', JSON.stringify(toolCall));

          if (toolCall.function?.name === 'controlLight') {
            const args = JSON.parse(toolCall.function.arguments);
            console.log('Executing controlLight with args:', args);

            // Execute the function
            const result = executeControlLight(args);
            console.log('Function result:', result);

            // Add tool response to conversation
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: 'controlLight',
              content: JSON.stringify(result)
            });
          } else {
            console.log('Unknown tool call:', toolCall.function?.name);
          }
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

      console.log('Final AI response:', finalReply);
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

// Function to execute light control
function executeControlLight(args) {
  const { action, brightness } = args;

  console.log(`[LIGHT CONTROL] Action: ${action}, Brightness: ${brightness || 'N/A'}`);

  if (action === 'on') {
    const level = brightness || 100;
    return {
      success: true,
      message: `Đã bật đèn với độ sáng ${level}%`,
      state: {
        power: 'on',
        brightness: level
      }
    };
  } else if (action === 'off') {
    return {
      success: true,
      message: 'Đã tắt đèn',
      state: {
        power: 'off',
        brightness: 0
      }
    };
  } else {
    return {
      success: false,
      message: 'Hành động không hợp lệ'
    };
  }
}
