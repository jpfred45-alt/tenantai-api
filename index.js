const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());

/* =========================
   API KEYS (mock)
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
   RATE LIMITING CONFIG
========================= */
const RATE_LIMITS = {
  basic: { limit: 20, windowMs: 60_000 },
  pro: { limit: 100, windowMs: 60_000 }
};

const requestCounts = {};

/* =========================
   API KEY MIDDLEWARE
========================= */
function requireApiKey(req, res, next) {
  const authHeader = req.header("Authorization");

  // Validate Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header"
    });
  }

  // Extract API key
  const apiKey = authHeader.replace("Bearer ", "").trim();
  const tenant = API_KEYS[apiKey];

  // Validate API key
  if (!tenant) {
    return res.status(403).json({
      error: "Invalid API key"
    });
  }

  // Rate limiting per tenant
  const now = Date.now();
  const tenantId = tenant.tenantId;
  const plan = tenant.plan;
  const { limit, windowMs } = RATE_LIMITS[plan];

  if (!requestCounts[tenantId]) {
    requestCounts[tenantId] = { count: 1, start: now };
  } else {
    const elapsed = now - requestCounts[tenantId].start;

    if (elapsed > windowMs) {
      requestCounts[tenantId] = { count: 1, start: now };
    } else {
      requestCounts[tenantId].count += 1;
    }
  }

  if (requestCounts[tenantId].count > limit) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      plan,
      limit,
      windowMs
    });
  }

  // Attach tenant context
  req.tenant = tenant;
  next();
}

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "TenantAI API running",
    time: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "tenantai-api",
    uptime: process.uptime()
  });
});

app.get("/api/v1/status", (req, res) => {
  res.json({
    api: "v1",
    status: "ok"
  });
});

app.get("/api/v1/tenants", requireApiKey, (req, res) => {
  res.json({
    requestedBy: req.tenant.tenantId,
    plan: req.tenant.plan,
    tenants: [
      {
        tenantId: "tenant_001",
        name: "Acme Property Group",
        status: "active",
        plan: "pro"
      },
      {
        tenantId: "tenant_002",
        name: "Blue Ridge Rentals",
        status: "trial",
        plan: "basic"
      }
    ],
    count: 2,
    timestamp: new Date().toISOString()
  });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TenantAI API listening on port ${PORT}`);
});
