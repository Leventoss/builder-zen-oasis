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

  return app;
}
