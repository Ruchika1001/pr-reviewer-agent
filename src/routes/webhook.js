const { Router } = require("express");
const verifyWebhook = require("../middleware/verifyWebhook");
const handlePRLabeled = require("../handlers/prLabeled");
const handleCommentMention = require("../handlers/commentMention");

const router = Router();

router.post("/", verifyWebhook, (req, res) => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  // Respond immediately — GitHub expects a fast response
  res.status(200).json({ received: true });

  if (
    event === "pull_request" &&
    payload.action === "labeled" &&
    payload.label?.name === "sre-agent"
  ) {
    handlePRLabeled(payload).catch((err) =>
      console.error("prLabeled handler error:", err)
    );
    return;
  }

  if (
    event === "issue_comment" &&
    payload.action === "created" &&
    payload.issue?.pull_request &&
    /sre-agent/i.test(payload.comment?.body)
  ) {
    handleCommentMention(payload, "issue_comment").catch((err) =>
      console.error("commentMention handler error:", err)
    );
    return;
  }

  if (
    event === "pull_request_review_comment" &&
    payload.action === "created" &&
    /sre-agent/i.test(payload.comment?.body)
  ) {
    handleCommentMention(payload, "review_comment").catch((err) =>
      console.error("commentMention handler error:", err)
    );
    return;
  }
});

module.exports = router;
