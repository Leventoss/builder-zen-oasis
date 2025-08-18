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
    const clientId = process.env.DISCORD_CLIENT_ID;
    // Use current domain for redirect URI
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const host = req.get("host");
    const redirectUri = `${protocol}://${host}/api/auth/discord/callback`;

    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: "Discord OAuth is not configured. Please set DISCORD_CLIENT_ID.",
      });
    }

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email&prompt=consent`;

    res.redirect(discordAuthUrl);
  } catch (error) {
    console.error("Discord auth error:", error);
    res.status(500).json({
      success: false,
      message: "Discord giriş hatası",
    });
  }
};

// Discord OAuth callback
export const handleDiscordCallback: RequestHandler = async (req, res) => {
  try {
    const { code } = req.query;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const protocol = req.get("x-forwarded-proto") || req.protocol;
    const host = req.get("host");
    const redirectUri = `${protocol}://${host}/api/auth/discord/callback`;

    if (!code || !clientId || !clientSecret) {
      return res.redirect("/?error=discord_auth_failed");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.redirect("/?error=discord_auth_failed");
    }

    // Get user info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    if (!discordUser.id) {
      return res.redirect("/?error=discord_auth_failed");
    }

    // Check if user exists in our database
    let user = await getUserByEmail(discordUser.email);

    if (!user) {
      // Create new user with Discord info
      const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
      user = await createUser(
        discordUser.username ||
          discordUser.global_name ||
          `discord_${discordUser.id}`,
        discordUser.email,
        passwordHash,
        discordUser.id,
        discordUser.username,
      );
    }

    // Create session token
    const token = Buffer.from(
      `${user.id}:${user.email}:${Date.now()}`,
    ).toString("base64");

    // Redirect with token in URL (in production, use secure cookie)
    res.redirect(`/?discord_auth=success&token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error("Discord callback error:", error);
    res.redirect("/?error=discord_auth_failed");
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
