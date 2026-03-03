import Anthropic from "@anthropic-ai/sdk";
import config from "../config.js";
import {
  REVIEW_SYSTEM_PROMPT,
  REVIEW_TOOL,
  buildReviewUserPrompt,
  COMMENT_REPLY_SYSTEM_PROMPT,
  buildCommentReplyUserPrompt,
} from "../prompts/review.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const MODEL = "claude-sonnet-4-20250514";

export async function reviewPR({ title, body, diff, files }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: REVIEW_SYSTEM_PROMPT,
    tools: [REVIEW_TOOL],
    tool_choice: { type: "tool", name: "submit_review" },
    messages: [
      {
        role: "user",
        content: buildReviewUserPrompt({ title, body, diff, files }),
      },
    ],
  });

  // Extract the tool call result — guaranteed by tool_choice: { type: "tool" }
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (toolBlock) {
    return toolBlock.input;
  }

  // Fallback: shouldn't happen with forced tool use, but handle gracefully
  const textBlock = response.content.find((b) => b.type === "text");
  console.error(
    "Claude did not return a tool call, falling back to text:",
    textBlock?.text
  );
  return {
    comments: [],
    approve: false,
    summary: textBlock?.text || "Review failed — could not parse response.",
  };
}

export async function replyToComment({ comment, prTitle, prBody, diff }) {
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
