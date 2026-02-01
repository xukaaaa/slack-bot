/**
 * Markdown to Slack Block Kit Converter
 * Converts markdown text to beautiful Slack blocks
 */

/**
 * Convert markdown to Slack Block Kit blocks
 * @param {string} markdown - Markdown text
 * @returns {Array} Slack Block Kit blocks
 */
export function markdownToBlocks(markdown) {
  if (!markdown) {
    return [];
  }

  const lines = markdown.split('\n');
  const result = lines.reduce(
    (acc, line, index) => {
      // Skip if we're in a code block
      if (acc.skipUntil && index <= acc.skipUntil) {
        return acc;
      }

      const { blocks, currentSection } = acc;

      // Heading 1
      if (line.startsWith('# ')) {
        const newBlocks = currentSection.length > 0
          ? [...blocks, createSectionBlock(currentSection.join('\n'))]
          : blocks;
        return {
          blocks: [...newBlocks, createHeaderBlock(line.substring(2))],
          currentSection: []
        };
      }

      // Heading 2
      if (line.startsWith('## ')) {
        const newBlocks = currentSection.length > 0
          ? [...blocks, createSectionBlock(currentSection.join('\n'))]
          : blocks;
        return {
          blocks: [...newBlocks, createSectionBlock(`*${line.substring(3)}*`)],
          currentSection: []
        };
      }

      // Heading 3
      if (line.startsWith('### ')) {
        const newBlocks = currentSection.length > 0
          ? [...blocks, createSectionBlock(currentSection.join('\n'))]
          : blocks;
        return {
          blocks: [...newBlocks, createSectionBlock(`*${line.substring(4)}*`)],
          currentSection: []
        };
      }

      // Divider
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
        const newBlocks = currentSection.length > 0
          ? [...blocks, createSectionBlock(currentSection.join('\n'))]
          : blocks;
        return {
          blocks: [...newBlocks, { type: 'divider' }],
          currentSection: []
        };
      }

      // Code block
      if (line.startsWith('```')) {
        const newBlocks = currentSection.length > 0
          ? [...blocks, createSectionBlock(currentSection.join('\n'))]
          : blocks;

        const codeEndIndex = lines.findIndex((l, i) => i > index && l.startsWith('```'));
        const codeLines = codeEndIndex > index
          ? lines.slice(index + 1, codeEndIndex)
          : [];

        const codeBlocks = codeLines.length > 0
          ? [...newBlocks, createCodeBlock(codeLines.join('\n'))]
          : newBlocks;

        return {
          blocks: codeBlocks,
          currentSection: [],
          skipUntil: codeEndIndex
        };
      }

      // Quote
      if (line.startsWith('> ')) {
        const newBlocks = currentSection.length > 0
          ? [...blocks, createSectionBlock(currentSection.join('\n'))]
          : blocks;
        return {
          blocks: [...newBlocks, createContextBlock(line.substring(2))],
          currentSection: []
        };
      }

      // Empty line - section break
      if (line.trim() === '') {
        const newBlocks = currentSection.length > 0
          ? [...blocks, createSectionBlock(currentSection.join('\n'))]
          : blocks;
        return {
          blocks: newBlocks,
          currentSection: []
        };
      }

      // Regular text
      return {
        blocks,
        currentSection: [...currentSection, line]
      };
    },
    { blocks: [], currentSection: [] }
  );

  // Add remaining section
  return result.currentSection.length > 0
    ? [...result.blocks, createSectionBlock(result.currentSection.join('\n'))]
    : result.blocks;
}

/**
 * Create header block
 */
function createHeaderBlock(text) {
  return {
    type: 'header',
    text: {
      type: 'plain_text',
      text: text.substring(0, 150), // Slack limit
      emoji: true
    }
  };
}

/**
 * Create section block with markdown or rich text for lists
 */
function createSectionBlock(text) {
  // Check if text contains list items
  const hasListItems = text.split('\n').some(line => line.match(/^\s*[-*]\s+/));

  if (hasListItems) {
    // Use rich text block for proper list formatting
    return createRichTextBlock(text);
  }

  // Regular mrkdwn section for non-list content
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: text.substring(0, 3000) // Slack limit
    }
  };
}

/**
 * Create rich text block with proper list support
 */
function createRichTextBlock(text) {
  const elements = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.trim() === '') {
      // Empty line - add spacing
      elements.push({ type: 'br' });
      continue;
    }

    // Check if it's a list item
    const listMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (listMatch) {
      const content = listMatch[1];
      elements.push({
        type: 'rich_text_list',
        style: 'bullet',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: content
              }
            ]
          }
        ]
      });
    } else {
      // Regular text line
      elements.push({
        type: 'rich_text_section',
        elements: [
          {
            type: 'text',
            text: line
          }
        ]
      });
    }
  }

  return {
    type: 'rich_text',
    elements: elements
  };
}

/**
 * Create code block
 */
function createCodeBlock(code) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `\`\`\`\n${code}\n\`\`\``
    }
  };
}

/**
 * Create context block (for quotes, metadata)
 */
function createContextBlock(text) {
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `_${text}_`
      }
    ]
  };
}

/**
 * Format message with metadata + markdown content
 * @param {Object} options - { title, content, metadata, type }
 * @returns {Array} Slack blocks
 */
export function formatMessageWithMarkdown(options) {
  const { title, content, metadata = {}, type = 'default' } = options;

  const blocks = [];

  // Add header if title provided
  if (title) {
    blocks.push(createHeaderBlock(title));
  }

  // Add metadata context if provided
  if (metadata.author || metadata.url) {
    const contextText = [
      metadata.author ? `👤 ${metadata.author}` : '',
      metadata.url ? `<${metadata.url}|View>` : ''
    ].filter(Boolean).join(' • ');

    if (contextText) {
      blocks.push(createContextBlock(contextText));
    }
  }

  // Add divider
  if (title || Object.keys(metadata).length > 0) {
    blocks.push({ type: 'divider' });
  }

  // Convert markdown content to blocks
  const contentBlocks = markdownToBlocks(content);
  blocks.push(...contentBlocks);

  return blocks;
}

/**
 * Format MR Review with markdown
 */
export function formatMRReviewWithMarkdown(mrData, reviewMarkdown) {
  return formatMessageWithMarkdown({
    title: `🔍 MR Review: ${mrData.mr_title}`,
    content: reviewMarkdown,
    metadata: {
      author: mrData.author,
      url: mrData.mr_url
    }
  });
}

/**
 * Format Redmine action with markdown
 */
export function formatRedmineActionWithMarkdown(taskId, action, responseMarkdown) {
  const actionEmoji = {
    'log_time': '⏱️',
    'update_status': '🔄',
    'update_progress': '📊',
    'add_note': '💬'
  }[action] || '✅';

  return formatMessageWithMarkdown({
    title: `${actionEmoji} Task #${taskId}`,
    content: responseMarkdown
  });
}

/**
 * Format error with markdown
 */
export function formatErrorWithMarkdown(errorMessage) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ *Error*\n${errorMessage}`
      }
    }
  ];
}

/**
 * Format success with markdown
 */
export function formatSuccessWithMarkdown(successMessage) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ *Success*\n${successMessage}`
      }
    }
  ];
}
