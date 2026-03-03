import * as github from "../services/github.js";
import * as claude from "../services/claude.js";
import * as telegram from "../services/telegram.js";

export default async function handlePRLabeled(payload) {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const prNumber = payload.pull_request.number;

  const prDetails = await github.getPRDetails(owner, repo, prNumber);

  // Notify Telegram that review has started
  await telegram.notifyReviewStarted(prNumber, prDetails.title, prDetails.url);

  // Fetch diff and file list in parallel
  const [diff, files] = await Promise.all([
    github.getPRDiff(owner, repo, prNumber),
    github.getPRFiles(owner, repo, prNumber),
  ]);

  console.log(
    `PR #${prNumber}: ${files.length} files changed, diff size ${diff.length} chars`
  );

  // Ask Claude to review (files used for summary, diff is auto-truncated if too large)
  const review = await claude.reviewPR({
    title: prDetails.title,
    body: prDetails.body,
    diff,
    files,
  });

  // Post review on the PR
  if (review.approve) {
    if (review.comments.length > 0) {
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
      await github.postComment(owner, repo, prNumber, review.summary);
    }
  }

  // Notify Telegram that review is complete
  await telegram.notifyReviewComplete(prNumber, review.approve);

  console.log(
    `Review complete for ${owner}/${repo}#${prNumber} — approved: ${review.approve}`
  );
}
