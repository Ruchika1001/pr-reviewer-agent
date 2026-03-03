import crypto from "crypto";
import config from "../config.js";

export default function verifyWebhook(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    return res.status(401).json({ error: "Missing signature" });
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", config.githubWebhookSecret)
      .update(req.rawBody)
      .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}
