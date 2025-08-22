import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  User,
  Clock,
  Heart,
  Settings,
  Trash2,
  Play,
  Star,
  Calendar,
  Download,
  Bookmark,
  History,
  Shield,
  Bell,
  Globe,
  Palette,
  Monitor,
  Camera,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";
import AnimeCard from "@/components/AnimeCard";
import { useAnimeStore } from "@/lib/animeStore";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { user, updateUser } = useAuth();
  const {
    animes,
    getUserList,
    addToList,
    removeFromList,
    getUserProgress,
    updateWatchProgress,
  } = useAnimeStore();

  const [searchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab || "overview";
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  // User preferences
  const [preferences, setPreferences] = useState({
    notifications: {
      newEpisodes: true,
      recommendations: true,
      email: false,
    },
    privacy: {
      showWatchlist: true,
      showActivity: true,
      allowRecommendations: true,
    },
    playback: {
      autoPlay: true,
      autoNext: true,
      quality: "auto",
      subtitles: true,
    },
    theme: {
      darkMode: true,
      accentColor: "blue",
    },
  });

  useEffect(() => {
    // Load user preferences from localStorage
    const savedPrefs = localStorage.getItem(`aniwa_preferences_${user?.id}`);
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error("Failed to load preferences:", e);
      }
    }
  }, [user?.id]);

  const savePreferences = () => {
    localStorage.setItem(
      `aniwa_preferences_${user?.id}`,
      JSON.stringify(preferences),
    );
    toast({
      title: "Ayarlar Kaydedildi",
      description: "Tercihleriniz başarıyla güncellendi",
    });
  };

  // Get user data
  const watchlist = getUserList(user?.id?.toString() || "", "watchlist");
  const favorites = getUserList(user?.id?.toString() || "", "favorites");
  const completed = getUserList(user?.id?.toString() || "", "completed");
  const progress = getUserProgress(user?.id?.toString() || "");

  // Filter animes for each category
  const watchlistAnimes = animes.filter((anime) =>
    watchlist.includes(anime.id),
  );
  const favoriteAnimes = animes.filter((anime) => favorites.includes(anime.id));
  const completedAnimes = animes.filter((anime) =>
    completed.includes(anime.id),
  );

  // Continue watching (animes with progress)
  const continueWatching = animes
    .filter((anime) => progress.some((p) => p.animeId === anime.id))
    .map((anime) => {
      const animeProgress = progress.find((p) => p.animeId === anime.id);
      return {
        ...anime,
        progress: animeProgress?.progress || 0,
        lastWatched: animeProgress?.lastWatched || "",
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime(),
    );

  // Watch history (last 20 items)
  const watchHistory = progress
    .sort(
      (a, b) =>
        new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime(),
    )
    .slice(0, 20)
    .map((p) => {
      const anime = animes.find((a) => a.id === p.animeId);
      return anime
        ? { ...anime, lastWatched: p.lastWatched, progress: p.progress }
        : null;
    })
    .filter(Boolean);

  const handleSaveProfile = () => {
    if (editedUser) {
      updateUser(editedUser);
      setIsEditing(false);
      toast({
        title: "Profil Güncellendi",
        description: "Profil bilgileriniz başarıyla güncellendi",
      });
    }
  };

  const handleAddToWatchlist = (animeId: string) => {
    if (watchlist.includes(animeId)) {
      removeFromList(user?.id || "", animeId, "watchlist");
      toast({
        title: "Listeden Çıkarıldı",
        description: "Anime izleme listenizden çıkarıldı",
      });
    } else {
      addToList(user?.id || "", animeId, "watchlist");
      toast({
        title: "Listeye Eklendi",
        description: "Anime izleme listenize eklendi",
      });
    }
  };

  const handleAddToFavorites = (animeId: string) => {
    if (favorites.includes(animeId)) {
      removeFromList(user?.id || "", animeId, "favorites");
      toast({
        title: "Favorilerden Çıkarıldı",
        description: "Anime favorilerinizden çıkarıldı",
      });
    } else {
      addToList(user?.id || "", animeId, "favorites");
      toast({
        title: "Favorilere Eklendi",
        description: "Anime favorilerinize eklendi",
      });
    }
  };

  const stats = {
    totalWatched: completedAnimes.length,
    totalEpisodes: progress.length,
    watchTime: Math.floor(Math.random() * 500) + 100, // Mock data
    favoriteGenre: "Aksiyon", // Mock data
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Giriş Yapmanız Gerekiyor
            </h1>
            <p className="text-gray-400">
              Profil sayfasını görüntülemek için lütfen giriş yapın.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />

      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-anime-card p-6 rounded-lg border border-white/10 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="bg-neon-blue text-black text-2xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 border-white/20 bg-anime-card"
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editedUser?.username || ""}
                      onChange={(e) =>
                        setEditedUser((prev) =>
                          prev ? { ...prev, username: e.target.value } : null,
                        )
                      }
                      className="bg-black/50 border-white/20 text-white"
                      placeholder="Kullanıcı Adı"
                    />
                    <Input
                      value={editedUser?.email || ""}
                      onChange={(e) =>
                        setEditedUser((prev) =>
                          prev ? { ...prev, email: e.target.value } : null,
                        )
                      }
                      className="bg-black/50 border-white/20 text-white"
                      placeholder="E-posta"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSaveProfile}
                        size="sm"
                        className="btn-primary"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Kaydet
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedUser(user);
                        }}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white"
                      >
                        <X className="h-4 w-4 mr-2" />
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-white">
                        {user.username}
                      </h1>
                      <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/50">
                        {user.isAdmin ? "Admin" : "Kullanıcı"}
                      </Badge>
                    </div>
                    <p className="text-gray-400 mb-3">{user.email}</p>
                    <p className="text-gray-300 text-sm mb-4">
                      Üyelik:{" "}
                      {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Profili Düzenle
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-black/30 p-3 rounded">
                  <div className="text-2xl font-bold text-neon-blue">
                    {stats.totalWatched}
                  </div>
                  <div className="text-xs text-gray-400">Tamamlanan</div>
                </div>
                <div className="bg-black/30 p-3 rounded">
                  <div className="text-2xl font-bold text-neon-purple">
                    {watchlist.length}
                  </div>
                  <div className="text-xs text-gray-400">Listede</div>
                </div>
                <div className="bg-black/30 p-3 rounded">
                  <div className="text-2xl font-bold text-neon-pink">
                    {favorites.length}
                  </div>
                  <div className="text-xs text-gray-400">Favori</div>
                </div>
                <div className="bg-black/30 p-3 rounded">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.watchTime}h
                  </div>
                  <div className="text-xs text-gray-400">İzleme</div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 bg-anime-card border border-white/10">
              <TabsTrigger
                value="overview"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <User className="h-4 w-4 mr-2" />
                Genel
              </TabsTrigger>
              <TabsTrigger
                value="watchlist"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Listem
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <History className="h-4 w-4 mr-2" />
                Geçmiş
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Heart className="h-4 w-4 mr-2" />
                Favoriler
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Settings className="h-4 w-4 mr-2" />
                Ayarlar
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6">
                {/* Continue Watching */}
                {continueWatching.length > 0 && (
                  <Card className="bg-anime-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-neon-blue" />
                        Kaldığın Yerden Devam Et
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {continueWatching.slice(0, 8).map((anime) => (
                          <div key={anime.id} className="relative">
                            <AnimeCard
                              {...anime}
                              size="sm"
                              showProgress={true}
                              progress={anime.progress}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                <Card className="bg-anime-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-neon-purple" />
                      Son Aktiviteler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {watchHistory.slice(0, 5).map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-black/30 rounded-lg"
                        >
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              {language === "en" ? item.titleEn : item.title}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {new Date(item.lastWatched).toLocaleDateString(
                                "tr-TR",
                              )}{" "}
                              tarihinde izlendi
                            </p>
                            <div className="w-32 h-1 bg-gray-700 rounded-full mt-2">
                              <div
                                className="h-full bg-neon-blue rounded-full"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Watchlist Tab */}
            <TabsContent value="watchlist" className="mt-6">
              <Card className="bg-anime-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <Bookmark className="h-5 w-5 mr-2 text-neon-blue" />
                      İzleme Listem ({watchlist.length})
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Daha sonra izlemek istediğiniz animeler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {watchlistAnimes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {watchlistAnimes.map((anime) => (
                        <div key={anime.id} className="relative group">
                          <AnimeCard {...anime} size="sm" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddToWatchlist(anime.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 border-red-500 text-white hover:bg-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Bookmark className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">
                        İzleme listeniz boş
                      </h3>
                      <p className="text-gray-400">
                        Animeleri izleme listenize ekleyerek burada
                        görebilirsiniz
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <Card className="bg-anime-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <History className="h-5 w-5 mr-2 text-neon-purple" />
                    İzleme Geçmişi
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Son izlediğiniz animeler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {watchHistory.length > 0 ? (
                    <div className="space-y-3">
                      {watchHistory.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg hover:bg-black/40 transition-colors"
                        >
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-1">
                              {language === "en" ? item.titleEn : item.title}
                            </h4>
                            <p className="text-gray-400 text-sm mb-2">
                              {new Date(item.lastWatched).toLocaleDateString(
                                "tr-TR",
                              )}{" "}
                              •{" "}
                              {new Date(item.lastWatched).toLocaleTimeString(
                                "tr-TR",
                              )}
                            </p>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 h-2 bg-gray-700 rounded-full">
                                <div
                                  className="h-full bg-neon-blue rounded-full transition-all"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">
                                {Math.round(item.progress)}%
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="btn-primary"
                            onClick={() =>
                              (window.location.href = `/anime/${item.id}`)
                            }
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Devam Et
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">
                        İzleme geçmişiniz boş
                      </h3>
                      <p className="text-gray-400">
                        İzlediğiniz animeler burada görünecek
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="mt-6">
              <Card className="bg-anime-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-neon-pink" />
                      Favorilerim ({favorites.length})
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    En sevdiğiniz animeler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favoriteAnimes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {favoriteAnimes.map((anime) => (
                        <div key={anime.id} className="relative group">
                          <AnimeCard {...anime} size="sm" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddToFavorites(anime.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 border-red-500 text-white hover:bg-red-500"
                          >
                            <Heart className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">
                        Favori listeniz boş
                      </h3>
                      <p className="text-gray-400">
                        Beğendiğiniz animeleri favorilere ekleyerek burada
                        görebilirsiniz
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <div className="grid gap-6">
                {/* General Settings */}
                <Card className="bg-anime-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-neon-blue" />
                      Genel Ayarlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Dil</Label>
                        <p className="text-sm text-gray-400">Arayüz dili</p>
                      </div>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-32 bg-black/50 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-anime-card border-white/10">
                          <SelectItem value="tr" className="text-white">
                            Türkçe
                          </SelectItem>
                          <SelectItem value="en" className="text-white">
                            English
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Tema</Label>
                        <p className="text-sm text-gray-400">
                          Koyu tema (önerilir)
                        </p>
                      </div>
                      <Switch
                        checked={preferences.theme.darkMode}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            theme: { ...prev.theme, darkMode: checked },
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="bg-anime-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-neon-purple" />
                      Bildirim Ayarları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">
                          Yeni Bölüm Bildirimleri
                        </Label>
                        <p className="text-sm text-gray-400">
                          İzlediğiniz animelerin yeni bölümleri için bildirim
                          alın
                        </p>
                      </div>
                      <Switch
                        checked={preferences.notifications.newEpisodes}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              newEpisodes: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Öneri Bildirimleri</Label>
                        <p className="text-sm text-gray-400">
                          Size özel anime önerileri için bildirim alın
                        </p>
                      </div>
                      <Switch
                        checked={preferences.notifications.recommendations}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              recommendations: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">
                          E-posta Bildirimleri
                        </Label>
                        <p className="text-sm text-gray-400">
                          Önemli güncellemeler için e-posta alın
                        </p>
                      </div>
                      <Switch
                        checked={preferences.notifications.email}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              email: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Playback Settings */}
                <Card className="bg-anime-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Monitor className="h-5 w-5 mr-2 text-neon-pink" />
                      Oynatma Ayarları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Otomatik Oynat</Label>
                        <p className="text-sm text-gray-400">
                          Video oynatıcısı açıldığında otomatik başlat
                        </p>
                      </div>
                      <Switch
                        checked={preferences.playback.autoPlay}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            playback: { ...prev.playback, autoPlay: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Sonraki Bölüm</Label>
                        <p className="text-sm text-gray-400">
                          Bölüm bittiğinde otomatik olarak sonraki bölümü oynat
                        </p>
                      </div>
                      <Switch
                        checked={preferences.playback.autoNext}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            playback: { ...prev.playback, autoNext: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Video Kalitesi</Label>
                        <p className="text-sm text-gray-400">
                          Varsayılan video kalitesi
                        </p>
                      </div>
                      <Select
                        value={preferences.playback.quality}
                        onValueChange={(value) =>
                          setPreferences((prev) => ({
                            ...prev,
                            playback: { ...prev.playback, quality: value },
                          }))
                        }
                      >
                        <SelectTrigger className="w-32 bg-black/50 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-anime-card border-white/10">
                          <SelectItem value="auto" className="text-white">
                            Otomatik
                          </SelectItem>
                          <SelectItem value="1080p" className="text-white">
                            1080p
                          </SelectItem>
                          <SelectItem value="720p" className="text-white">
                            720p
                          </SelectItem>
                          <SelectItem value="480p" className="text-white">
                            480p
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card className="bg-anime-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-yellow-400" />
                      Gizlilik Ayarları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">
                          İzleme Listesini Göster
                        </Label>
                        <p className="text-sm text-gray-400">
                          Diğer kullanıcılar izleme listenizi görebilsin
                        </p>
                      </div>
                      <Switch
                        checked={preferences.privacy.showWatchlist}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            privacy: {
                              ...prev.privacy,
                              showWatchlist: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">
                          Aktiviteleri Göster
                        </Label>
                        <p className="text-sm text-gray-400">
                          Son izlediğiniz animeler görünür olsun
                        </p>
                      </div>
                      <Switch
                        checked={preferences.privacy.showActivity}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, showActivity: checked },
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={savePreferences} className="btn-primary">
                    <Settings className="h-4 w-4 mr-2" />
                    Ayarları Kaydet
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
