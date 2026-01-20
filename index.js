const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 8080;


app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "TenantAI API running",
    port: PORT,
    time: new Date().toISOString()
  });
});
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "tenantai-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TenantAI API listening on port ${PORT}`);
});
