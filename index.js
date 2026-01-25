import express from "express";

const app = express();
const PORT = 8080;

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
  res.json({ status: "TenantAI API running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/command", (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  res.json({
    approved: true,
    command
  });
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke" });
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
