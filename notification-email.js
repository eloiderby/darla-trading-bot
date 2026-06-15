const nodemailer = require("nodemailer");

class EmailNotifier {
  constructor(fromEmail, toEmail, service = "gmail") {
    this.fromEmail = fromEmail;
    this.toEmail = toEmail;
    this.service = service;
    
    this.transporter = nodemailer.createTransport({
      service: service,
      auth: {
        user: fromEmail,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(data) {
    const htmlContent = this.formatHtmlEmail(data);
    
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: this.toEmail,
        subject: `🎯 DARLA BOT: ${data.pattern} on ${data.symbol}`,
        html: htmlContent,
      });
      console.log("✅ Email sent!");
    } catch (error) {
      console.error("❌ Email error:", error.message);
      throw error;
    }
  }

  formatHtmlEmail(data) {
    const risk = (data.entry - data.stopLoss).toFixed(2);
    const profit_1_2 = (data.tp_1_2 - data.entry).toFixed(2);
    const profit_1_3 = (data.tp_1_3 - data.entry).toFixed(2);

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
    .container { background-color: white; border-radius: 10px; padding: 30px; max-width: 600px; margin: 0 auto; }
    .section { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #2196F3; }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="color: #2196F3;">🎯 DARLA BOT - TRADE ALERT</h1>
    
    <div class="section">
      <h3>📊 Trade Setup</h3>
      <p><b>Symbol:</b> ${data.symbol}</p>
      <p><b>Pattern:</b> ${data.pattern}</p>
      <p><b>Timeframe:</b> ${data.timeframe}</p>
    </div>

    <div class="section">
      <h3>💰 Entry Setup</h3>
      <p><b>Entry:</b> $${data.entry}</p>
      <p><b>Stop Loss:</b> $${data.stopLoss}</p>
      <p><b>Risk:</b> $${risk}</p>
    </div>

    <div class="section">
      <h3>🎯 Targets</h3>
      <p><b>TP 1 (1:1.2):</b> $${data.tp_1_2} (+$${profit_1_2})</p>
      <p><b>TP 2 (1:1.3):</b> $${data.tp_1_3} (+$${profit_1_3})</p>
    </div>

    <div class="section">
      <h3>🧠 Analysis</h3>
      <p>${data.analysis.substring(0, 500)}</p>
    </div>

    <p style="color: #999; font-size: 12px;">Darla Wyckoff Trading Bot | Powered by Claude AI</p>
  </div>
</body>
</html>
`;
  }
}

module.exports = EmailNotifier;