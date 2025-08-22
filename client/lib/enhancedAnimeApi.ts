// Enhanced Anime API service for multiple data sources
export interface EnhancedAnimeData {
  mal_id?: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
    webp?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  score?: number;
  year?: number;
  episodes?: number;
  status?: string;
  genres?: Array<{ name: string }>;
  synopsis?: string;
  duration?: string;
  type?: string;
  trailer?: {
    youtube_id?: string;
    url?: string;
  };
  studios?: Array<{ name: string }>;
  season?: string;
  aired?: {
    from?: string;
    to?: string;
  };
}

export interface AnimeEpisode {
  episode_number: number;
  title: string;
  title_japanese?: string;
  aired?: string;
  score?: number;
  synopsis?: string;
  duration?: string;
}

class EnhancedAnimeAPI {
  private jikanBaseUrl = "https://api.jikan.moe/v4";
  private lastRequestTime = 0;
  private requestDelay = 1000;

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async makeRequest(url: string): Promise<any> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await this.delay(this.requestDelay - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Search anime with enhanced results
  async searchAnimeEnhanced(
    query: string,
    limit: number = 20,
  ): Promise<EnhancedAnimeData[]> {
    try {
      const url = `${this.jikanBaseUrl}/anime?q=${encodeURIComponent(query)}&limit=${limit}&order_by=score&sort=desc`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error("Enhanced search failed:", error);
      return [];
    }
  }

  // Get anime episodes
  async getAnimeEpisodes(animeId: number): Promise<AnimeEpisode[]> {
    try {
      const url = `${this.jikanBaseUrl}/anime/${animeId}/episodes`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error("Failed to get episodes:", error);
      return [];
    }
  }

  // Get anime full details with episodes
  async getAnimeFullDetails(
    animeId: number,
  ): Promise<{ anime: EnhancedAnimeData; episodes: AnimeEpisode[] }> {
    try {
      const [animeData, episodeData] = await Promise.all([
        this.makeRequest(`${this.jikanBaseUrl}/anime/${animeId}/full`),
        this.getAnimeEpisodes(animeId),
      ]);

      return {
        anime: animeData.data || {},
        episodes: episodeData,
      };
    } catch (error) {
      console.error("Failed to get full details:", error);
      return { anime: {} as EnhancedAnimeData, episodes: [] };
    }
  }

  // Search and get full anime data with episodes
  async searchAndGetFull(
    query: string,
  ): Promise<Array<{ anime: EnhancedAnimeData; episodes: AnimeEpisode[] }>> {
    try {
      const searchResults = await this.searchAnimeEnhanced(query, 5);
      const fullResults = [];

      for (const anime of searchResults) {
        if (anime.mal_id) {
          const fullData = await this.getAnimeFullDetails(anime.mal_id);
          fullResults.push(fullData);
        }
      }

      return fullResults;
    } catch (error) {
      console.error("Search and get full failed:", error);
      return [];
    }
  }

  // Get alternative image sources
  async getAlternativeImages(title: string): Promise<string[]> {
    try {
      // Try to get images from different sources
      const searchResults = await this.searchAnimeEnhanced(title, 1);
      const images: string[] = [];

      if (searchResults.length > 0) {
        const anime = searchResults[0];

        // Add all available image formats
        if (anime.images?.jpg?.large_image_url) {
          images.push(anime.images.jpg.large_image_url);
        }
        if (anime.images?.jpg?.image_url) {
          images.push(anime.images.jpg.image_url);
        }
        if (anime.images?.webp?.large_image_url) {
          images.push(anime.images.webp.large_image_url);
        }
        if (anime.images?.webp?.image_url) {
          images.push(anime.images.webp.image_url);
        }
      }

      return images;
    } catch (error) {
      console.error("Failed to get alternative images:", error);
      return [];
    }
  }

  // Enhanced conversion with episodes
  convertToFullAnimeData(
    anime: EnhancedAnimeData,
    episodes: AnimeEpisode[] = [],
  ): any {
    const genreMapping: { [key: string]: { tr: string; en: string } } = {
      Action: { tr: "Aksiyon", en: "Action" },
      Adventure: { tr: "Macera", en: "Adventure" },
      Comedy: { tr: "Komedi", en: "Comedy" },
      Drama: { tr: "Drama", en: "Drama" },
      Fantasy: { tr: "Fantastik", en: "Fantasy" },
      Horror: { tr: "Korku", en: "Horror" },
      Romance: { tr: "Romantik", en: "Romance" },
      "Sci-Fi": { tr: "Bilim Kurgu", en: "Sci-Fi" },
      Thriller: { tr: "Gerilim", en: "Thriller" },
      Sports: { tr: "Spor", en: "Sports" },
      Music: { tr: "Müzikal", en: "Musical" },
      School: { tr: "Okul", en: "School" },
      Supernatural: { tr: "Doğaüstü", en: "Supernatural" },
      Psychological: { tr: "Psikolojik", en: "Psychological" },
      Historical: { tr: "Tarihi", en: "Historical" },
      Military: { tr: "Askeri", en: "Military" },
      "Slice of Life": { tr: "Yaşam", en: "Slice of Life" },
      Mecha: { tr: "Mecha", en: "Mecha" },
    };

    const genres = anime.genres?.map((g) => g.name) || ["Action"];
    const genreTr = genres.map((g) => genreMapping[g]?.tr || g);
    const genreEn = genres.map((g) => genreMapping[g]?.en || g);

    const status = this.mapStatus(anime.status);
    const category = this.mapCategory(anime.type);

    return {
      title: anime.title_japanese || anime.title,
      titleEn: anime.title_english || anime.title,
      poster:
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        anime.images?.webp?.large_image_url ||
        anime.images?.webp?.image_url ||
        "https://via.placeholder.com/400x600",
      banner:
        anime.images?.jpg?.large_image_url ||
        anime.images?.webp?.large_image_url,
      rating: anime.score || 7.0,
      year: anime.year || new Date().getFullYear(),
      episodes: anime.episodes || episodes.length || 12,
      genre: genreTr,
      genreEn: genreEn,
      duration: this.parseDuration(anime.duration),
      description:
        anime.synopsis || `${anime.title} - Açıklama yakında eklenecek`,
      descriptionEn:
        anime.synopsis || `${anime.title} - Description coming soon`,
      status: status,
      category: category,
      trailer: anime.trailer?.youtube_id || "",
      studio: anime.studios?.map((s) => s.name).join(", ") || "Bilinmiyor",
      season: anime.season || "",
      episodeList: episodes.map((ep) => ({
        episodeNumber: ep.episode_number,
        title: ep.title || `Bölüm ${ep.episode_number}`,
        titleEn: ep.title || `Episode ${ep.episode_number}`,
        description: ep.synopsis || `${ep.episode_number}. bölüm açıklaması`,
        descriptionEn:
          ep.synopsis || `Episode ${ep.episode_number} description`,
        duration: ep.duration || "24min",
        airDate: ep.aired || new Date().toISOString().split("T")[0],
        videoUrl: "", // Will be empty for now
      })),
    };
  }

  private mapStatus(status?: string): "ongoing" | "completed" | "upcoming" {
    if (!status) return "upcoming";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("airing") || statusLower.includes("currently"))
      return "ongoing";
    if (statusLower.includes("finished") || statusLower.includes("complete"))
      return "completed";
    return "upcoming";
  }

  private mapCategory(type?: string): "anime" | "movie" {
    if (!type) return "anime";
    const typeLower = type.toLowerCase();
    if (typeLower.includes("movie") || typeLower.includes("film"))
      return "movie";
    return "anime";
  }

  private parseDuration(duration?: string): string {
    if (!duration) return "24min";

    const minutes = duration.match(/(\d+)\s*min/);
    if (minutes) {
      return `${minutes[1]}min`;
    }

    const hours = duration.match(/(\d+)\s*hr/);
    if (hours) {
      return `${parseInt(hours[1]) * 60}min`;
    }

    return "24min";
  }

  // Fast bulk import
  async bulkImportAnime(titles: string[]): Promise<any[]> {
    const results = [];

    for (const title of titles) {
      try {
        const searchResults = await this.searchAndGetFull(title.trim());
        if (searchResults.length > 0) {
          const fullData = this.convertToFullAnimeData(
            searchResults[0].anime,
            searchResults[0].episodes,
          );
          results.push(fullData);
        }

        // Add small delay between bulk imports
        await this.delay(2000);
      } catch (error) {
        console.error(`Failed to import ${title}:`, error);
      }
    }

    return results;
  }

  // Get trending anime
  async getTrendingAnime(limit: number = 20): Promise<EnhancedAnimeData[]> {
    try {
      const currentSeason = this.getCurrentSeason();
      const currentYear = new Date().getFullYear();
      const url = `${this.jikanBaseUrl}/seasons/${currentYear}/${currentSeason}?limit=${limit}`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error("Failed to get trending anime:", error);
      return [];
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return "winter";
    if (month >= 4 && month <= 6) return "spring";
    if (month >= 7 && month <= 9) return "summer";
    return "fall";
  }

  // Image quality enhancement
  async enhanceImageQuality(animeData: any): Promise<any> {
    try {
      const improvements: any = {};

      // Get better images if current ones are low quality
      if (this.isLowQualityImage(animeData.poster)) {
        const alternativeImages = await this.getAlternativeImages(
          animeData.title,
        );
        if (alternativeImages.length > 0) {
          improvements.poster = alternativeImages[0];
        }
      }

      if (this.isLowQualityImage(animeData.banner)) {
        const alternativeImages = await this.getAlternativeImages(
          animeData.title,
        );
        if (alternativeImages.length > 1) {
          improvements.banner = alternativeImages[1];
        } else if (alternativeImages.length > 0) {
          improvements.banner = alternativeImages[0];
        }
      }

      return Object.keys(improvements).length > 0 ? improvements : null;
    } catch (error) {
      console.error("Failed to enhance image quality:", error);
      return null;
    }
  }

  private isLowQualityImage(imageUrl: string): boolean {
    if (!imageUrl) return true;

    if (
      imageUrl.includes("placeholder") ||
      imageUrl.includes("via.placeholder") ||
      imageUrl.includes("example.com")
    ) {
      return true;
    }

    const lowResIndicators = ["small", "thumb", "mini", "_s.", "_t."];
    return lowResIndicators.some((indicator) => imageUrl.includes(indicator));
  }
}

export const enhancedAnimeAPI = new EnhancedAnimeAPI();
