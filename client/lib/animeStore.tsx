import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { animeAPI, adminAPI, userAPI } from "./apiClient";
import { useAuth } from "./auth";
import { sampleAnimes } from "@/components/AnimeCard";

export interface AnimeData {
  id: string;
  title: string;
  titleEn: string;
  poster: string;
  banner?: string;
  rating: number;
  year: number;
  episodes: number;
  genre: string[];
  genreEn: string[];
  duration: string;
  description: string;
  descriptionEn: string;
  status: "ongoing" | "completed" | "upcoming";
  category: "anime" | "movie";
  featured?: number; // 1, 2, or 3 for featured slots
  featuredTitle?: string; // Custom title for featured section
  featuredTitleEn?: string; // Custom English title for featured section
  featuredDescription?: string; // Custom description for featured section
  featuredDescriptionEn?: string; // Custom English description for featured section
  featuredBanner?: string; // Custom banner for featured section
}

export interface Episode {
  id: number;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  videoUrl: string;
  duration: string;
  episodeNumber: number;
  airDate: string;
  animeId: string;
}

export interface WatchProgress {
  userId: string;
  animeId: string;
  episodeId: number;
  progress: number; // Progress in seconds
  duration: number; // Total duration in seconds
  lastWatched: string;
}

export interface UserList {
  userId: string;
  animeId: string;
  addedAt: string;
  type: "watchlist" | "favorites" | "completed";
}

interface AnimeStoreContextType {
  // Anime data
  animes: AnimeData[];
  episodes: Episode[];
  loading: boolean;
  addAnime: (anime: Omit<AnimeData, "id">) => Promise<string>;
  updateAnime: (id: string, anime: Partial<AnimeData>) => Promise<void>;
  deleteAnime: (id: string) => Promise<void>;
  getAnimeById: (id: string) => AnimeData | undefined;
  fetchAnimes: () => Promise<void>;

  // Episode data
  addEpisode: (episode: Omit<Episode, "id">) => Promise<string>;
  updateEpisode: (id: number, episode: Partial<Episode>) => Promise<void>;
  deleteEpisode: (id: number) => Promise<void>;
  getEpisodesByAnimeId: (animeId: string) => Episode[];

  // User progress
  watchProgress: WatchProgress[];
  updateWatchProgress: (
    animeId: string,
    episodeId: number,
    progress: number,
  ) => Promise<void>;
  getUserProgress: (userId: string) => WatchProgress[];

  // User lists
  userLists: UserList[];
  addToList: (
    userId: string,
    animeId: string,
    type: UserList["type"],
  ) => Promise<void>;
  removeFromList: (
    userId: string,
    animeId: string,
    type: UserList["type"],
  ) => Promise<void>;
  getUserList: (userId: string, type: UserList["type"]) => string[];

  // Admin notifications
  notifications: AdminNotification[];
  addNotification: (
    notification: Omit<AdminNotification, "id" | "timestamp">,
  ) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;

  // Utility functions
  refreshAnimes: () => void;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

const AnimeStoreContext = createContext<AnimeStoreContextType | undefined>(
  undefined,
);

export function AnimeStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [animes, setAnimes] = useState<AnimeData[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [watchProgress, setWatchProgress] = useState<WatchProgress[]>([]);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch animes from API
  const fetchAnimes = async () => {
    try {
      setLoading(true);
      const response = await animeAPI.getAll();
      if (response.success) {
        setAnimes(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch animes:", error);

      // If API is not available, use sample data as fallback
      if (
        error instanceof Error &&
        (error.message.includes("Network error") ||
          error.message.includes("Cannot connect"))
      ) {
        console.warn("API not available, using sample data");
        // Only use sample data if we don't already have animes loaded
        if (animes.length === 0) {
          const convertedAnimes = sampleAnimes.map((anime) => ({
            ...anime,
            rating: typeof anime.rating === "number" ? anime.rating : 8.0,
            genre: anime.genre || [],
            genreEn: anime.genreEn || [],
            banner: anime.poster,
            descriptionEn: anime.descriptionEn || anime.description || "",
            duration: anime.duration || "24min",
          }));
          setAnimes(convertedAnimes);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await adminAPI.getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchAnimes();
    if (user?.isAdmin) {
      fetchNotifications();
    }
  }, [user]);

  // Initialize with sample data if no animes exist
  useEffect(() => {
    if (animes.length === 0) {
      const convertedAnimes = sampleAnimes.map((anime) => ({
        ...anime,
        rating: typeof anime.rating === "number" ? anime.rating : 8.0,
        genre: anime.genre || [],
        genreEn: anime.genreEn || [],
        banner: anime.poster,
        descriptionEn: anime.descriptionEn || anime.description || "",
        duration: anime.duration || "24min",
      }));
      setAnimes(convertedAnimes);
    }
  }, []);

  // Anime CRUD operations
  const addAnime = async (
    animeData: Omit<AnimeData, "id">,
  ): Promise<string> => {
    try {
      const response = await animeAPI.create(animeData);
      if (response.success) {
        setAnimes((prev) => [...prev, response.data]);
        return response.data.id;
      }
      throw new Error(response.message || "Failed to create anime");
    } catch (error) {
      console.error("Failed to add anime:", error);
      throw error;
    }
  };

  const updateAnime = async (
    id: string,
    animeData: Partial<AnimeData>,
  ): Promise<void> => {
    try {
      const response = await animeAPI.update(id, animeData);
      if (response.success) {
        // Update local state immediately
        setAnimes((prev) =>
          prev.map((anime) =>
            anime.id === id ? { ...anime, ...response.data } : anime,
          ),
        );

        // Force refresh from server to ensure consistency
        setTimeout(() => {
          fetchAnimes();
        }, 500);
      } else {
        throw new Error(response.message || "Failed to update anime");
      }
    } catch (error) {
      console.error("Failed to update anime:", error);
      throw error;
    }
  };

  const refreshAnimes = () => {
    fetchAnimes();
  };

  const deleteAnime = async (id: string): Promise<void> => {
    try {
      const response = await animeAPI.delete(id);
      if (response.success) {
        setAnimes((prev) => prev.filter((anime) => anime.id !== id));
        setEpisodes((prev) => prev.filter((episode) => episode.animeId !== id));
      } else {
        throw new Error(response.message || "Failed to delete anime");
      }
    } catch (error) {
      console.error("Failed to delete anime:", error);
      throw error;
    }
  };

  const getAnimeById = (id: string): AnimeData | undefined => {
    return animes.find((anime) => anime.id === id);
  };

  // Episode CRUD operations
  const addEpisode = async (
    episodeData: Omit<Episode, "id">,
  ): Promise<string> => {
    try {
      const response = await animeAPI.addEpisode(
        episodeData.animeId,
        episodeData,
      );
      if (response.success) {
        setEpisodes((prev) => [...prev, response.data]);
        return response.data.id.toString();
      }
      throw new Error(response.message || "Failed to add episode");
    } catch (error) {
      console.error("Failed to add episode:", error);
      throw error;
    }
  };

  const updateEpisode = async (id: number, episodeData: Partial<Episode>) => {
    try {
      const response = await animeAPI.updateEpisode(id, episodeData);
      if (response.success) {
        setEpisodes((prev) =>
          prev.map((episode) =>
            episode.id === id ? { ...episode, ...episodeData } : episode,
          ),
        );
      } else {
        throw new Error(response.message || "Failed to update episode");
      }
    } catch (error) {
      console.error("Failed to update episode:", error);
      throw error;
    }
  };

  const deleteEpisode = async (id: number) => {
    try {
      const response = await animeAPI.deleteEpisode(id);
      if (response.success) {
        setEpisodes((prev) => prev.filter((episode) => episode.id !== id));
      } else {
        throw new Error(response.message || "Failed to delete episode");
      }
    } catch (error) {
      console.error("Failed to delete episode:", error);
      throw error;
    }
  };

  const getEpisodesByAnimeId = (animeId: string): Episode[] => {
    return episodes
      .filter((episode) => episode.animeId === animeId)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  };

  // Watch progress
  const updateWatchProgress = async (
    animeId: string,
    episodeId: number,
    progress: number,
  ): Promise<void> => {
    if (!user) return;

    try {
      await userAPI.updateWatchProgress(
        user.id.toString(),
        animeId,
        episodeId.toString(),
        progress,
      );

      setWatchProgress((prev) => {
        const existing = prev.find(
          (p) => p.animeId === animeId && p.episodeId === episodeId,
        );
        if (existing) {
          return prev.map((p) =>
            p.animeId === animeId && p.episodeId === episodeId
              ? { ...p, progress, lastWatched: new Date().toISOString() }
              : p,
          );
        } else {
          return [
            ...prev,
            {
              animeId,
              episodeId,
              progress,
              lastWatched: new Date().toISOString(),
            },
          ];
        }
      });
    } catch (error) {
      console.error("Failed to update watch progress:", error);
      throw error;
    }
  };

  const getUserProgress = (userId: string): WatchProgress[] => {
    return watchProgress.filter((p) => p.animeId.includes(userId));
  };

  // User lists
  const addToList = async (
    userId: string,
    animeId: string,
    type: UserList["type"],
  ): Promise<void> => {
    try {
      await userAPI.addToList(userId, animeId, type);

      const listItem: UserList = {
        userId,
        animeId,
        type,
        addedAt: new Date().toISOString(),
      };
      setUserLists((prev) => [
        ...prev.filter(
          (item) =>
            !(
              item.userId === userId &&
              item.animeId === animeId &&
              item.type === type
            ),
        ),
        listItem,
      ]);
    } catch (error) {
      console.error("Failed to add to list:", error);
      throw error;
    }
  };

  const removeFromList = async (
    userId: string,
    animeId: string,
    type: UserList["type"],
  ): Promise<void> => {
    try {
      await userAPI.removeFromList(userId, animeId, type);

      setUserLists((prev) =>
        prev.filter(
          (item) =>
            !(
              item.userId === userId &&
              item.animeId === animeId &&
              item.type === type
            ),
        ),
      );
    } catch (error) {
      console.error("Failed to remove from list:", error);
      throw error;
    }
  };

  const getUserList = (userId: string, type: UserList["type"]): string[] => {
    return userLists
      .filter((item) => item.userId === userId && item.type === type)
      .map((item) => item.animeId);
  };

  // Notifications
  const addNotification = async (
    notification: Omit<AdminNotification, "id" | "timestamp">,
  ): Promise<void> => {
    try {
      const response = await adminAPI.createNotification(
        notification.title,
        notification.message,
        notification.type,
      );
      if (response.success) {
        setNotifications((prev) => [response.data, ...prev.slice(0, 49)]);
      }
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  };

  const markNotificationRead = async (id: string): Promise<void> => {
    try {
      const response = await adminAPI.markNotificationRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  };

  const clearNotifications = async (): Promise<void> => {
    try {
      const response = await adminAPI.clearNotifications();
      if (response.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      throw error;
    }
  };

  const value: AnimeStoreContextType = {
    animes,
    episodes,
    loading,
    addAnime,
    updateAnime,
    deleteAnime,
    getAnimeById,
    fetchAnimes,
    addEpisode,
    updateEpisode,
    deleteEpisode,
    getEpisodesByAnimeId,
    watchProgress,
    updateWatchProgress,
    getUserProgress,
    userLists,
    addToList,
    removeFromList,
    getUserList,
    notifications,
    addNotification,
    markNotificationRead,
    clearNotifications,
    fetchNotifications,
    refreshAnimes,
  };

  return (
    <AnimeStoreContext.Provider value={value}>
      {children}
    </AnimeStoreContext.Provider>
  );
}

export function useAnimeStore() {
  const context = useContext(AnimeStoreContext);
  if (context === undefined) {
    throw new Error("useAnimeStore must be used within an AnimeStoreProvider");
  }
  return context;
}
