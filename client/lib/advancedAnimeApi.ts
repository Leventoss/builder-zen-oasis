// Advanced Anime API service with multiple data sources
export interface AnimeApiData {
  mal_id?: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  title_turkish?: string;
  images?: {
    jpg?: { image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; large_image_url?: string };
  };
  score?: number;
  year?: number;
  episodes?: number;
  status?: string;
  genres?: Array<{ name: string }>;
  themes?: Array<{ name: string }>;
  demographics?: Array<{ name: string }>;
  synopsis?: string;
  synopsis_turkish?: string;
  duration?: string;
  type?: string;
  rating?: string;
  studios?: Array<{ name: string }>;
  producers?: Array<{ name: string }>;
  licensors?: Array<{ name: string }>;
  aired?: {
    from?: string;
    to?: string;
    string?: string;
  };
  season?: string;
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
    string?: string;
  };
  source?: string;
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
  };
  external?: Array<{
    name: string;
    url: string;
  }>;
  streaming?: Array<{
    name: string;
    url: string;
  }>;
}

export interface AnimeEpisodeData {
  mal_id?: number;
  title?: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
  score?: number;
  synopsis?: string;
  video_url?: string;
  forum_url?: string;
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ title: string; error: string }>;
  results: Array<any>;
}

class AdvancedAnimeAPI {
  private jikanBase = "https://api.jikan.moe/v4";
  private anilistBase = "https://graphql.anilist.co";
  private lastRequestTime = 0;
  private requestDelay = 1000; // Rate limiting

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async makeRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await this.delay(this.requestDelay - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AnimeManager/1.0",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Jikan API methods
  async searchAnimeJikan(
    query: string,
    limit: number = 25,
  ): Promise<AnimeApiData[]> {
    try {
      const url = `${this.jikanBase}/anime?q=${encodeURIComponent(query)}&limit=${limit}&order_by=score&sort=desc`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error("Jikan search failed:", error);
      return [];
    }
  }

  async getAnimeByIdJikan(id: number): Promise<AnimeApiData | null> {
    try {
      const url = `${this.jikanBase}/anime/${id}/full`;
      const data = await this.makeRequest(url);
      return data.data || null;
    } catch (error) {
      console.error("Jikan get by ID failed:", error);
      return null;
    }
  }

  async getAnimeEpisodesJikan(
    id: number,
    page: number = 1,
  ): Promise<AnimeEpisodeData[]> {
    try {
      const url = `${this.jikanBase}/anime/${id}/episodes?page=${page}`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error("Jikan episodes failed:", error);
      return [];
    }
  }

  async getAllEpisodesJikan(id: number): Promise<AnimeEpisodeData[]> {
    try {
      let allEpisodes: AnimeEpisodeData[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const episodes = await this.getAnimeEpisodesJikan(id, page);
        if (episodes.length === 0) {
          hasNextPage = false;
        } else {
          allEpisodes = [...allEpisodes, ...episodes];
          page++;

          // Safety limit
          if (page > 50) break;
        }
      }

      return allEpisodes;
    } catch (error) {
      console.error("Get all episodes failed:", error);
      return [];
    }
  }

  // AniList GraphQL API
  async searchAnimeAniList(query: string, limit: number = 25): Promise<any[]> {
    try {
      const graphqlQuery = `
        query ($search: String, $perPage: Int) {
          Page(perPage: $perPage) {
            media(search: $search, type: ANIME, sort: SCORE_DESC) {
              id
              title {
                romaji
                english
                native
              }
              description
              episodes
              score: averageScore
              genres
              studios {
                nodes {
                  name
                }
              }
              coverImage {
                large
                medium
              }
              bannerImage
              startDate {
                year
                month
                day
              }
              status
              season
              seasonYear
              duration
              source
              externalLinks {
                site
                url
              }
              streamingEpisodes {
                title
                thumbnail
                url
              }
            }
          }
        }
      `;

      const data = await this.makeRequest(this.anilistBase, {
        method: "POST",
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { search: query, perPage: limit },
        }),
      });

      return data.data?.Page?.media || [];
    } catch (error) {
      console.error("AniList search failed:", error);
      return [];
    }
  }

  // Enhanced search with multiple sources
  async enhancedSearch(
    query: string,
    limit: number = 20,
  ): Promise<AnimeApiData[]> {
    try {
      const [jikanResults, anilistResults] = await Promise.allSettled([
        this.searchAnimeJikan(query, Math.ceil(limit / 2)),
        this.searchAnimeAniList(query, Math.ceil(limit / 2)),
      ]);

      let combinedResults: AnimeApiData[] = [];

      // Add Jikan results
      if (jikanResults.status === "fulfilled") {
        combinedResults = [...combinedResults, ...jikanResults.value];
      }

      // Convert and add AniList results
      if (anilistResults.status === "fulfilled") {
        const convertedAniList = anilistResults.value.map((anilistData: any) =>
          this.convertAniListToStandard(anilistData),
        );
        combinedResults = [...combinedResults, ...convertedAniList];
      }

      // Remove duplicates and sort by score
      const uniqueResults = this.removeDuplicates(combinedResults);
      return uniqueResults.slice(0, limit);
    } catch (error) {
      console.error("Enhanced search failed:", error);
      return [];
    }
  }

  // Convert AniList format to standard format
  private convertAniListToStandard(anilistData: any): AnimeApiData {
    return {
      mal_id: anilistData.id,
      title: anilistData.title?.romaji || anilistData.title?.english || "",
      title_english: anilistData.title?.english,
      title_japanese: anilistData.title?.native,
      images: {
        jpg: {
          image_url: anilistData.coverImage?.medium,
          large_image_url: anilistData.coverImage?.large,
        },
      },
      score: anilistData.score ? anilistData.score / 10 : undefined,
      year: anilistData.startDate?.year,
      episodes: anilistData.episodes,
      status: this.convertAniListStatus(anilistData.status),
      genres: anilistData.genres?.map((g: string) => ({ name: g })) || [],
      synopsis: anilistData.description?.replace(/<[^>]*>/g, ""), // Remove HTML tags
      duration: anilistData.duration ? `${anilistData.duration}min` : undefined,
      type: "TV", // Default for AniList
      studios:
        anilistData.studios?.nodes?.map((s: any) => ({ name: s.name })) || [],
      season: anilistData.season?.toLowerCase(),
      source: anilistData.source,
      external:
        anilistData.externalLinks?.map((link: any) => ({
          name: link.site,
          url: link.url,
        })) || [],
      streaming:
        anilistData.streamingEpisodes?.map((ep: any) => ({
          name: "Stream",
          url: ep.url,
        })) || [],
    };
  }

  private convertAniListStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      FINISHED: "Finished Airing",
      RELEASING: "Currently Airing",
      NOT_YET_RELEASED: "Not yet aired",
      CANCELLED: "Cancelled",
      HIATUS: "On Hiatus",
    };
    return statusMap[status] || status;
  }

  // Remove duplicates based on title similarity
  private removeDuplicates(animes: AnimeApiData[]): AnimeApiData[] {
    const unique: AnimeApiData[] = [];
    const seenTitles = new Set<string>();

    for (const anime of animes) {
      const normalizedTitle = anime.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        unique.push(anime);
      }
    }

    return unique.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // Get popular/trending anime
  async getTrendingAnime(limit: number = 20): Promise<AnimeApiData[]> {
    try {
      const [currentSeason, topRated] = await Promise.allSettled([
        this.getCurrentSeasonAnime(limit / 2),
        this.getTopRatedAnime(limit / 2),
      ]);

      let results: AnimeApiData[] = [];

      if (currentSeason.status === "fulfilled") {
        results = [...results, ...currentSeason.value];
      }

      if (topRated.status === "fulfilled") {
        results = [...results, ...topRated.value];
      }

      return this.removeDuplicates(results).slice(0, limit);
    } catch (error) {
      console.error("Get trending anime failed:", error);
      return [];
    }
  }

  async getCurrentSeasonAnime(limit: number = 25): Promise<AnimeApiData[]> {
    try {
      const currentYear = new Date().getFullYear();
      const currentSeason = this.getCurrentSeason();
      const url = `${this.jikanBase}/seasons/${currentYear}/${currentSeason}?limit=${limit}`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error("Get current season failed:", error);
      return [];
    }
  }

  async getTopRatedAnime(limit: number = 25): Promise<AnimeApiData[]> {
    try {
      const url = `${this.jikanBase}/top/anime?limit=${limit}`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error("Get top rated failed:", error);
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

  // Bulk import functionality
  async bulkImportAnime(
    titles: string[],
    includeEpisodes: boolean = false,
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      results: [],
    };

    for (const title of titles) {
      try {
        const searchResults = await this.enhancedSearch(title.trim(), 1);

        if (searchResults.length > 0) {
          const anime = searchResults[0];
          let episodes: AnimeEpisodeData[] = [];

          // Get episodes if requested and mal_id exists
          if (includeEpisodes && anime.mal_id) {
            episodes = await this.getAllEpisodesJikan(anime.mal_id);
          }

          const processedAnime = this.convertToAnimeData(anime, episodes);
          result.results.push(processedAnime);
          result.imported++;
        } else {
          result.failed++;
          result.errors.push({
            title: title.trim(),
            error: "Anime not found in any API",
          });
        }

        // Add delay between requests
        await this.delay(2000);
      } catch (error) {
        result.failed++;
        result.errors.push({
          title: title.trim(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  // Convert API data to internal format
  convertToAnimeData(
    apiData: AnimeApiData,
    episodes: AnimeEpisodeData[] = [],
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
      Mystery: { tr: "Gizem", en: "Mystery" },
      Ecchi: { tr: "Ecchi", en: "Ecchi" },
      Harem: { tr: "Harem", en: "Harem" },
      Josei: { tr: "Josei", en: "Josei" },
      Shoujo: { tr: "Shoujo", en: "Shoujo" },
      Shounen: { tr: "Shounen", en: "Shounen" },
      Seinen: { tr: "Seinen", en: "Seinen" },
    };

    const genres = apiData.genres?.map((g) => g.name) || ["Action"];
    const genreTr = genres.map((g) => genreMapping[g]?.tr || g);
    const genreEn = genres.map((g) => genreMapping[g]?.en || g);

    const status = this.mapStatus(apiData.status);
    const category = this.mapCategory(apiData.type);

    return {
      title: apiData.title_japanese || apiData.title,
      titleEn: apiData.title_english || apiData.title,
      titleTr: apiData.title_turkish || apiData.title,
      poster:
        apiData.images?.jpg?.large_image_url ||
        apiData.images?.jpg?.image_url ||
        apiData.images?.webp?.large_image_url ||
        apiData.images?.webp?.image_url ||
        "https://via.placeholder.com/400x600",
      banner:
        apiData.images?.jpg?.large_image_url ||
        apiData.images?.webp?.large_image_url ||
        "https://via.placeholder.com/800x300",
      rating: apiData.score || 7.0,
      year: apiData.year || new Date().getFullYear(),
      episodes: apiData.episodes || episodes.length || 12,
      genre: genreTr,
      genreEn: genreEn,
      duration: this.parseDuration(apiData.duration),
      description:
        apiData.synopsis || `${apiData.title} - Açıklama yakında eklenecek`,
      descriptionEn:
        apiData.synopsis || `${apiData.title} - Description coming soon`,
      status: status,
      category: category,
      trailer: apiData.trailer?.youtube_id || "",
      studio: apiData.studios?.map((s) => s.name).join(", ") || "Bilinmiyor",
      producer: apiData.producers?.map((p) => p.name).join(", ") || "",
      season: apiData.season || "",
      source: apiData.source || "",
      aired: apiData.aired?.string || "",
      broadcast: apiData.broadcast?.string || "",
      externalLinks: apiData.external || [],
      streamingLinks: apiData.streaming || [],
      malId: apiData.mal_id,
      episodeList: episodes.map((ep, index) => ({
        episodeNumber: index + 1,
        title: ep.title || `Bölüm ${index + 1}`,
        titleEn: ep.title || `Episode ${index + 1}`,
        description: ep.synopsis || `${index + 1}. bölüm açıklaması`,
        descriptionEn: ep.synopsis || `Episode ${index + 1} description`,
        duration: this.parseDuration(apiData.duration),
        airDate: ep.aired || new Date().toISOString().split("T")[0],
        videoUrl: ep.video_url || "",
        malId: ep.mal_id,
      })),
    };
  }

  private mapStatus(status?: string): "ongoing" | "completed" | "upcoming" {
    if (!status) return "upcoming";
    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("airing") ||
      statusLower.includes("currently") ||
      statusLower.includes("releasing")
    ) {
      return "ongoing";
    }
    if (statusLower.includes("finished") || statusLower.includes("complete")) {
      return "completed";
    }
    return "upcoming";
  }

  private mapCategory(type?: string): "anime" | "movie" {
    if (!type) return "anime";
    const typeLower = type.toLowerCase();
    if (typeLower.includes("movie") || typeLower.includes("film")) {
      return "movie";
    }
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

    // If it's just a number, assume it's minutes
    const numberOnly = duration.match(/^\d+$/);
    if (numberOnly) {
      return `${duration}min`;
    }

    return duration.includes("min") ? duration : `${duration}min`;
  }

  // Image enhancement
  async enhanceImages(anime: any): Promise<any> {
    try {
      const improvements: any = {};

      if (anime.malId) {
        const freshData = await this.getAnimeByIdJikan(anime.malId);
        if (freshData) {
          const newPoster =
            freshData.images?.jpg?.large_image_url ||
            freshData.images?.webp?.large_image_url;

          if (newPoster && newPoster !== anime.poster) {
            improvements.poster = newPoster;
          }

          if (
            freshData.images?.jpg?.large_image_url &&
            freshData.images.jpg.large_image_url !== anime.banner
          ) {
            improvements.banner = freshData.images.jpg.large_image_url;
          }
        }
      }

      return Object.keys(improvements).length > 0 ? improvements : null;
    } catch (error) {
      console.error("Image enhancement failed:", error);
      return null;
    }
  }

  // Get detailed anime information
  async getAnimeDetails(malId: number): Promise<any> {
    try {
      const [animeData, episodes] = await Promise.allSettled([
        this.getAnimeByIdJikan(malId),
        this.getAllEpisodesJikan(malId),
      ]);

      let anime = null;
      let episodeList: AnimeEpisodeData[] = [];

      if (animeData.status === "fulfilled" && animeData.value) {
        anime = animeData.value;
      }

      if (episodes.status === "fulfilled") {
        episodeList = episodes.value;
      }

      if (anime) {
        return this.convertToAnimeData(anime, episodeList);
      }

      return null;
    } catch (error) {
      console.error("Get anime details failed:", error);
      return null;
    }
  }
}

export const advancedAnimeAPI = new AdvancedAnimeAPI();
