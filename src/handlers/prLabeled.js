const github = require("../services/github");
const claude = require("../services/claude");
const telegram = require("../services/telegram");

async function handlePRLabeled(payload) {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const prNumber = payload.pull_request.number;

  const prDetails = await github.getPRDetails(owner, repo, prNumber);

  // Notify Telegram that review has started
  await telegram.notifyReviewStarted(prNumber, prDetails.title, prDetails.url);

  // Fetch diff and file list
  const [diff, files] = await Promise.all([
    github.getPRDiff(owner, repo, prNumber),
    github.getPRFiles(owner, repo, prNumber),
  ]);

  // Ask Claude to review
  const review = await claude.reviewPR({
    title: prDetails.title,
    body: prDetails.body,
    diff,
    files,
  });

  // Post review on the PR
  if (review.approve) {
    if (review.comments.length > 0) {
      // Approve with inline comments
      await github.postReviewComments(
        owner,
        repo,
        prNumber,
        review.comments,
        review.summary
      );
    }
    await github.approvePR(owner, repo, prNumber, review.summary);
  } else {
    if (review.comments.length > 0) {
      await github.postReviewComments(
        owner,
        repo,
        prNumber,
        review.comments,
        review.summary
      );
    } else {
      // No inline comments but not approving — post summary as a regular comment
      await github.postComment(owner, repo, prNumber, review.summary);
    }
  }

  // Notify Telegram that review is complete
  await telegram.notifyReviewComplete(prNumber, review.approve);

  console.log(
    `Review complete for ${owner}/${repo}#${prNumber} — approved: ${review.approve}`
  );
}

module.exports = handlePRLabeled;
