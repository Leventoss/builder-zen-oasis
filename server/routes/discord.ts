import { RequestHandler } from 'express';

// Discord OAuth configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:8080/api/auth/discord/callback';

// Discord OAuth URL
export const handleDiscordLogin: RequestHandler = async (req, res) => {
  try {
    if (!DISCORD_CLIENT_ID) {
      return res.status(500).json({
        error: 'Discord OAuth is not configured. Please set DISCORD_CLIENT_ID.'
      });
    }

    const discordAuthURL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email`;
    
    res.redirect(discordAuthURL);
  } catch (error) {
    console.error('Discord login error:', error);
    res.status(500).json({
      error: 'Discord login failed'
    });
  }
};

// Discord OAuth callback
export const handleDiscordCallback: RequestHandler = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect('/?error=discord_auth_failed');
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      console.error('Discord OAuth not configured');
      return res.redirect('/?error=discord_config_missing');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('Failed to get Discord access token:', tokenData);
      return res.redirect('/?error=discord_token_failed');
    }

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const discordUser = await userResponse.json();
    
    if (!discordUser.id) {
      console.error('Failed to get Discord user info:', discordUser);
      return res.redirect('/?error=discord_user_failed');
    }

    // For now, just redirect with user info
    // In a full implementation, you would:
    // 1. Check if user exists in database with this Discord ID
    // 2. If not, create a new user account
    // 3. Generate JWT token
    // 4. Set authentication cookies/tokens
    
    const userInfo = {
      id: discordUser.id,
      username: discordUser.username,
      email: discordUser.email,
      avatar: discordUser.avatar,
    };

    // For demo purposes, redirect with success
    res.redirect(`/?discord_auth=success&user=${encodeURIComponent(JSON.stringify(userInfo))}`);
    
  } catch (error) {
    console.error('Discord callback error:', error);
    res.redirect('/?error=discord_callback_failed');
  }
};

// Get Discord configuration info
export const getDiscordConfig: RequestHandler = async (req, res) => {
  try {
    res.json({
      configured: !!DISCORD_CLIENT_ID,
      clientId: DISCORD_CLIENT_ID || null,
      redirectUri: DISCORD_REDIRECT_URI,
      authUrl: DISCORD_CLIENT_ID ? 
        `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email` 
        : null
    });
  } catch (error) {
    console.error('Get Discord config error:', error);
    res.status(500).json({ error: 'Failed to get Discord configuration' });
  }
};
