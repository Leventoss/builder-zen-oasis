// Anime API service for external data fetching
export interface ExternalAnimeData {
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
}

class AnimeAPI {
  private baseUrl = 'https://api.jikan.moe/v4';
  private lastRequestTime = 0;
  private requestDelay = 1000; // 1 second delay between requests

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(url: string): Promise<any> {
    // Rate limiting
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  async searchAnime(query: string, limit: number = 20): Promise<ExternalAnimeData[]> {
    try {
      const url = `${this.baseUrl}/anime?q=${encodeURIComponent(query)}&limit=${limit}`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error('Search anime failed:', error);
      return [];
    }
  }

  async getPopularAnime(limit: number = 20): Promise<ExternalAnimeData[]> {
    try {
      const url = `${this.baseUrl}/anime?order_by=score&sort=desc&limit=${limit}`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error('Get popular anime failed:', error);
      return [];
    }
  }

  async getSeasonalAnime(year?: number, season?: string): Promise<ExternalAnimeData[]> {
    try {
      const currentYear = year || new Date().getFullYear();
      const currentSeason = season || this.getCurrentSeason();
      const url = `${this.baseUrl}/seasons/${currentYear}/${currentSeason}`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error('Get seasonal anime failed:', error);
      return [];
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return 'winter';
    if (month >= 4 && month <= 6) return 'spring';
    if (month >= 7 && month <= 9) return 'summer';
    return 'fall';
  }

  convertToAnimeData(externalAnime: ExternalAnimeData, bannerUrl?: string): any {
    const genreMapping: { [key: string]: { tr: string; en: string } } = {
      'Action': { tr: 'Aksiyon', en: 'Action' },
      'Adventure': { tr: 'Macera', en: 'Adventure' },
      'Comedy': { tr: 'Komedi', en: 'Comedy' },
      'Drama': { tr: 'Drama', en: 'Drama' },
      'Fantasy': { tr: 'Fantastik', en: 'Fantasy' },
      'Horror': { tr: 'Korku', en: 'Horror' },
      'Romance': { tr: 'Romantik', en: 'Romance' },
      'Sci-Fi': { tr: 'Bilim Kurgu', en: 'Sci-Fi' },
      'Thriller': { tr: 'Gerilim', en: 'Thriller' },
      'Sports': { tr: 'Spor', en: 'Sports' },
      'Music': { tr: 'Müzikal', en: 'Musical' },
      'School': { tr: 'Okul', en: 'School' },
      'Supernatural': { tr: 'Doğaüstü', en: 'Supernatural' },
      'Psychological': { tr: 'Psikolojik', en: 'Psychological' },
      'Historical': { tr: 'Tarihi', en: 'Historical' },
      'Military': { tr: 'Askeri', en: 'Military' },
      'Slice of Life': { tr: 'Yaşam', en: 'Slice of Life' },
      'Mecha': { tr: 'Mecha', en: 'Mecha' },
    };

    const genres = externalAnime.genres?.map(g => g.name) || ['Action'];
    const genreTr = genres.map(g => genreMapping[g]?.tr || g);
    const genreEn = genres.map(g => genreMapping[g]?.en || g);

    const status = this.mapStatus(externalAnime.status);
    const category = this.mapCategory(externalAnime.type);

    return {
      title: externalAnime.title_japanese || externalAnime.title,
      titleEn: externalAnime.title_english || externalAnime.title,
      poster: externalAnime.images?.jpg?.large_image_url || 
              externalAnime.images?.jpg?.image_url || 
              externalAnime.images?.webp?.large_image_url ||
              externalAnime.images?.webp?.image_url ||
              'https://via.placeholder.com/400x600',
      banner: bannerUrl || externalAnime.images?.jpg?.large_image_url,
      rating: externalAnime.score || 7.0,
      year: externalAnime.year || new Date().getFullYear(),
      episodes: externalAnime.episodes || 12,
      genre: genreTr,
      genreEn: genreEn,
      duration: this.parseDuration(externalAnime.duration),
      description: externalAnime.synopsis || `${externalAnime.title} - Açıklama yakında eklenecek`,
      descriptionEn: externalAnime.synopsis || `${externalAnime.title} - Description coming soon`,
      status: status,
      category: category,
    };
  }

  private mapStatus(status?: string): 'ongoing' | 'completed' | 'upcoming' {
    if (!status) return 'upcoming';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('airing') || statusLower.includes('currently')) return 'ongoing';
    if (statusLower.includes('finished') || statusLower.includes('complete')) return 'completed';
    return 'upcoming';
  }

  private mapCategory(type?: string): 'anime' | 'movie' {
    if (!type) return 'anime';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('movie') || typeLower.includes('film')) return 'movie';
    return 'anime';
  }

  private parseDuration(duration?: string): string {
    if (!duration) return '24min';
    
    // Extract numbers from duration string
    const minutes = duration.match(/(\d+)\s*min/);
    if (minutes) {
      return `${minutes[1]}min`;
    }
    
    const hours = duration.match(/(\d+)\s*hr/);
    if (hours) {
      return `${parseInt(hours[1]) * 60}min`;
    }
    
    return '24min';
  }

  // Image quality detection and enhancement
  isLowQualityImage(imageUrl: string): boolean {
    if (!imageUrl) return true;
    
    // Check for placeholder images
    if (imageUrl.includes('placeholder') || 
        imageUrl.includes('via.placeholder') ||
        imageUrl.includes('example.com')) {
      return true;
    }
    
    // Check for low resolution indicators in URL
    const lowResIndicators = ['small', 'thumb', 'mini', '_s.', '_t.'];
    return lowResIndicators.some(indicator => imageUrl.includes(indicator));
  }

  async getHighQualityPoster(title: string): Promise<string | null> {
    try {
      const searchResults = await this.searchAnime(title, 1);
      if (searchResults.length > 0) {
        const anime = searchResults[0];
        return anime.images?.jpg?.large_image_url || 
               anime.images?.jpg?.image_url ||
               anime.images?.webp?.large_image_url ||
               anime.images?.webp?.image_url ||
               null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get high quality poster:', error);
      return null;
    }
  }

  async searchBannerImage(title: string): Promise<string | null> {
    try {
      // Try to get a banner-style image from the anime data
      const searchResults = await this.searchAnime(title, 1);
      if (searchResults.length > 0) {
        const anime = searchResults[0];
        // Use the large image as banner if available
        return anime.images?.jpg?.large_image_url || 
               anime.images?.webp?.large_image_url ||
               null;
      }
      return null;
    } catch (error) {
      console.error('Failed to search banner image:', error);
      return null;
    }
  }

  async enhanceAnimeImages(anime: { id: string; title: string; poster?: string; banner?: string }) {
    try {
      const improvements: any = {};
      
      // Check if poster needs improvement
      if (this.isLowQualityImage(anime.poster || '')) {
        const newPoster = await this.getHighQualityPoster(anime.title);
        if (newPoster) {
          improvements.poster = newPoster;
        }
      }
      
      // Check if banner needs improvement
      if (this.isLowQualityImage(anime.banner || '')) {
        const newBanner = await this.searchBannerImage(anime.title);
        if (newBanner) {
          improvements.banner = newBanner;
        }
      }
      
      return Object.keys(improvements).length > 0 ? improvements : null;
    } catch (error) {
      console.error('Failed to enhance anime images:', error);
      return null;
    }
  }

  // Additional utility functions for admin panel
  async getRandomAnimeRecommendations(count: number = 5): Promise<ExternalAnimeData[]> {
    try {
      const url = `${this.baseUrl}/recommendations/anime`;
      const data = await this.makeRequest(url);
      return (data.data || []).slice(0, count);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  async getTopAnime(type: 'tv' | 'movie' | 'ova' = 'tv', limit: number = 20): Promise<ExternalAnimeData[]> {
    try {
      const url = `${this.baseUrl}/top/anime?type=${type}&limit=${limit}`;
      const data = await this.makeRequest(url);
      return data.data || [];
    } catch (error) {
      console.error('Failed to get top anime:', error);
      return [];
    }
  }
}

export const animeAPI = new AnimeAPI();
