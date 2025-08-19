import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI, authToken } from "./apiClient";

// Kullanıcı tipi
export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isPremium: boolean;
  premiumExpiresAt?: string;
  discordId?: string;
  discordUsername?: string;
}

// Auth context tipi
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  loginWithDiscord: () => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  loading: boolean;
  checkPremiumStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde token'ı kontrol et
    const checkAuth = async () => {
      // Check for Discord auth callback
      const urlParams = new URLSearchParams(window.location.search);
      const discordToken = urlParams.get('token');
      const discordAuth = urlParams.get('discord_auth');

      if (discordAuth === 'success' && discordToken) {
        // Save Discord token and verify it
        authToken.set(discordToken);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = authToken.get();
      if (token && token.trim() !== '') {
        try {
          const response = await authAPI.verifyToken(token);
          if (response.success && response.user) {
            setUser({
              id: response.user.id,
              username: response.user.username,
              email: response.user.email,
              isAdmin: response.user.isAdmin,
              isPremium: response.user.isPremium || false,
              premiumExpiresAt: response.user.premiumExpiresAt,
              discordId: response.user.discordId,
              discordUsername: response.user.discordUsername,
            });
          } else {
            // Token is invalid, remove it
            authToken.remove();
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          // Only remove token if it's a real verification failure, not a network error
          if (error instanceof Error && !error.message.includes('Failed to fetch')) {
            authToken.remove();
          }
        }
      } else if (token) {
        // Token exists but is empty/invalid
        authToken.remove();
      }
      setLoading(false);
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    checkAuth();

    return () => clearTimeout(timeout);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);

      if (response.success && response.user) {
        setUser({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          isAdmin: response.user.isAdmin,
          isPremium: response.user.isPremium || false,
          premiumExpiresAt: response.user.premiumExpiresAt,
          discordId: response.user.discordId,
          discordUsername: response.user.discordUsername,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const response = await authAPI.register(username, email, password);

      if (response.success && response.user) {
        setUser({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          isAdmin: response.user.isAdmin,
          isPremium: response.user.isPremium || false,
          premiumExpiresAt: response.user.premiumExpiresAt,
          discordId: response.user.discordId,
          discordUsername: response.user.discordUsername,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const loginWithDiscord = async (): Promise<boolean> => {
    try {
      // Discord OAuth flow will be handled here
      window.location.href = "/api/auth/discord";
      return true;
    } catch (error) {
      console.error("Discord login failed:", error);
      return false;
    }
  };

  const checkPremiumStatus = (): boolean => {
    if (!user?.isPremium) return false;
    if (!user.premiumExpiresAt) return true; // Lifetime premium

    const expiryDate = new Date(user.premiumExpiresAt);
    return expiryDate > new Date();
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    loginWithDiscord,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    isPremium: checkPremiumStatus(),
    loading,
    checkPremiumStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected Route component
export function ProtectedRoute({
  children,
  requireAdmin = false,
  requirePremium = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
  requirePremium?: boolean;
}) {
  const { isAuthenticated, isAdmin, isPremium } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-anime-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Giriş Gerekli</h1>
          <p className="text-gray-400 mb-6">
            Bu sayfayı görmek için giriş yapmalısınız.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-primary"
          >
            Ana Sayfaya Git
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-anime-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Yetkisiz Erişim
          </h1>
          <p className="text-gray-400 mb-6">Bu sayfaya eri��im yetkiniz yok.</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-primary"
          >
            Ana Sayfaya Git
          </button>
        </div>
      </div>
    );
  }

  if (requirePremium && !isPremium) {
    return (
      <div className="min-h-screen bg-anime-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Premium Üyelik Gerekli
          </h1>
          <p className="text-gray-400 mb-6">
            Bu özelliği kullanmak için premium üyelik gerekli.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-primary"
          >
            Ana Sayfaya Git
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
