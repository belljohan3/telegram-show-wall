import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { initBot } from "./bot.js";
import { PhotoItem } from "./types.js";

const PORT = Number(process.env.PORT || 3005);
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN manquant dans .env");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.json());

// Fichiers statiques
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/", express.static(path.join(process.cwd(), "public")));

// Stores en mémoire (pour prod, remplacez par une DB)
let pending: PhotoItem[] = [];
let approved: PhotoItem[] = [];

// Sockets
io.on("connection", (socket) => {
  // Les écrans s'abonnent au flux approuvé
  socket.on("subscribe:screen", () => {
    socket.emit("approved:init", approved);
  });
  // L’admin s’abonne au flux pending
  socket.on("subscribe:admin", () => {
    socket.emit("pending:init", pending);
    socket.emit("approved:init", approved);
  });
});

// Helpers pour diffusion
function broadcastPending() {
  io.emit("pending:update", pending);
}
function broadcastApproved() {
  io.emit("approved:update", approved);
}

// Brancher le bot
initBot({
  token: TELEGRAM_BOT_TOKEN,
  publicBaseUrl: PUBLIC_BASE_URL,
  addPending: (item) => {
    pending.unshift(item);
    broadcastPending();
  },
});

// Sécurité simple pour admin
function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const token = req.header("x-admin-token");
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// API
app.get("/api/pending", requireAdmin, (_req, res) => res.json(pending));
app.get("/api/approved", (_req, res) => res.json(approved));

app.post("/api/approve/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = pending.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const item = pending.splice(idx, 1)[0];
  approved.unshift(item);
  broadcastPending();
  broadcastApproved();
  res.json({ ok: true, item });
});

app.post("/api/reject/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = pending.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  pending.splice(idx, 1);
  broadcastPending();
  res.json({ ok: true });
});

// Démarrage
server.listen(PORT, () => {
  console.log(`✅ Server on ${PUBLIC_BASE_URL}`);
  console.log(`➡️  Admin: ${PUBLIC_BASE_URL}/admin.html`);
  console.log(`➡️  Screen: ${PUBLIC_BASE_URL}/screen.html`);
});
