const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EmailNotifier = require("./notification-email");

const notifiers = {
  email: process.env.EMAIL_FROM
    ? new EmailNotifier(process.env.EMAIL_FROM, process.env.EMAIL_TO, process.env.EMAIL_SERVICE)
    : null,
};

app.post("/webhook", async (req, res) => {
  console.log("🔔 ALERT RECEIVED!");
  const alert = req.body;

  try {
    const analysis = await analyzeWithClaude(alert);
    const riskCalc = calculateRiskReward(alert.entry_price, alert.pattern_low);

    if (notifiers.email) {
      await notifiers.email.send({
        symbol: alert.symbol,
        pattern: alert.pattern,
        entry: riskCalc.entry,
        stopLoss: riskCalc.stopLoss,
        tp_1_2: riskCalc.tp_1_2,
        tp_1_3: riskCalc.tp_1_3,
        analysis: analysis,
        timeframe: alert.timeframe_setup,
      });
    }

    res.json({ status: "success" });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

async function analyzeWithClaude(alert) {
  const prompt = `Analyze this Wyckoff trading pattern:
Symbol: ${alert.symbol}
Pattern: ${alert.pattern}
Entry: $${alert.entry_price}
Pattern Low: ${alert.pattern_low}
Timeframe: ${alert.timeframe_setup}

Is this a good Phase C distribution setup? Keep response SHORT.`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text;
}

function calculateRiskReward(entry, patternLow) {
  const risk = entry - patternLow;
  return {
    entry: entry,
    stopLoss: patternLow,
    tp_1_2: parseFloat((entry + risk * 1.2).toFixed(2)),
    tp_1_3: parseFloat((entry + risk * 1.3).toFixed(2)),
  };
}

app.get("/health", (req, res) => {
  res.json({ status: "alive" });
});

app.post("/test", async (req, res) => {
  const testAlert = {
    symbol: "BTCUSD",
    pattern: "Double Top",
    entry_price: 65000,
    pattern_low: 63800,
    timeframe_setup: "4H_to_5M",
  };

  const analysis = await analyzeWithClaude(testAlert);
  const riskCalc = calculateRiskReward(testAlert.entry_price, testAlert.pattern_low);

  if (notifiers.email) {
    await notifiers.email.send({
      symbol: testAlert.symbol,
      pattern: testAlert.pattern,
      entry: riskCalc.entry,
      stopLoss: riskCalc.stopLoss,
      tp_1_2: riskCalc.tp_1_2,
      tp_1_3: riskCalc.tp_1_3,
      analysis: analysis,
      timeframe: testAlert.timeframe_setup,
    });
  }

  res.json({ status: "test_success" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("\n🤖 DARLA BOT STARTED");
  console.log(`✅ Server running on port ${PORT}\n`);
});