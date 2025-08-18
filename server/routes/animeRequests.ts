import { RequestHandler } from 'express';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

// Create anime_requests table if not exists
const initializeRequestsTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS anime_requests (
        id SERIAL PRIMARY KEY,
        anime_name VARCHAR(255) NOT NULL,
        description TEXT,
        requested_by VARCHAR(100) NOT NULL,
        requested_by_id INTEGER,
        votes INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS anime_request_votes (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES anime_requests(id) ON DELETE CASCADE,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(request_id, user_id)
      )
    `;
  } catch (error) {
    console.error('Failed to initialize anime requests tables:', error);
  }
};

// Initialize tables on startup
initializeRequestsTable();

// Get all anime requests
export const getAnimeRequests: RequestHandler = async (req, res) => {
  try {
    const requests = await sql`
      SELECT 
        ar.*,
        COALESCE(vote_counts.vote_count, 0) as votes
      FROM anime_requests ar
      LEFT JOIN (
        SELECT request_id, COUNT(*) as vote_count
        FROM anime_request_votes
        GROUP BY request_id
      ) vote_counts ON ar.id = vote_counts.request_id
      ORDER BY ar.created_at DESC
    `;

    const transformedRequests = requests.map(request => ({
      id: request.id.toString(),
      animeName: request.anime_name,
      description: request.description,
      requestedBy: request.requested_by,
      requestedById: request.requested_by_id,
      timestamp: request.created_at,
      votes: parseInt(request.votes) || 0,
      status: request.status,
      userVoted: false // This would need to be calculated per user
    }));

    res.json({
      success: true,
      data: transformedRequests
    });
  } catch (error) {
    console.error('Get anime requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get anime requests'
    });
  }
};

// Create new anime request
export const createAnimeRequest: RequestHandler = async (req, res) => {
  try {
    const { animeName, description, requestedBy, requestedById } = req.body;

    if (!animeName || !requestedBy) {
      return res.status(400).json({
        success: false,
        message: 'Anime name and requester are required'
      });
    }

    const newRequest = await sql`
      INSERT INTO anime_requests (anime_name, description, requested_by, requested_by_id)
      VALUES (${animeName}, ${description || ''}, ${requestedBy}, ${requestedById || null})
      RETURNING *
    `;

    // Add initial vote from the requester
    if (requestedById) {
      await sql`
        INSERT INTO anime_request_votes (request_id, user_id)
        VALUES (${newRequest[0].id}, ${requestedById})
        ON CONFLICT (request_id, user_id) DO NOTHING
      `;
    }

    res.status(201).json({
      success: true,
      message: 'Anime request created successfully',
      data: {
        id: newRequest[0].id,
        animeName: newRequest[0].anime_name,
        description: newRequest[0].description,
        requestedBy: newRequest[0].requested_by,
        status: newRequest[0].status,
        createdAt: newRequest[0].created_at
      }
    });

  } catch (error) {
    console.error('Create anime request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create anime request'
    });
  }
};

// Vote on anime request
export const voteOnRequest: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user already voted
    const existingVote = await sql`
      SELECT id FROM anime_request_votes
      WHERE request_id = ${requestId} AND user_id = ${userId}
    `;

    if (existingVote.length > 0) {
      // Remove vote (toggle)
      await sql`
        DELETE FROM anime_request_votes
        WHERE request_id = ${requestId} AND user_id = ${userId}
      `;
    } else {
      // Add vote
      await sql`
        INSERT INTO anime_request_votes (request_id, user_id)
        VALUES (${requestId}, ${userId})
      `;
    }

    // Get updated vote count
    const voteCount = await sql`
      SELECT COUNT(*) as count
      FROM anime_request_votes
      WHERE request_id = ${requestId}
    `;

    res.json({
      success: true,
      message: 'Vote updated successfully',
      data: {
        votes: parseInt(voteCount[0].count) || 0,
        userVoted: existingVote.length === 0
      }
    });

  } catch (error) {
    console.error('Vote on request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vote'
    });
  }
};

// Update request status (Admin only)
export const updateRequestStatus: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'added'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await sql`
      UPDATE anime_requests
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId}
    `;

    res.json({
      success: true,
      message: 'Request status updated successfully'
    });

  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request status'
    });
  }
};

// Get pending requests for admin
export const getPendingRequests: RequestHandler = async (req, res) => {
  try {
    const pendingRequests = await sql`
      SELECT 
        ar.*,
        COALESCE(vote_counts.vote_count, 0) as votes
      FROM anime_requests ar
      LEFT JOIN (
        SELECT request_id, COUNT(*) as vote_count
        FROM anime_request_votes
        GROUP BY request_id
      ) vote_counts ON ar.id = vote_counts.request_id
      WHERE ar.status = 'pending'
      ORDER BY vote_counts.vote_count DESC, ar.created_at DESC
    `;

    const transformedRequests = pendingRequests.map(request => ({
      id: request.id.toString(),
      animeName: request.anime_name,
      description: request.description,
      requestedBy: request.requested_by,
      requestedById: request.requested_by_id,
      timestamp: request.created_at,
      votes: parseInt(request.votes) || 0,
      status: request.status
    }));

    res.json({
      success: true,
      data: transformedRequests
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending requests'
    });
  }
};

// Delete request (Admin only)
export const deleteAnimeRequest: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;

    await sql`
      DELETE FROM anime_requests
      WHERE id = ${requestId}
    `;

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });

  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete request'
    });
  }
};
