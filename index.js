const express = require("express");

const app = express();
const PORT = Number(process.env.PORT); // ← force Railway’s port

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "TenantAI API running",
    port: PORT,
    time: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TenantAI API listening on port ${PORT}`);
});
