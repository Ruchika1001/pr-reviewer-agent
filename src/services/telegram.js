import config from "../config.js";

const BASE_URL = `https://api.telegram.org/bot${config.telegramBotToken}`;

export async function sendMessage(text) {
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram sendMessage failed:", res.status, body);
    }
  } catch (err) {
    console.error("Telegram sendMessage error:", err);
  }
}

export async function notifyReviewStarted(prNumber, title, url) {
  await sendMessage(
    `🔍 Review started for PR #${prNumber}: ${title}\n${url}`
  );
}

export async function notifyReviewComplete(prNumber, approved) {
  const icon = approved ? "✅" : "💬";
  await sendMessage(`${icon} Review complete for PR #${prNumber}`);
}
