const MAX_DIFF_CHARS = 90000; // ~30k tokens, safe for Sonnet's 200k context

export const REVIEW_SYSTEM_PROMPT = `You are an expert SRE code reviewer. Your job is to review pull request diffs for:

- Security vulnerabilities (injection, auth issues, secrets in code, etc.)
- Reliability concerns (missing retries, no circuit breakers, single points of failure)
- Performance problems (N+1 queries, unbounded loops, missing pagination, memory leaks)
- Best practices violations (no input validation, poor error handling, missing logging)
- Potential outage risks (race conditions, missing timeouts, no graceful shutdown)
- Missing error handling (unhandled promise rejections, missing try/catch)

Rules:
- Only comment on real issues — do not nitpick style.
- Set "approve" to true only if there are no significant concerns.
- If there are no issues at all, return an empty comments array and set approve to true.
- "line" must be a line number that appears in the diff (a changed or added line).
- Use the submit_review tool to return your review.`;

export const REVIEW_TOOL = {
  name: "submit_review",
  description:
    "Submit a structured code review with inline comments, approval decision, and summary.",
  input_schema: {
    type: "object",
    properties: {
      comments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Relative file path from the diff",
            },
            line: {
              type: "integer",
              description: "Line number in the diff (must be a changed/added line)",
            },
            body: {
              type: "string",
              description: "Review comment in markdown",
            },
          },
          required: ["path", "line", "body"],
        },
        description: "Inline review comments on specific lines",
      },
      approve: {
        type: "boolean",
        description:
          "true if the PR has no significant concerns, false otherwise",
      },
      summary: {
        type: "string",
        description: "Concise overall summary of the review in markdown",
      },
    },
    required: ["comments", "approve", "summary"],
  },
};

function truncateDiff(diff) {
  if (diff.length <= MAX_DIFF_CHARS) return diff;
  const truncated = diff.slice(0, MAX_DIFF_CHARS);
  const lastNewline = truncated.lastIndexOf("\n");
  return (
    truncated.slice(0, lastNewline) +
    "\n\n... [diff truncated — exceeded size limit, review what's shown above] ..."
  );
}

function formatFileList(files) {
  return files
    .map(
      (f) =>
        `- \`${f.filename}\` (${f.status}, +${f.additions} -${f.deletions})`
    )
    .join("\n");
}

export function buildReviewUserPrompt({ title, body, diff, files }) {
  const fileSummary = formatFileList(files);
  const safeDiff = truncateDiff(diff);

  return `## Pull Request

**Title:** ${title}
**Description:** ${body || "(no description)"}

## Changed Files (${files.length} files)

${fileSummary}

## Diff

\`\`\`diff
${safeDiff}
\`\`\``;
}

export const COMMENT_REPLY_SYSTEM_PROMPT = `You are an expert SRE assistant embedded in a GitHub PR review. A developer has mentioned you in a comment and is asking for help. Reply concisely and helpfully. If the question relates to the PR diff, reference specific code. Use markdown formatting.`;

export function buildCommentReplyUserPrompt({ comment, prTitle, prBody, diff }) {
  const safeDiff = truncateDiff(diff);

  return `## PR Context

**Title:** ${prTitle}
**Description:** ${prBody || "(no description)"}

## Diff

\`\`\`diff
${safeDiff}
\`\`\`

## Developer Comment

${comment}

---

Reply to the developer's comment above.`;
}
