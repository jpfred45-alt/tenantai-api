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
   RATE LIMIT CONFIG
========================= */
const RATE_LIMITS = {
  basic: { limit: 20, windowMs: 60000 },
  pro: { limit: 100, windowMs: 60000 }
};

const requestCounts = {};

/* =========================
   API KEY + RATE LIMIT MIDDLEWARE
========================= */
function requireApiKey(req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header"
    });
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();
  const tenant = API_KEYS[apiKey];

  if (!tenant) {
    return res.status(403).json({
      error: "Invalid API key"
    });
  }

  const now = Date.now();
  const tenantId = tenant.tenantId;
  const { limit, windowMs } = RATE_LIMITS[tenant.plan];

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
      plan: tenant.plan,
      limit,
      windowMs
    });
  }

  req.tenant = tenant;
  next();
}

/* =========================
   ROOT & HEALTH
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
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/* =========================
   API v1
========================= */
app.get("/api/v1/status", (req, res) => {
  res.json({
    api: "v1",
    status: "ok",
    timestamp: new Date().toISOString()
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
