const github = require("../services/github");
const claude = require("../services/claude");

async function handleCommentMention(payload, eventType) {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const commentBody = payload.comment.body;

  // Determine PR number based on event type
  const prNumber =
    eventType === "issue_comment"
      ? payload.issue.number
      : payload.pull_request.number;

  // Fetch PR context
  const [prDetails, diff] = await Promise.all([
    github.getPRDetails(owner, repo, prNumber),
    github.getPRDiff(owner, repo, prNumber),
  ]);

  // Ask Claude to reply
  const reply = await claude.replyToComment({
    comment: commentBody,
    prTitle: prDetails.title,
    prBody: prDetails.body,
    diff,
  });

  // Post reply on the PR
  await github.postComment(owner, repo, prNumber, reply);

  console.log(
    `Replied to comment on ${owner}/${repo}#${prNumber}`
  );
}

module.exports = handleCommentMention;
