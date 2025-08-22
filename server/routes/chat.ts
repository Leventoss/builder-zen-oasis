import { RequestHandler } from "express";
import { sql } from "../lib/database";

export interface ChatSessionResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
}

export interface ChatMessageResponse {
  success: boolean;
  message?: string;
}

// Create new chat session
export const handleCreateSession: RequestHandler = async (req, res) => {
  try {
    const { category, userEmail } = req.body;

    if (!category || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "Kategori ve email gerekli",
      } as ChatSessionResponse);
    }

    // Create new session
    const sessions = await sql`
      INSERT INTO chat_sessions (user_email, category, status)
      VALUES (${userEmail}, ${category}, 'active')
      RETURNING id
    `;

    const sessionId = sessions[0].id;

    // Notify admin if needed
    await sql`
      INSERT INTO admin_notifications (title, message, type)
      VALUES (
        'Yeni Chat Talebi',
        ${`${userEmail} tarafından ${category} kategorisinde yeni chat talebi`},
        'info'
      )
    `;

    res.json({
      success: true,
      sessionId: sessionId.toString(),
    } as ChatSessionResponse);
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    } as ChatSessionResponse);
  }
};

// Add message to chat session
export const handleAddMessage: RequestHandler = async (req, res) => {
  try {
    const { sessionId, sender, message, imageUrl } = req.body;

    if (!sessionId || !sender || !message) {
      return res.status(400).json({
        success: false,
        message: "Session ID, gönderici ve mesaj gerekli",
      } as ChatMessageResponse);
    }

    // Add message to database
    await sql`
      INSERT INTO chat_messages (session_id, sender, message, image_url)
      VALUES (${parseInt(sessionId)}, ${sender}, ${message}, ${imageUrl || null})
    `;

    res.json({
      success: true,
    } as ChatMessageResponse);
  } catch (error) {
    console.error("Add message error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    } as ChatMessageResponse);
  }
};

// Get chat sessions for admin
export const handleGetSessions: RequestHandler = async (req, res) => {
  try {
    const sessions = await sql`
      SELECT 
        cs.*,
        COUNT(cm.id) as message_count
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      GROUP BY cs.id
      ORDER BY cs.created_at DESC
      LIMIT 50
    `;

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    });
  }
};

// Get messages for a chat session
export const handleGetMessages: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID gerekli",
      });
    }

    const messages = await sql`
      SELECT * FROM chat_messages
      WHERE session_id = ${parseInt(sessionId)}
      ORDER BY created_at ASC
    `;

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    });
  }
};

// Update session status
export const handleUpdateSessionStatus: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!sessionId || !status) {
      return res.status(400).json({
        success: false,
        message: "Session ID ve status gerekli",
      });
    }

    await sql`
      UPDATE chat_sessions 
      SET status = ${status}, admin_notified = true
      WHERE id = ${parseInt(sessionId)}
    `;

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Update session status error:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    });
  }
};
