import { RequestHandler } from 'express';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

// Get premium settings
export const getPremiumSettings: RequestHandler = async (req, res) => {
  try {
    // For now, return default settings. In production, store in database
    const settings = {
      chatAccess: 'both',
      enabled: true
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Get premium settings error:', error);
    res.status(500).json({ error: 'Failed to get premium settings' });
  }
};

// Update premium settings
export const updatePremiumSettings: RequestHandler = async (req, res) => {
  try {
    const { chatAccess, enabled } = req.body;
    
    // In production, save to database
    // For now, just return success
    
    res.json({ success: true, message: 'Premium settings updated' });
  } catch (error) {
    console.error('Update premium settings error:', error);
    res.status(500).json({ error: 'Failed to update premium settings' });
  }
};

// Get all users for admin
export const getUsers: RequestHandler = async (req, res) => {
  try {
    const users = await sql`
      SELECT id, username, email, is_admin, is_premium, premium_expires_at, 
             discord_id, discord_username, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Update user premium status
export const updateUserPremium: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPremium, expiryDate } = req.body;
    
    await sql`
      UPDATE users 
      SET is_premium = ${isPremium}, 
          premium_expires_at = ${expiryDate || null}
      WHERE id = ${userId}
    `;
    
    res.json({ success: true, message: 'User premium status updated' });
  } catch (error) {
    console.error('Update user premium error:', error);
    res.status(500).json({ error: 'Failed to update user premium status' });
  }
};

// Grant premium to user
export const grantPremium: RequestHandler = async (req, res) => {
  try {
    const { userId, duration } = req.body; // duration in days, 0 for lifetime
    
    let expiryDate = null;
    if (duration > 0) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);
    }
    
    await sql`
      UPDATE users 
      SET is_premium = true, 
          premium_expires_at = ${expiryDate}
      WHERE id = ${userId}
    `;
    
    res.json({ success: true, message: 'Premium granted successfully' });
  } catch (error) {
    console.error('Grant premium error:', error);
    res.status(500).json({ error: 'Failed to grant premium' });
  }
};

// Revoke premium from user
export const revokePremium: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await sql`
      UPDATE users 
      SET is_premium = false, 
          premium_expires_at = null
      WHERE id = ${userId}
    `;
    
    res.json({ success: true, message: 'Premium revoked successfully' });
  } catch (error) {
    console.error('Revoke premium error:', error);
    res.status(500).json({ error: 'Failed to revoke premium' });
  }
};

// Check if user's premium is expired and update
export const checkPremiumExpiry: RequestHandler = async (req, res) => {
  try {
    // Update expired premium users
    await sql`
      UPDATE users 
      SET is_premium = false 
      WHERE is_premium = true 
        AND premium_expires_at IS NOT NULL 
        AND premium_expires_at < NOW()
    `;
    
    res.json({ success: true, message: 'Premium expiry check completed' });
  } catch (error) {
    console.error('Check premium expiry error:', error);
    res.status(500).json({ error: 'Failed to check premium expiry' });
  }
};

// Get premium statistics
export const getPremiumStats: RequestHandler = async (req, res) => {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_premium = true THEN 1 END) as premium_users,
        COUNT(CASE WHEN is_premium = true AND premium_expires_at IS NULL THEN 1 END) as lifetime_premium,
        COUNT(CASE WHEN is_premium = true AND premium_expires_at > NOW() THEN 1 END) as active_premium
      FROM users
    `;
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Get premium stats error:', error);
    res.status(500).json({ error: 'Failed to get premium statistics' });
  }
};
