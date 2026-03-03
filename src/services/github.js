import { Octokit } from "@octokit/rest";
import config from "../config.js";

const octokit = new Octokit({ auth: config.githubToken });

export async function getPRDiff(owner, repo, prNumber) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: "diff" },
  });
  return data;
}

export async function getPRFiles(owner, repo, prNumber) {
  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });
  return data;
}

export async function getPRDetails(owner, repo, prNumber) {
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

export async function postReviewComments(owner, repo, prNumber, comments, summary) {
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

export async function approvePR(owner, repo, prNumber, summary) {
  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    body: summary,
    event: "APPROVE",
  });
}

export async function postComment(owner, repo, issueNumber, body) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}

export async function getComment(owner, repo, commentId) {
  const { data } = await octokit.issues.getComment({
    owner,
    repo,
    comment_id: commentId,
  });
  return data;
}
