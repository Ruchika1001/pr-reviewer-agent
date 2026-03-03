const express = require("express");
const config = require("./config");
const webhookRouter = require("./routes/webhook");

const app = express();

// Raw body needed for webhook signature verification — must come before json parser
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/webhook", webhookRouter);

app.listen(config.port, () => {
  console.log(`github-pr-agent listening on port ${config.port}`);
});
