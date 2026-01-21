const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());
// -------------------------
// API key authentication middleware
// -------------------------
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
// -------------------------
// Rate limiting config
// -------------------------
const RATE_LIMITS = {
  basic: { limit: 20, windowMs: 60000 },
  pro: { limit: 100, windowMs: 60000 }
};

const requestCounts = {};

  function requireApiKey(req, res, next) {
  const authHeader = req.header("Authorization");

  // 1. Validate Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header"
    });
  }

  // 2. Extract API key
  const apiKey = authHeader.replace("Bearer ", "").trim();
  const tenant = API_KEYS[apiKey];

  // 3. Validate API key
  if (!tenant) {
    return res.status(403).json({
      error: "Invalid API key"
    });
  }

  // 4. Rate limiting per tenant
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
  // 5. Attach tenant context
  req.tenant = tenant;
  next();
}

  req.tenant = tenant;
  next();
}

  const tenantId = req.header("X-Tenant-ID");

  if (!tenantId) {
    return res.status(400).json({
      error: "Missing X-Tenant-ID header"
    });
  }

  // Mock tenant validation for now
  const allowedTenants = ["tenant_001", "tenant_002"];

  if (!allowedTenants.includes(tenantId)) {
    return res.status(403).json({
      error: "Invalid tenant"
    });
  }

  // Attach tenant to request for later use
  req.tenantId = tenantId;
  next();
}
/* -------------------------
   Root & health
-------------------------- */
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
app.get("/api/v1/tenants", requireApiKey, (req, res) => {
  res.status(200).json({
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
/* -------------------------
   API v1
-------------------------- */
app.get("/api/v1/status", (req, res) => {
  res.status(200).json({
    api: "v1",
    status: "ok",
    service: "tenantai-api",
    timestamp: new Date().toISOString()
  });
});

/* -------------------------
   Start server
