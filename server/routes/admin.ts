import { RequestHandler } from "express";
import {
  getAllUsers,
  getUserStats,
  getAdminNotifications,
  markNotificationRead,
  createNotification,
  sql,
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
      message: "Bildirim olu��turulamadı",
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

// Delete user (Admin only)
export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz kullanıcı ID",
      });
    }

    // Get user info before deleting
    const userInfo = await sql`
      SELECT username, email FROM users WHERE id = ${userId} LIMIT 1
    `;

    if (userInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı",
      });
    }

    // Delete related data first
    await sql`DELETE FROM user_lists WHERE user_id = ${userId}`;
    await sql`DELETE FROM watch_progress WHERE user_id = ${userId}`;

    // Delete user
    await sql`DELETE FROM users WHERE id = ${userId}`;

    // Create notification
    await createNotification(
      "Kullanıcı Silindi",
      `${userInfo[0].username} (${userInfo[0].email}) hesabı silindi`,
      "info",
    );

    res.json({
      success: true,
      message: "Kullanıcı başarıyla silindi",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Kullanıcı silme hatası",
    });
  }
};

// Update user role/permissions (Admin only)
export const handleUpdateUserRole: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin, isPremium } = req.body;
    const userId = parseInt(id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz kullanıcı ID",
      });
    }

    // Update user role
    const updatedUser = await sql`
      UPDATE users SET
        is_admin = ${isAdmin !== undefined ? isAdmin : sql`is_admin`},
        is_premium = ${isPremium !== undefined ? isPremium : sql`is_premium`},
        premium_expires_at = ${isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : sql`premium_expires_at`},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id, username, email, is_admin, is_premium, premium_expires_at
    `;

    if (updatedUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı",
      });
    }

    // Create notification
    const roleChanges = [];
    if (isAdmin !== undefined) roleChanges.push(`Admin: ${isAdmin ? 'Evet' : 'Hayır'}`);
    if (isPremium !== undefined) roleChanges.push(`Premium: ${isPremium ? 'Evet' : 'Hayır'}`);

    await createNotification(
      "Kullanıcı Güncellendi",
      `${updatedUser[0].username} rolü güncellendi: ${roleChanges.join(', ')}`,
      "info",
    );

    res.json({
      success: true,
      message: "Kullanıcı rolü güncellendi",
      data: {
        id: updatedUser[0].id.toString(),
        username: updatedUser[0].username,
        email: updatedUser[0].email,
        isAdmin: updatedUser[0].is_admin,
        isPremium: updatedUser[0].is_premium,
        premiumExpiresAt: updatedUser[0].premium_expires_at,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Kullanıcı rolü güncellenemedi",
    });
  }
};

// Create new user (Admin only)
export const handleCreateUser: RequestHandler = async (req, res) => {
  try {
    const { username, email, password, isAdmin, isPremium } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı adı, email ve şifre gerekli",
      });
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1
    `;

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Bu email veya kullanıcı adı zaten kullanımda",
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await sql`
      INSERT INTO users (username, email, password_hash, is_admin, is_premium, premium_expires_at)
      VALUES (
        ${username},
        ${email},
        ${passwordHash},
        ${isAdmin || false},
        ${isPremium || false},
        ${isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null}
      )
      RETURNING id, username, email, is_admin, is_premium, premium_expires_at, created_at
    `;

    // Create notification
    await createNotification(
      "Yeni Kullanıcı",
      `${username} (${email}) hesabı oluşturuldu`,
      "success",
    );

    res.status(201).json({
      success: true,
      message: "Kullanıcı başarıyla oluşturuldu",
      data: {
        id: newUser[0].id.toString(),
        username: newUser[0].username,
        email: newUser[0].email,
        isAdmin: newUser[0].is_admin,
        isPremium: newUser[0].is_premium,
        premiumExpiresAt: newUser[0].premium_expires_at,
        createdAt: newUser[0].created_at,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Kullanıcı oluşturulamadı",
    });
  }
};
