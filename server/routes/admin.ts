import { RequestHandler } from "express";
import {
  getAllUsers,
  getUserStats,
  getAdminNotifications,
  markNotificationRead,
  createNotification,
} from "../lib/database";

// Get admin dashboard stats
export const handleGetStats: RequestHandler = async (req, res) => {
  try {
    const stats = await getUserStats();

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(stats.total_users || "0"),
        totalAnimes: parseInt(stats.total_animes || "0"),
        totalEpisodes: parseInt(stats.total_episodes || "0"),
        todayWatches: parseInt(stats.today_watches || "0"),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "İstatistikler alınamadı",
    });
  }
};

// Get all users (Admin only)
export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    const users = await getAllUsers();

    const transformedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      isPremium: user.is_premium || false,
      premiumExpiresAt: user.premium_expires_at,
      discordId: user.discord_id,
      discordUsername: user.discord_username,
      createdAt: user.created_at,
    }));

    res.json({
      success: true,
      data: transformedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Kullanıcı listesi alınamadı",
    });
  }
};

// Get admin notifications
export const handleGetNotifications: RequestHandler = async (req, res) => {
  try {
    const notifications = await getAdminNotifications();

    const transformedNotifications = notifications.map((notif) => ({
      id: notif.id.toString(),
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read,
      timestamp: notif.created_at,
    }));

    res.json({
      success: true,
      data: transformedNotifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Bildirimler alınamadı",
    });
  }
};

// Mark notification as read
export const handleMarkNotificationRead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz bildirim ID",
      });
    }

    await markNotificationRead(notificationId);

    res.json({
      success: true,
      message: "Bildirim okundu olarak işaretlendi",
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      message: "Bildirim güncellenemedi",
    });
  }
};

// Create new notification (Admin only)
export const handleCreateNotification: RequestHandler = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Başlık ve mesaj gerekli",
      });
    }

    const notification = await createNotification(
      title,
      message,
      type || "info",
    );

    res.status(201).json({
      success: true,
      message: "Bildirim oluşturuldu",
      data: {
        id: notification.id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        timestamp: notification.created_at,
      },
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Bildirim oluşturulamadı",
    });
  }
};

// Clear all notifications
export const handleClearNotifications: RequestHandler = async (req, res) => {
  try {
    // Mark all notifications as read
    await markNotificationRead(0); // This will mark all as read in our implementation

    res.json({
      success: true,
      message: "Tüm bildirimler temizlendi",
    });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Bildirimler temizlenemedi",
    });
  }
};
