import { neon } from "@neondatabase/serverless";

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_ycnCME0N1GXk@ep-orange-cloud-aei26sw0-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const sql = neon(connectionString);

// Database utility functions
export async function getUserByEmail(email: string) {
  const users = await sql`
    SELECT id, username, email, password_hash, is_admin, is_premium,
           premium_expires_at, discord_id, discord_username, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  return users[0] || null;
}

export async function createUser(
  username: string,
  email: string,
  passwordHash: string,
  discordId?: string,
  discordUsername?: string,
) {
  const users = await sql`
    INSERT INTO users (username, email, password_hash, is_admin, is_premium, discord_id, discord_username)
    VALUES (${username}, ${email}, ${passwordHash}, false, false, ${discordId || null}, ${discordUsername || null})
    RETURNING id, username, email, is_admin, is_premium, premium_expires_at,
             discord_id, discord_username, created_at
  `;
  return users[0];
}

export async function getAllUsers() {
  return await sql`
    SELECT id, username, email, is_admin, is_premium, premium_expires_at,
           discord_id, discord_username, created_at
    FROM users
    ORDER BY created_at DESC
  `;
}

export async function getUserStats() {
  const stats = await sql`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE is_premium = true) as premium_users,
      (SELECT COUNT(*) FROM animes) as total_animes,
      (SELECT COUNT(*) FROM episodes) as total_episodes,
      (SELECT COUNT(*) FROM watch_progress WHERE DATE(last_watched) = CURRENT_DATE) as today_watches
  `;
  return stats[0];
}

// Anime CRUD functions
export async function getAllAnimes() {
  return await sql`
    SELECT * FROM animes 
    ORDER BY created_at DESC
  `;
}

export async function getAnimeById(id: number) {
  const animes = await sql`
    SELECT * FROM animes 
    WHERE id = ${id}
    LIMIT 1
  `;
  return animes[0] || null;
}

export async function createAnime(animeData: any) {
  // Ensure featured column exists
  try {
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured INTEGER`;
  } catch (error) {
    // Column might already exist, ignore error
  }

  const animes = await sql`
    INSERT INTO animes (
      title, title_en, poster, banner, rating, year, episodes,
      genre, genre_en, duration, description, description_en,
      status, category, featured
    )
    VALUES (
      ${animeData.title}, ${animeData.titleEn}, ${animeData.poster},
      ${animeData.banner}, ${animeData.rating}, ${animeData.year},
      ${animeData.episodes}, ${animeData.genre}, ${animeData.genreEn},
      ${animeData.duration}, ${animeData.description}, ${animeData.descriptionEn},
      ${animeData.status}, ${animeData.category}, ${animeData.featured || null}
    )
    RETURNING *
  `;
  return animes[0];
}

export async function updateAnime(id: number, animeData: any) {
  try {
    // First, ensure featured column exists
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured INTEGER`;
  } catch (error) {
    // Column might already exist, ignore error
    console.log('Featured column exists or error:', error.message);
  }

  try {
    // Only update fields that are provided
    const updateFields = [];
    const values = [];

    if (animeData.title !== undefined) {
      updateFields.push('title = $' + (values.length + 1));
      values.push(animeData.title);
    }
    if (animeData.titleEn !== undefined) {
      updateFields.push('title_en = $' + (values.length + 1));
      values.push(animeData.titleEn);
    }
    if (animeData.poster !== undefined) {
      updateFields.push('poster = $' + (values.length + 1));
      values.push(animeData.poster);
    }
    if (animeData.banner !== undefined) {
      updateFields.push('banner = $' + (values.length + 1));
      values.push(animeData.banner);
    }
    if (animeData.rating !== undefined) {
      updateFields.push('rating = $' + (values.length + 1));
      values.push(animeData.rating);
    }
    if (animeData.year !== undefined) {
      updateFields.push('year = $' + (values.length + 1));
      values.push(animeData.year);
    }
    if (animeData.episodes !== undefined) {
      updateFields.push('episodes = $' + (values.length + 1));
      values.push(animeData.episodes);
    }
    if (animeData.genre !== undefined) {
      updateFields.push('genre = $' + (values.length + 1));
      values.push(animeData.genre);
    }
    if (animeData.genreEn !== undefined) {
      updateFields.push('genre_en = $' + (values.length + 1));
      values.push(animeData.genreEn);
    }
    if (animeData.duration !== undefined) {
      updateFields.push('duration = $' + (values.length + 1));
      values.push(animeData.duration);
    }
    if (animeData.description !== undefined) {
      updateFields.push('description = $' + (values.length + 1));
      values.push(animeData.description);
    }
    if (animeData.descriptionEn !== undefined) {
      updateFields.push('description_en = $' + (values.length + 1));
      values.push(animeData.descriptionEn);
    }
    if (animeData.status !== undefined) {
      updateFields.push('status = $' + (values.length + 1));
      values.push(animeData.status);
    }
    if (animeData.category !== undefined) {
      updateFields.push('category = $' + (values.length + 1));
      values.push(animeData.category);
    }
    if (animeData.featured !== undefined) {
      updateFields.push('featured = $' + (values.length + 1));
      values.push(animeData.featured);
    }

    // Always update timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Add id for WHERE clause
    values.push(id);
    const whereClause = '$' + values.length;

    if (updateFields.length === 1) { // Only timestamp
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE animes SET ${updateFields.join(', ')}
      WHERE id = ${whereClause}
      RETURNING *
    `;

    const animes = await sql.unsafe(query, values);
    return animes[0];
  } catch (error) {
    console.error('Update anime error:', error);
    throw error;
  }
}

export async function deleteAnime(id: number) {
  await sql`DELETE FROM animes WHERE id = ${id}`;
  return true;
}

// Episode functions
export async function getEpisodesByAnimeId(animeId: number) {
  return await sql`
    SELECT * FROM episodes 
    WHERE anime_id = ${animeId}
    ORDER BY episode_number ASC
  `;
}

export async function createEpisode(episodeData: any) {
  const episodes = await sql`
    INSERT INTO episodes (
      anime_id, title, title_en, description, description_en,
      video_url, duration, episode_number, air_date
    )
    VALUES (
      ${episodeData.animeId}, ${episodeData.title}, ${episodeData.titleEn},
      ${episodeData.description}, ${episodeData.descriptionEn},
      ${episodeData.videoUrl}, ${episodeData.duration}, 
      ${episodeData.episodeNumber}, ${episodeData.airDate}
    )
    RETURNING *
  `;
  return episodes[0];
}

// User progress functions
export async function getUserWatchProgress(userId: number) {
  return await sql`
    SELECT wp.*, a.title, a.poster, e.title as episode_title, e.episode_number
    FROM watch_progress wp
    JOIN animes a ON wp.anime_id = a.id
    JOIN episodes e ON wp.episode_id = e.id
    WHERE wp.user_id = ${userId}
    ORDER BY wp.last_watched DESC
  `;
}

export async function updateWatchProgress(
  userId: number,
  animeId: number,
  episodeId: number,
  progress: number,
) {
  const existing = await sql`
    SELECT id FROM watch_progress 
    WHERE user_id = ${userId} AND episode_id = ${episodeId}
    LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE watch_progress SET
        progress = ${progress},
        completed = ${progress > 80},
        last_watched = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND episode_id = ${episodeId}
    `;
  } else {
    await sql`
      INSERT INTO watch_progress (user_id, anime_id, episode_id, progress, completed)
      VALUES (${userId}, ${animeId}, ${episodeId}, ${progress}, ${progress > 80})
    `;
  }
  return true;
}

// User lists functions
export async function getUserList(userId: number, listType: string) {
  return await sql`
    SELECT ul.*, a.title, a.poster, a.rating, a.year
    FROM user_lists ul
    JOIN animes a ON ul.anime_id = a.id
    WHERE ul.user_id = ${userId} AND ul.list_type = ${listType}
    ORDER BY ul.added_at DESC
  `;
}

export async function addToUserList(
  userId: number,
  animeId: number,
  listType: string,
) {
  await sql`
    INSERT INTO user_lists (user_id, anime_id, list_type)
    VALUES (${userId}, ${animeId}, ${listType})
    ON CONFLICT (user_id, anime_id, list_type) DO NOTHING
  `;
  return true;
}

export async function removeFromUserList(
  userId: number,
  animeId: number,
  listType: string,
) {
  await sql`
    DELETE FROM user_lists 
    WHERE user_id = ${userId} AND anime_id = ${animeId} AND list_type = ${listType}
  `;
  return true;
}

// Notifications functions
export async function getAdminNotifications() {
  return await sql`
    SELECT * FROM admin_notifications
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

export async function createNotification(
  title: string,
  message: string,
  type: string,
) {
  const notifications = await sql`
    INSERT INTO admin_notifications (title, message, type)
    VALUES (${title}, ${message}, ${type})
    RETURNING *
  `;
  return notifications[0];
}

export async function markNotificationRead(id: number) {
  await sql`
    UPDATE admin_notifications SET read = true 
    WHERE id = ${id}
  `;
  return true;
}
