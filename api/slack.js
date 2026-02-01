import { WebClient } from '@slack/web-api';
import { getThreadMessages, sendErrorToSlack } from '../lib/slack.js';
import { callAI } from '../lib/ai.js';
import { markdownToBlocks } from '../lib/messageFormatter.js';

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
    const blocks = markdownToBlocks(aiResponse);
    const result = await client.chat.postMessage({
      channel: channel,
      blocks: blocks.length > 0 ? blocks : undefined,
      text: aiResponse, // Fallback for clients that don't support blocks
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
      await sendErrorToSlack(client, event.channel, event.thread_ts || event.ts, error.message);
    } catch (slackError) {
      console.error('Failed to send error message to Slack:', slackError);
    }
  }
}
