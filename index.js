const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());
// -------------------------
// Tenant identification middleware
// -------------------------
function requireTenant(req, res, next) {
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
app.get("/api/v1/tenants", requireTenant, (req, res) => {
  res.status(200).json({
requestedBy: req.tenantId,
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
-------------------------- */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TenantAI API listening on port ${PORT}`);
});
