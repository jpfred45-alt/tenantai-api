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
func
