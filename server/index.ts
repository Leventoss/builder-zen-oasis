import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import bcrypt from "bcryptjs";
import { sql } from "./lib/database";

// Import new API routes
import { handleLogin, handleRegister, handleVerifyToken } from "./routes/auth";
import {
  handleGetAnimes,
  handleGetAnime,
  handleCreateAnime,
  handleUpdateAnime,
  handleDeleteAnime,
  handleAddEpisode,
} from "./routes/anime";
import {
  handleGetStats,
  handleGetUsers,
  handleGetNotifications,
  handleMarkNotificationRead,
  handleCreateNotification,
  handleClearNotifications,
} from "./routes/admin";
import {
  handleGetWatchProgress,
  handleUpdateWatchProgress,
  handleGetUserList,
  handleAddToUserList,
  handleRemoveFromUserList,
} from "./routes/user";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/verify", handleVerifyToken);

  // Anime routes
  app.get("/api/animes", handleGetAnimes);
  app.get("/api/animes/:id", handleGetAnime);
  app.post("/api/animes", handleCreateAnime);
  app.put("/api/animes/:id", handleUpdateAnime);
  app.delete("/api/animes/:id", handleDeleteAnime);
  app.post("/api/animes/:id/episodes", handleAddEpisode);

  // Admin routes
  app.get("/api/admin/stats", handleGetStats);
  app.get("/api/admin/users", handleGetUsers);
  app.get("/api/admin/notifications", handleGetNotifications);
  app.put("/api/admin/notifications/:id/read", handleMarkNotificationRead);
  app.post("/api/admin/notifications", handleCreateNotification);
  app.delete("/api/admin/notifications", handleClearNotifications);

  // User routes
  app.get("/api/users/:userId/progress", handleGetWatchProgress);
  app.put("/api/users/:userId/progress", handleUpdateWatchProgress);
  app.get("/api/users/:userId/list/:listType", handleGetUserList);
  app.post("/api/users/:userId/list", handleAddToUserList);
  app.delete("/api/users/:userId/list", handleRemoveFromUserList);

  // Admin setup endpoint - for initial setup only
  app.post("/api/setup/admin", async (req, res) => {
    try {
      const { email = "admin@aniwa.com", password = "admin123", username = "admin" } = req.body;

      // Check if any admin exists
      const existingAdmin = await sql`SELECT * FROM users WHERE is_admin = true LIMIT 1`;

      if (existingAdmin.length > 0) {
        return res.json({
          success: false,
          message: "Admin kullanıcı zaten mevcut",
          admin: existingAdmin[0]
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create admin user
      const adminUser = await sql`
        INSERT INTO users (username, email, password_hash, is_admin)
        VALUES (${username}, ${email}, ${passwordHash}, true)
        RETURNING id, username, email, is_admin
      `;

      res.json({
        success: true,
        message: "Admin kullanıcı oluşturuldu",
        admin: adminUser[0],
        loginCredentials: { email, password }
      });
    } catch (error) {
      console.error("Admin creation error:", error);
      res.status(500).json({ success: false, message: "Admin oluşturma hatası" });
    }
  });

  // Database status endpoint
  app.get("/api/debug/database", async (req, res) => {
    try {
      const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;

      const users = await sql`SELECT id, username, email, is_admin FROM users`;
      const animes = await sql`SELECT id, title, title_en, rating, year FROM animes`;

      res.json({
        success: true,
        tables: tables.map(t => t.table_name),
        users: users,
        animes: animes,
        counts: {
          users: users.length,
          animes: animes.length
        }
      });
    } catch (error) {
      console.error("Database check error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return app;
}
