const express = require("express");
const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());

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
   API KEYS (MOCK – REPLACE LATER)
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
   AUTH MIDDLEWARE (HARD GATE)
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
   POLICY ENGINE (SOURCE OF TRUTH)
========================= */
/* =========================
   APPROVAL STORE (v1 - in memory)
========================= */
const approvals = {};
const POLICY = {
  notify_tenant: {
    allowed: true,
    requiresApproval: false
  },
  generate_letter: {
    allowed: true,
    requiresApproval: false
  },
  initiate_eviction: {
    allowed: true,
    requiresApproval: true
  },
  access_financials: {
    allowed: true,
    requiresApproval: true
  },
  delete_records: {
    allowed: false
  }
};

/* =========================
   INTENT CLASSIFIER (v1)
========================= */
function classifyIntent(command) {
  const text = command.toLowerCase();

  if (text.includes("late rent") || text.includes("notify")) {
    return "notify_tenant";
  }

  if (text.includes("letter")) {
    return "generate_letter";
  }

  if (text.includes("evict")) {
    return "initiate_eviction";
  }

  if (text.includes("financial") || text.includes("bank")) {
    return "access_financials";
  }

  if (text.includes("delete")) {
    return "delete_records";
  }

  return "unknown";
}
/* =========================
   EXECUTION ENGINE (v1)
========================= */
function executeAction(intent, context, tenant) {
  switch (intent) {

    case "notify_tenant":
      return {
        success: true,
        action: intent,
message: `Tenant ${tenant.name} notified`
      };

    case "generate_letter":
      return {
        success: true,
        action: intent,
        message: "Letter generated"
      };

    case "initiate_eviction":
      return {
        success: true,
        action: intent,
        message: "Eviction process initiated"
      };

    case "access_financials":
      return {
        success: true,
        action: intent,
        message: "Financials accessed"
      };

    default:
      return {
        success: false,
        error: "Unknown or unsupported action"
      };
  }
}
/* =========================
   COMMAND GATEWAY
========================= */
app.post("/command", requireApiKey, (req, res) => {
  const { command, context } = req.body;

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

  res.json({
    received: true,
    tenant: req.tenant.tenantId,
    intent,
    context: context || {},
    requiresApproval: policy.requiresApproval || false,
    status: policy.requiresApproval ? "pending_approval" : "approved",
    nextStep: policy.requiresApproval
      ? "await_human_approval"
      : "ready_for_execution"
  });
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`TenantAI API listening on port ${PORT}`);
});
