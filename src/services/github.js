const { Octokit } = require("@octokit/rest");
const config = require("../config");

const octokit = new Octokit({ auth: config.githubToken });

async function getPRDiff(owner, repo, prNumber) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: "diff" },
  });
  return data;
}

async function getPRFiles(owner, repo, prNumber) {
  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });
  return data;
}

async function getPRDetails(owner, repo, prNumber) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });
  return {
    title: data.title,
    body: data.body || "",
    head: data.head.ref,
    base: data.base.ref,
    url: data.html_url,
  };
}

async function postReviewComments(owner, repo, prNumber, comments, summary) {
  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    body: summary,
    event: "COMMENT",
    comments: comments.map((c) => ({
      path: c.path,
      line: c.line,
      body: c.body,
    })),
  });
}

async function approvePR(owner, repo, prNumber, summary) {
  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    body: summary,
    event: "APPROVE",
  });
}

async function postComment(owner, repo, issueNumber, body) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}

async function getComment(owner, repo, commentId) {
  const { data } = await octokit.issues.getComment({
    owner,
    repo,
    comment_id: commentId,
  });
  return data;
}

module.exports = {
  getPRDiff,
  getPRFiles,
  getPRDetails,
  postReviewComments,
  approvePR,
  postComment,
  getComment,
};
