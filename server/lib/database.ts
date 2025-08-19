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
  // Ensure all featured columns exist
  try {
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured INTEGER`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_title TEXT`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_title_en TEXT`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_description TEXT`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_description_en TEXT`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_banner TEXT`;
  } catch (error) {
    // Columns might already exist, ignore error
  }

  const animes = await sql`
    INSERT INTO animes (
      title, title_en, poster, banner, rating, year, episodes,
      genre, genre_en, duration, description, description_en,
      status, category, featured, featured_title, featured_title_en,
      featured_description, featured_description_en, featured_banner
    )
    VALUES (
      ${animeData.title}, ${animeData.titleEn}, ${animeData.poster},
      ${animeData.banner}, ${animeData.rating}, ${animeData.year},
      ${animeData.episodes}, ${animeData.genre}, ${animeData.genreEn},
      ${animeData.duration}, ${animeData.description}, ${animeData.descriptionEn},
      ${animeData.status}, ${animeData.category}, ${animeData.featured || null},
      ${animeData.featuredTitle || null}, ${animeData.featuredTitleEn || null},
      ${animeData.featuredDescription || null}, ${animeData.featuredDescriptionEn || null},
      ${animeData.featuredBanner || null}
    )
    RETURNING *
  `;
  return animes[0];
}

export async function updateAnime(id: number, animeData: any) {
  try {
    // Ensure all featured columns exist
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured INTEGER`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_title TEXT`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_title_en TEXT`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_description TEXT`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_description_en TEXT`;
    await sql`ALTER TABLE animes ADD COLUMN IF NOT EXISTS featured_banner TEXT`;
  } catch (error) {
    // Columns might already exist, ignore
  }

  // Check if only featured-related fields are being updated
  const featuredOnlyFields = ['featured', 'featuredTitle', 'featuredTitleEn', 'featuredDescription', 'featuredDescriptionEn', 'featuredBanner'];
  const isFeatureOnlyUpdate = Object.keys(animeData).every(key => featuredOnlyFields.includes(key));

  if (isFeatureOnlyUpdate) {
    const animes = await sql`
      UPDATE animes SET
        featured = ${animeData.featured !== undefined ? animeData.featured : sql`featured`},
        featured_title = ${animeData.featuredTitle !== undefined ? animeData.featuredTitle : sql`featured_title`},
        featured_title_en = ${animeData.featuredTitleEn !== undefined ? animeData.featuredTitleEn : sql`featured_title_en`},
        featured_description = ${animeData.featuredDescription !== undefined ? animeData.featuredDescription : sql`featured_description`},
        featured_description_en = ${animeData.featuredDescriptionEn !== undefined ? animeData.featuredDescriptionEn : sql`featured_description_en`},
        featured_banner = ${animeData.featuredBanner !== undefined ? animeData.featuredBanner : sql`featured_banner`},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return animes[0];
  }

  // Full update
  const animes = await sql`
    UPDATE animes SET
      title = ${animeData.title || sql`title`},
      title_en = ${animeData.titleEn || sql`title_en`},
      poster = ${animeData.poster || sql`poster`},
      banner = ${animeData.banner || sql`banner`},
      rating = ${animeData.rating || sql`rating`},
      year = ${animeData.year || sql`year`},
      episodes = ${animeData.episodes || sql`episodes`},
      genre = ${animeData.genre || sql`genre`},
      genre_en = ${animeData.genreEn || sql`genre_en`},
      duration = ${animeData.duration || sql`duration`},
      description = ${animeData.description || sql`description`},
      description_en = ${animeData.descriptionEn || sql`description_en`},
      status = ${animeData.status || sql`status`},
      category = ${animeData.category || sql`category`},
      featured = ${animeData.featured !== undefined ? animeData.featured : sql`featured`},
      featured_title = ${animeData.featuredTitle !== undefined ? animeData.featuredTitle : sql`featured_title`},
      featured_title_en = ${animeData.featuredTitleEn !== undefined ? animeData.featuredTitleEn : sql`featured_title_en`},
      featured_description = ${animeData.featuredDescription !== undefined ? animeData.featuredDescription : sql`featured_description`},
      featured_description_en = ${animeData.featuredDescriptionEn !== undefined ? animeData.featuredDescriptionEn : sql`featured_description_en`},
      featured_banner = ${animeData.featuredBanner !== undefined ? animeData.featuredBanner : sql`featured_banner`},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return animes[0];
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
