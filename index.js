import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 8080;

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
  },
  "sk_tenant_002_test": {
    tenantId: "tenant_002",
    name: "Blue Ridge Rentals",
    plan: "basic"
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

  const apiKey = authHeader.replace("Bearer ", "").trim();
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
  notify_tenant: { allowed: true, requiresApproval: false },
  generate_letter: { allowed: true, requiresApproval: false },
  initiate_eviction: { allowed: true, requiresApproval: true },
  access_financials: { allowed: true, requiresApproval: true },
  delete_records: { allowed: false }
};

/* =========================
   APPROVAL STORE
========================= */
const approvals = {};

/* =========================
   INTENT CLASSIFIER
========================= */
function classifyIntent(command) {
  const text = command.toLowerCase();

  if (text.includes("notify")) return "notify_tenant";
  if (text.includes("letter")) return "generate_letter";
  if (text.includes("evict")) return "initiate_eviction";
  if (text.includes("financial")) return "access_financials";
  if (text.includes("delete")) return "delete_records";

  return "unknown";
}

/* =========================
   ACTION EXECUTOR
========================= */
function executeAction(intent, tenant) {
  return {
    success: true,
    intent,
    tenant: tenant.tenantId
  };
}

/* =========================
   COMMAND ENDPOINT
========================= */
app.post("/command", requireApiKey, (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  const intent = classifyIntent(command);
  const policy = POLICY[intent];

  if (!policy || policy.allowed === false) {
    return res.status(403).json({
      status: "blocked",
      intent,
      reason: "Action not permitted by policy"
    });
  }

  if (policy.requiresApproval) {
    const approvalId = Date.now().toString();

    approvals[approvalId] = {
      intent,
      tenant: req.tenant,
      createdAt: new Date().toISOString()
    };

    return res.json({
      pendingApproval: true,
      approvalId,
      intent
    });
  }

  const result = executeAction(intent, req.tenant);
  res.json(result);
});

/* =========================
   LIST APPROVALS
========================= */
app.get("/approvals", requireApiKey, (req, res) => {
  res.json(
