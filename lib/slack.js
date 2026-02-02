/**
 * Slack Helper Functions
 * Utilities for interacting with Slack API
 */

/**
 * Get all messages in a thread
 * @param {WebClient} client - Slack WebClient instance
 * @param {string} channel - Channel ID
 * @param {string} threadTs - Thread timestamp
 * @returns {Promise<Array>} Array of formatted messages
 */
export async function getThreadMessages(client, channel, threadTs) {
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

    // Get unique user IDs
    const uniqueUserIds = [...new Set(
      result.messages
        .map(msg => msg.user || msg.bot_id)
        .filter(id => id && id !== 'unknown')
    )];

    // Batch fetch user info (parallel)
    const userInfoMap = {};
    if (uniqueUserIds.length > 0) {
      const userInfoPromises = uniqueUserIds.map(async (userId) => {
        try {
          const userInfo = await client.users.info({ user: userId });
          return { id: userId, name: userInfo.user.real_name || userInfo.user.name };
        } catch (error) {
          console.error(`Failed to fetch user info for ${userId}:`, error.message);
          return { id: userId, name: userId }; // Fallback to ID
        }
      });

      const userInfos = await Promise.all(userInfoPromises);
      userInfos.forEach(info => {
        userInfoMap[info.id] = info.name;
      });
    }

    // Format messages thành context cho AI
    // Loại bỏ bot mention tag
    return result.messages.map(msg => {
      let content = msg.text || '';
      // Remove bot mention (e.g., <@U0ABQA93VK7>)
      content = content.replace(/<@[A-Z0-9]+>/g, '').trim();

      const userId = msg.user || msg.bot_id || 'unknown';
      const username = userInfoMap[userId] || userId;

      return {
        role: msg.bot_id ? 'assistant' : 'user',
        content: content,
        timestamp: msg.ts,
        user: userId,
        username: username
      };
    });
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    return [];
  }
}

/**
 * Send error message to Slack thread
 * @param {WebClient} client - Slack WebClient instance
 * @param {string} channel - Channel ID
 * @param {string} threadTs - Thread timestamp
 * @param {string} errorMessage - Error message to send
 */
export async function sendErrorToSlack(client, channel, threadTs, errorMessage) {
  try {
    await client.chat.postMessage({
      channel: channel,
      text: `Xin lỗi, đã xảy ra lỗi: ${errorMessage}`,
      thread_ts: threadTs
    });
  } catch (error) {
    console.error('Failed to send error message to Slack:', error);
  }
}
