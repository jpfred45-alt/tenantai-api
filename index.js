import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());
app.use("/admin", express.static(path.join(__dirname, "admin")));

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "TenantAI API running",
    time: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

/* =========================
   API KEYS (MOCK)
========================= */
const API_KEYS = {
  "sk_tenant_001_test": {
    tenantId: "tenant_001",
    name: "Acme Property Group",
    plan: "pro"
  }
};

/* =========================
   AUTH MIDDLEWARE
========================= */
function requireApiKey(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid API key" });
  }

  const apiKey = authHeader.replace("Bearer ", "");
  const tenant = API_KEYS[apiKey];

  if (!tenant) {
    return res.status(403).json({ error: "Unauthorized API key" });
  }

  req.tenant = tenant;
  next();
}

/* =========================
   POLICY
========================= */
const POLICY = {
  notify_tenant: true,
  generate_letter: true,
  initiate_eviction: false,
  delete_records: false
};

/* =========================
   COMMAND ROUTE
========================= */
app.post("/command", requireApiKey, (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  const text = command.toLowerCase();

  let intent = "unknown";
  if (text.includes("notify")) intent = "notify_tenan_
