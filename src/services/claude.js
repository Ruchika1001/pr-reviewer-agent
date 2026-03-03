const Anthropic = require("@anthropic-ai/sdk");
const config = require("../config");
const {
  REVIEW_SYSTEM_PROMPT,
  buildReviewUserPrompt,
  COMMENT_REPLY_SYSTEM_PROMPT,
  buildCommentReplyUserPrompt,
} = require("../prompts/review");

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const MODEL = "claude-sonnet-4-20250514";

async function reviewPR({ title, body, diff, files }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: REVIEW_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildReviewUserPrompt({ title, body, diff }) },
    ],
  });

  const text = response.content[0].text;

  try {
    return JSON.parse(text);
  } catch {
    console.error("Failed to parse Claude review response:", text);
    return {
      comments: [],
      approve: false,
      summary: text,
    };
  }
}

async function replyToComment({ comment, prTitle, prBody, diff }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: COMMENT_REPLY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildCommentReplyUserPrompt({
          comment,
          prTitle,
          prBody,
          diff,
        }),
      },
    ],
  });

  return response.content[0].text;
}

module.exports = { reviewPR, replyToComment };
