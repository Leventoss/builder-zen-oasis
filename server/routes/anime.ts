import { RequestHandler } from "express";
import {
  getAllAnimes,
  getAnimeById,
  createAnime,
  updateAnime,
  deleteAnime,
  getEpisodesByAnimeId,
  createEpisode,
  createNotification,
  sql,
} from "../lib/database";

// Get all animes
export const handleGetAnimes: RequestHandler = async (req, res) => {
  try {
    const animes = await getAllAnimes();

    // Transform database format to frontend format
    const transformedAnimes = animes.map((anime) => ({
      id: anime.id.toString(),
      title: anime.title,
      titleEn: anime.title_en,
      poster: anime.poster,
      banner: anime.banner,
      rating: anime.rating,
      year: anime.year,
      episodes: anime.episodes,
      genre: anime.genre || [],
      genreEn: anime.genre_en || [],
      duration: anime.duration,
      description: anime.description,
      descriptionEn: anime.description_en,
      status: anime.status,
      category: anime.category,
      featured: anime.featured,
      featuredTitle: anime.featured_title,
      featuredTitleEn: anime.featured_title_en,
      featuredDescription: anime.featured_description,
      featuredDescriptionEn: anime.featured_description_en,
      featuredBanner: anime.featured_banner,
    }));

    res.json({
      success: true,
      data: transformedAnimes,
    });
  } catch (error) {
    console.error("Get animes error:", error);
    res.status(500).json({
      success: false,
      message: "Anime listesi alınamadı",
    });
  }
};

// Get single anime by ID
export const handleGetAnime: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const animeId = parseInt(id);

    if (!animeId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz anime ID",
      });
    }

    const anime = await getAnimeById(animeId);

    if (!anime) {
      return res.status(404).json({
        success: false,
        message: "Anime bulunamadı",
      });
    }

    // Get episodes for this anime
    const episodes = await getEpisodesByAnimeId(animeId);

    const transformedAnime = {
      id: anime.id.toString(),
      title: anime.title,
      titleEn: anime.title_en,
      poster: anime.poster,
      banner: anime.banner,
      rating: anime.rating,
      year: anime.year,
      episodes: anime.episodes,
      genre: anime.genre || [],
      genreEn: anime.genre_en || [],
      duration: anime.duration,
      description: anime.description,
      descriptionEn: anime.description_en,
      status: anime.status,
      category: anime.category,
    };

    const transformedEpisodes = episodes.map((ep) => ({
      id: ep.id,
      title: ep.title,
      titleEn: ep.title_en,
      description: ep.description,
      descriptionEn: ep.description_en,
      videoUrl: ep.video_url,
      duration: ep.duration,
      episodeNumber: ep.episode_number,
      airDate: ep.air_date,
      animeId: ep.anime_id.toString(),
    }));

    res.json({
      success: true,
      data: {
        anime: transformedAnime,
        episodes: transformedEpisodes,
      },
    });
  } catch (error) {
    console.error("Get anime error:", error);
    res.status(500).json({
      success: false,
      message: "Anime bilgisi alınamadı",
    });
  }
};

// Create new anime (Admin only)
export const handleCreateAnime: RequestHandler = async (req, res) => {
  try {
    const animeData = req.body;

    // Basic validation
    if (!animeData.title) {
      return res.status(400).json({
        success: false,
        message: "Anime başlığı gerekli",
      });
    }

    // Check for existing anime with same title
    const existingAnimes = await sql`
      SELECT id, title, title_en FROM animes
      WHERE LOWER(title) = LOWER(${animeData.title})
      OR (title_en IS NOT NULL AND LOWER(title_en) = LOWER(${animeData.titleEn || animeData.title}))
    `;

    if (existingAnimes.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Anime zaten mevcut: ${existingAnimes[0].title}`,
        existing: existingAnimes[0],
      });
    }

    const newAnime = await createAnime({
      title: animeData.title,
      titleEn: animeData.titleEn || null,
      poster: animeData.poster || null,
      banner: animeData.banner || null,
      rating: animeData.rating || 0,
      year: animeData.year || new Date().getFullYear(),
      episodes: animeData.episodes || 0,
      genre: animeData.genre || [],
      genreEn: animeData.genreEn || [],
      duration: animeData.duration || "24 min",
      description: animeData.description || "",
      descriptionEn: animeData.descriptionEn || "",
      status: animeData.status || "ongoing",
      category: animeData.category || "anime",
    });

    // Create notification
    await createNotification(
      "Yeni Anime Eklendi",
      `${animeData.title} başarıyla eklendi`,
      "success",
    );

    res.status(201).json({
      success: true,
      message: "Anime başarıyla oluşturuldu",
      data: {
        id: newAnime.id.toString(),
        title: newAnime.title,
        titleEn: newAnime.title_en,
        poster: newAnime.poster,
        banner: newAnime.banner,
        rating: newAnime.rating,
        year: newAnime.year,
        episodes: newAnime.episodes,
        genre: newAnime.genre || [],
        genreEn: newAnime.genre_en || [],
        duration: newAnime.duration,
        description: newAnime.description,
        descriptionEn: newAnime.description_en,
        status: newAnime.status,
        category: newAnime.category,
      },
    });
  } catch (error) {
    console.error("Create anime error:", error);
    res.status(500).json({
      success: false,
      message: "Anime oluşturulamadı",
    });
  }
};

// Update anime (Admin only)
export const handleUpdateAnime: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const animeId = parseInt(id);
    const animeData = req.body;

    if (!animeId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz anime ID",
      });
    }

    const updatedAnime = await updateAnime(animeId, {
      title: animeData.title,
      titleEn: animeData.titleEn,
      poster: animeData.poster,
      banner: animeData.banner,
      rating: animeData.rating,
      year: animeData.year,
      episodes: animeData.episodes,
      genre: animeData.genre,
      genreEn: animeData.genreEn,
      duration: animeData.duration,
      description: animeData.description,
      descriptionEn: animeData.descriptionEn,
      status: animeData.status,
      category: animeData.category,
      featured: animeData.featured,
      featuredTitle: animeData.featuredTitle,
      featuredTitleEn: animeData.featuredTitleEn,
      featuredDescription: animeData.featuredDescription,
      featuredDescriptionEn: animeData.featuredDescriptionEn,
      featuredBanner: animeData.featuredBanner,
    });

    if (!updatedAnime) {
      return res.status(404).json({
        success: false,
        message: "Anime bulunamadı",
      });
    }

    // Create notification
    await createNotification(
      "Anime Güncellendi",
      `${animeData.title} başarıyla güncellendi`,
      "info",
    );

    res.json({
      success: true,
      message: "Anime başarıyla güncellendi",
      data: {
        id: updatedAnime.id.toString(),
        title: updatedAnime.title,
        titleEn: updatedAnime.title_en,
        poster: updatedAnime.poster,
        banner: updatedAnime.banner,
        rating: updatedAnime.rating,
        year: updatedAnime.year,
        episodes: updatedAnime.episodes,
        genre: updatedAnime.genre || [],
        genreEn: updatedAnime.genre_en || [],
        duration: updatedAnime.duration,
        description: updatedAnime.description,
        descriptionEn: updatedAnime.description_en,
        status: updatedAnime.status,
        category: updatedAnime.category,
        featured: updatedAnime.featured,
        featuredTitle: updatedAnime.featured_title,
        featuredTitleEn: updatedAnime.featured_title_en,
        featuredDescription: updatedAnime.featured_description,
        featuredDescriptionEn: updatedAnime.featured_description_en,
        featuredBanner: updatedAnime.featured_banner,
      },
    });
  } catch (error) {
    console.error("Update anime error:", error);
    res.status(500).json({
      success: false,
      message: "Anime güncellenemedi",
    });
  }
};

// Delete anime (Admin only)
export const handleDeleteAnime: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const animeId = parseInt(id);

    if (!animeId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz anime ID",
      });
    }

    // Get anime info for notification
    const anime = await getAnimeById(animeId);

    if (!anime) {
      return res.status(404).json({
        success: false,
        message: "Anime bulunamadı",
      });
    }

    await deleteAnime(animeId);

    // Create notification
    await createNotification(
      "Anime Silindi",
      `${anime.title} silindi`,
      "warning",
    );

    res.json({
      success: true,
      message: "Anime başarıyla silindi",
    });
  } catch (error) {
    console.error("Delete anime error:", error);
    res.status(500).json({
      success: false,
      message: "Anime silinemedi",
    });
  }
};

// Update episode (Admin only)
export const handleUpdateEpisode: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const episodeId = parseInt(id);
    const episodeData = req.body;

    if (!episodeId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz bölüm ID",
      });
    }

    // Get existing episode
    const existingEpisode = await sql`
      SELECT * FROM episodes WHERE id = ${episodeId} LIMIT 1
    `;

    if (existingEpisode.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bölüm bulunamadı",
      });
    }

    // Update episode
    const updatedEpisode = await sql`
      UPDATE episodes SET
        title = ${episodeData.title || existingEpisode[0].title},
        title_en = ${episodeData.titleEn || existingEpisode[0].title_en},
        description = ${episodeData.description || existingEpisode[0].description},
        description_en = ${episodeData.descriptionEn || existingEpisode[0].description_en},
        video_url = ${episodeData.videoUrl || existingEpisode[0].video_url},
        duration = ${episodeData.duration || existingEpisode[0].duration},
        episode_number = ${episodeData.episodeNumber || existingEpisode[0].episode_number},
        air_date = ${episodeData.airDate || existingEpisode[0].air_date},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${episodeId}
      RETURNING *
    `;

    res.json({
      success: true,
      message: "Bölüm başarıyla güncellendi",
      data: {
        id: updatedEpisode[0].id,
        title: updatedEpisode[0].title,
        titleEn: updatedEpisode[0].title_en,
        description: updatedEpisode[0].description,
        descriptionEn: updatedEpisode[0].description_en,
        videoUrl: updatedEpisode[0].video_url,
        duration: updatedEpisode[0].duration,
        episodeNumber: updatedEpisode[0].episode_number,
        airDate: updatedEpisode[0].air_date,
        animeId: updatedEpisode[0].anime_id.toString(),
      },
    });
  } catch (error) {
    console.error("Update episode error:", error);
    res.status(500).json({
      success: false,
      message: "Bölüm güncelleme hatası",
    });
  }
};

// Delete episode (Admin only)
export const handleDeleteEpisode: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const episodeId = parseInt(id);

    if (!episodeId) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz bölüm ID",
      });
    }

    // Get episode info before deleting
    const episodeInfo = await sql`
      SELECT e.*, a.title as anime_title FROM episodes e
      JOIN animes a ON e.anime_id = a.id
      WHERE e.id = ${episodeId} LIMIT 1
    `;

    if (episodeInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bölüm bulunamadı",
      });
    }

    // Delete episode
    await sql`DELETE FROM episodes WHERE id = ${episodeId}`;

    // Create notification
    await createNotification(
      "Bölüm Silindi",
      `${episodeInfo[0].anime_title} - Bölüm ${episodeInfo[0].episode_number} silindi`,
      "info",
    );

    res.json({
      success: true,
      message: "Bölüm başarıyla silindi",
    });
  } catch (error) {
    console.error("Delete episode error:", error);
    res.status(500).json({
      success: false,
      message: "Bölüm silme hatası",
    });
  }
};

// Add episode to anime (Admin only)
export const handleAddEpisode: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const animeId = parseInt(id);
    const episodeData = req.body;

    console.log("ADD EPISODE DEBUG:");
    console.log("Anime ID:", animeId);
    console.log("Episode Data:", JSON.stringify(episodeData, null, 2));

    if (!animeId) {
      console.log("ERROR: Invalid anime ID");
      return res.status(400).json({
        success: false,
        message: "Geçersiz anime ID",
      });
    }

    if (!episodeData.title || !episodeData.episodeNumber) {
      console.log("ERROR: Missing title or episode number");
      console.log("Title:", episodeData.title);
      console.log("Episode Number:", episodeData.episodeNumber);
      return res.status(400).json({
        success: false,
        message: "Bölüm başlığı ve numarası gerekli",
      });
    }

    const newEpisode = await createEpisode({
      animeId: animeId,
      title: episodeData.title,
      titleEn: episodeData.titleEn || null,
      description: episodeData.description || "",
      descriptionEn: episodeData.descriptionEn || "",
      videoUrl: episodeData.videoUrl || "",
      duration: episodeData.duration || "24 min",
      episodeNumber: episodeData.episodeNumber,
      airDate: episodeData.airDate || new Date().toISOString().split("T")[0],
    });

    // Get anime info for notification
    const anime = await getAnimeById(animeId);

    // Create notification
    await createNotification(
      "Yeni Bölüm Eklendi",
      `${anime?.title} - Bölüm ${episodeData.episodeNumber} eklendi`,
      "success",
    );

    res.status(201).json({
      success: true,
      message: "Bölüm başarıyla eklendi",
      data: {
        id: newEpisode.id,
        title: newEpisode.title,
        titleEn: newEpisode.title_en,
        description: newEpisode.description,
        descriptionEn: newEpisode.description_en,
        videoUrl: newEpisode.video_url,
        duration: newEpisode.duration,
        episodeNumber: newEpisode.episode_number,
        airDate: newEpisode.air_date,
        animeId: newEpisode.anime_id.toString(),
      },
    });
  } catch (error) {
    console.error("Add episode error:", error);
    res.status(500).json({
      success: false,
      message: "Bölüm eklenemedi",
    });
  }
};
