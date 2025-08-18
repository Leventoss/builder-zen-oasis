import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "../lib/database";

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
    isPremium: boolean;
    premiumExpiresAt?: string;
    discordId?: string;
    discordUsername?: string;
  };
  token?: string;
}

// Discord OAuth handler
export const handleDiscordAuth: RequestHandler = async (req, res) => {
  try {
    // Discord OAuth implementation will go here
    res.redirect('/api/auth/discord/callback');
  } catch (error) {
    console.error('Discord auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Discord giriş hatası'
    });
  }
};

// Discord OAuth callback
export const handleDiscordCallback: RequestHandler = async (req, res) => {
  try {
    // Discord OAuth callback implementation will go here
    res.redirect('/');
  } catch (error) {
    console.error('Discord callback error:', error);
    res.redirect('/?error=discord_auth_failed');
  }
};

// Login endpoint
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email ve şifre gerekli",
      } as AuthResponse);
    }

    // Find user by email
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz email veya şifre",
      } as AuthResponse);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz email veya şifre",
      } as AuthResponse);
    }

    // Create simple session token (in production, use JWT)
    const token = Buffer.from(
      `${user.id}:${user.email}:${Date.now()}`,
    ).toString("base64");

    res.json({
      success: true,
      message: "Giriş başarılı",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
        isPremium: user.is_premium || false,
        premiumExpiresAt: user.premium_expires_at,
        discordId: user.discord_id,
        discordUsername: user.discord_username,
      },
      token,
    } as AuthResponse);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    } as AuthResponse);
  }
};

// Register endpoint
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı adı, email ve şifre gerekli",
      } as AuthResponse);
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Bu email zaten kayıtlı",
      } as AuthResponse);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await createUser(username, email, passwordHash);

    // Create simple session token
    const token = Buffer.from(
      `${newUser.id}:${newUser.email}:${Date.now()}`,
    ).toString("base64");

    res.status(201).json({
      success: true,
      message: "Hesap başarıyla oluşturuldu",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.is_admin,
        isPremium: newUser.is_premium || false,
        premiumExpiresAt: newUser.premium_expires_at,
        discordId: newUser.discord_id,
        discordUsername: newUser.discord_username,
      },
      token,
    } as AuthResponse);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    } as AuthResponse);
  }
};

// Verify token endpoint
export const handleVerifyToken: RequestHandler = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token gerekli",
      } as AuthResponse);
    }

    // Decode token
    const decoded = Buffer.from(token, "base64").toString();
    const [userIdStr, email] = decoded.split(":");
    const userId = parseInt(userIdStr);

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz token",
      } as AuthResponse);
    }

    // Get user from database
    const user = await getUserByEmail(email);

    if (!user || user.id !== userId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz token",
      } as AuthResponse);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
        isPremium: user.is_premium || false,
        premiumExpiresAt: user.premium_expires_at,
        discordId: user.discord_id,
        discordUsername: user.discord_username,
      },
    } as AuthResponse);
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    } as AuthResponse);
  }
};
