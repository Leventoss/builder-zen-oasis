// API Client for communicating with backend

const API_BASE = "/api";

// Auth token management
export const authToken = {
  get: () => localStorage.getItem("aniwa_auth_token"),
  set: (token: string) => localStorage.setItem("aniwa_auth_token", token),
  remove: () => localStorage.removeItem("aniwa_auth_token"),
};

// Base API request function with retry mechanism
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = authToken.get();
  if (token && config.headers) {
    (config.headers as Record<string, string>)["Authorization"] =
      `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);

    // Check if response is ok before trying to read body
    if (!response.ok) {
      let errorMessage = "API request failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If we can't parse JSON, use default message
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);

    // If it's a network error and we haven't retried yet, try once more
    if (error instanceof TypeError &&
        error.message === 'Failed to fetch' &&
        retryCount < 1) {
      console.warn(`Retrying API request to ${endpoint} (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return apiRequest<T>(endpoint, options, retryCount + 1);
    }

    // If it's still a network error after retry, provide more context
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error - API server may not be accessible in this environment');
      throw new Error(`Network error: Cannot connect to API server at ${url}`);
    }

    throw error;
  }
}

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{
      success: boolean;
      message?: string;
      user?: any;
      token?: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      authToken.set(response.token);
    }

    return response;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await apiRequest<{
      success: boolean;
      message?: string;
      user?: any;
      token?: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    if (response.success && response.token) {
      authToken.set(response.token);
    }

    return response;
  },

  verifyToken: async (token: string) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
      user?: any;
    }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  logout: () => {
    authToken.remove();
  },
};

// Anime API
export const animeAPI = {
  getAll: async () => {
    return await apiRequest<{
      success: boolean;
      data: any[];
    }>("/animes");
  },

  getById: async (id: string) => {
    return await apiRequest<{
      success: boolean;
      data: {
        anime: any;
        episodes: any[];
      };
    }>(`/animes/${id}`);
  },

  create: async (animeData: any) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
      data: any;
    }>("/animes", {
      method: "POST",
      body: JSON.stringify(animeData),
    });
  },

  update: async (id: string, animeData: any) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
      data: any;
    }>(`/animes/${id}`, {
      method: "PUT",
      body: JSON.stringify(animeData),
    });
  },

  delete: async (id: string) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
    }>(`/animes/${id}`, {
      method: "DELETE",
    });
  },

  addEpisode: async (animeId: string, episodeData: any) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
      data: any;
    }>(`/animes/${animeId}/episodes`, {
      method: "POST",
      body: JSON.stringify(episodeData),
    });
  },
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    return await apiRequest<{
      success: boolean;
      data: {
        totalUsers: number;
        totalAnimes: number;
        totalEpisodes: number;
        todayWatches: number;
      };
    }>("/admin/stats");
  },

  getUsers: async () => {
    return await apiRequest<{
      success: boolean;
      data: any[];
    }>("/admin/users");
  },

  getNotifications: async () => {
    return await apiRequest<{
      success: boolean;
      data: any[];
    }>("/admin/notifications");
  },

  markNotificationRead: async (id: string) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
    }>(`/admin/notifications/${id}/read`, {
      method: "PUT",
    });
  },

  createNotification: async (title: string, message: string, type: string) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
      data: any;
    }>("/admin/notifications", {
      method: "POST",
      body: JSON.stringify({ title, message, type }),
    });
  },

  clearNotifications: async () => {
    return await apiRequest<{
      success: boolean;
      message?: string;
    }>("/admin/notifications", {
      method: "DELETE",
    });
  },
};

// User API
export const userAPI = {
  getWatchProgress: async (userId: string) => {
    return await apiRequest<{
      success: boolean;
      data: any[];
    }>(`/users/${userId}/progress`);
  },

  updateWatchProgress: async (
    userId: string,
    animeId: string,
    episodeId: string,
    progress: number,
  ) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
    }>(`/users/${userId}/progress`, {
      method: "PUT",
      body: JSON.stringify({ animeId, episodeId, progress }),
    });
  },

  getUserList: async (userId: string, listType: string) => {
    return await apiRequest<{
      success: boolean;
      data: any[];
    }>(`/users/${userId}/list/${listType}`);
  },

  addToList: async (userId: string, animeId: string, listType: string) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
    }>(`/users/${userId}/list`, {
      method: "POST",
      body: JSON.stringify({ animeId, listType }),
    });
  },

  removeFromList: async (userId: string, animeId: string, listType: string) => {
    return await apiRequest<{
      success: boolean;
      message?: string;
    }>(`/users/${userId}/list`, {
      method: "DELETE",
      body: JSON.stringify({ animeId, listType }),
    });
  },
};
