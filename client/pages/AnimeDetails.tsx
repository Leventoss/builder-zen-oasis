import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Plus,
  Heart,
  Clock,
  Star,
  Calendar,
  Download,
  Share2,
  Bookmark,
  ChevronLeft,
  Users,
  Eye,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import EnhancedVideoPlayer from "@/components/EnhancedVideoPlayer";
import AnimeCard from "@/components/AnimeCard";
import { useAnimeStore } from "@/lib/animeStore";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export default function AnimeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const {
    animes,
    getEpisodesByAnimeId,
    getUserList,
    addToList,
    removeFromList,
    updateWatchProgress,
  } = useAnimeStore();

  const [selectedTab, setSelectedTab] = useState("episodes");
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const anime = animes.find((a) => a.id === id);
  const episodes = getEpisodesByAnimeId(id || "");

  useEffect(() => {
    // Don't show error immediately, give some time for anime store to load
    const checkAnimeTimeout = setTimeout(() => {
      if (!anime && animes.length > 0) {
        toast({
          title: "Anime Bulunamadı",
          description: "Aradığınız anime bulunamadı",
          variant: "destructive",
        });
        setTimeout(() => navigate("/"), 2000);
      }
    }, 1000);

    // Check if anime is in user's lists
    if (isAuthenticated && anime) {
      const watchlist = getUserList("user", "watchlist");
      const favorites = getUserList("user", "favorites");
      setIsInWatchlist(watchlist.includes(anime.id));
      setIsFavorite(favorites.includes(anime.id));
    }

    return () => clearTimeout(checkAnimeTimeout);
  }, [anime, isAuthenticated, navigate, getUserList, animes, id]);

  if (!anime) {
    return (
      <div className="min-h-screen bg-anime-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Anime Bulunamadı
          </h1>
          <Button
            onClick={() => navigate("/")}
            className="bg-anime-accent hover:bg-anime-accent/80 text-white"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  const handleWatchlistToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Giriş Yapın",
        description: "Bu özelliği kullanmak için giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      return;
    }

    if (isInWatchlist) {
      removeFromList("user", anime.id, "watchlist");
      setIsInWatchlist(false);
      toast({
        title: "Listeden Çıkarıldı",
        description: "Anime izleme listenizden çıkarıldı",
      });
    } else {
      addToList("user", anime.id, "watchlist");
      setIsInWatchlist(true);
      toast({
        title: "Listeye Eklendi",
        description: "Anime izleme listenize eklendi",
      });
    }
  };

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Giriş Yapın",
        description: "Bu özelliği kullanmak için giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite) {
      removeFromList("user", anime.id, "favorites");
      setIsFavorite(false);
      toast({
        title: "Favorilerden Çıkarıldı",
        description: "Anime favorilerinizden çıkarıldı",
      });
    } else {
      addToList("user", anime.id, "favorites");
      setIsFavorite(true);
      toast({
        title: "Favorilere Eklendi",
        description: "Anime favorilerinize eklendi",
      });
    }
  };

  const handlePlayEpisode = (episodeNumber: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Giriş Yapın",
        description: "Animeleri izlemek için giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      return;
    }

    setSelectedEpisode(episodeNumber);
    setShowPlayer(true);

    // Update watch progress
    updateWatchProgress(anime.id, episodeNumber, 0);
  };

  const handleStartWatching = () => {
    if (episodes.length > 0) {
      handlePlayEpisode(1);
    } else {
      // Show anime details instead of error
      setSelectedTab("details");
      toast({
        title: "Bölüm Bulunamadı",
        description:
          "Bu anime için henüz bölüm eklenmemiş. Detayları görüntüleniyor.",
      });
    }
  };

  // Mock data for demo
  const relatedAnimes = animes
    .filter(
      (a) => a.id !== anime.id && a.genre.some((g) => anime.genre.includes(g)),
    )
    .slice(0, 6);

  const comments = [
    {
      id: 1,
      user: "AnimeOtaku2024",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      comment: "Harika bir anime! Karakterler çok iyi geliştirilmiş.",
      likes: 24,
      timestamp: "2 saat önce",
    },
    {
      id: 2,
      user: "MangaLover",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
      comment: "Animasyon kalitesi çok yüksek, gerçekten etkileyici.",
      likes: 18,
      timestamp: "5 saat önce",
    },
  ];

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />

      {/* Enhanced Video Player Modal */}
      {showPlayer && selectedEpisode && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative h-full">
            <Button
              onClick={() => setShowPlayer(false)}
              className="absolute top-4 right-4 z-10 bg-anime-accent/80 hover:bg-anime-accent text-white"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <EnhancedVideoPlayer
              src={`https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`}
              poster={anime.banner || anime.poster}
              title={`${language === "en" ? anime.titleEn : anime.title} - Bölüm ${selectedEpisode}`}
              subtitles={[
                {
                  label: "Türkçe",
                  src: "/subtitles/turkish.vtt",
                  srcLang: "tr",
                },
                {
                  label: "English",
                  src: "/subtitles/english.vtt",
                  srcLang: "en",
                },
              ]}
              onProgress={(progress) =>
                updateWatchProgress(anime.id, selectedEpisode, progress)
              }
              onEnded={() => {
                // Auto-play next episode
                if (selectedEpisode < episodes.length) {
                  setSelectedEpisode(selectedEpisode + 1);
                  toast({
                    title: "Sonraki Bölüm",
                    description: `Bölüm ${selectedEpisode + 1} başlatılıyor...`,
                  });
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="pt-16">
        {/* Hero Section with Banner */}
        <section className="relative h-[70vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={anime.banner || anime.poster}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-anime-dark via-anime-dark/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-anime-dark/80 via-transparent to-anime-dark/40" />
          </div>

          <div className="relative z-10 container mx-auto px-4 h-full flex items-end">
            <div className="pb-16 max-w-3xl">
              <div className="flex items-center space-x-4 mb-4">
                <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/50">
                  {anime.category === "movie" ? "Film" : "Anime"}
                </Badge>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{anime.rating}</span>
                  <span>•</span>
                  <span>{anime.year}</span>
                  <span>•</span>
                  <Clock className="h-4 w-4" />
                  <span>
                    {anime.episodes} {t.episodes}
                  </span>
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                {language === "en" ? anime.titleEn : anime.title}
              </h1>

              <p className="text-lg text-gray-300 mb-6 leading-relaxed max-w-2xl">
                {language === "en" ? anime.descriptionEn : anime.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {(language === "en" ? anime.genreEn : anime.genre).map(
                  (genre) => (
                    <Badge
                      key={genre}
                      variant="outline"
                      className="border-white/30 text-gray-300"
                    >
                      {genre}
                    </Badge>
                  ),
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  className="bg-anime-accent hover:bg-anime-accent/80 text-white font-bold"
                  onClick={handleStartWatching}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {t.watchNow}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleWatchlistToggle}
                  className={`border-white/20 ${isInWatchlist ? "bg-white/10 text-white" : "text-white hover:bg-white/10"}`}
                >
                  {isInWatchlist ? (
                    <Bookmark className="h-5 w-5 mr-2 fill-current" />
                  ) : (
                    <Plus className="h-5 w-5 mr-2" />
                  )}
                  {isInWatchlist ? "Listede" : "Listeye Ekle"}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleFavoriteToggle}
                  className={`border-white/20 ${isFavorite ? "bg-red-500/20 text-red-400" : "text-white hover:bg-white/10"}`}
                >
                  <Heart
                    className={`h-5 w-5 mr-2 ${isFavorite ? "fill-current" : ""}`}
                  />
                  {isFavorite ? "Favoride" : "Favorilere Ekle"}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Paylaş
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Tabs */}
        <div className="container mx-auto px-4 py-8">
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 bg-anime-card border border-white/10">
              <TabsTrigger
                value="episodes"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Play className="h-4 w-4 mr-2" />
                Bölümler ({episodes.length})
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Eye className="h-4 w-4 mr-2" />
                Detaylar
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Yorumlar ({comments.length})
              </TabsTrigger>
              <TabsTrigger
                value="related"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Users className="h-4 w-4 mr-2" />
                Benzer Animeler
              </TabsTrigger>
            </TabsList>

            {/* Episodes Tab */}
            <TabsContent value="episodes" className="mt-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Bölümler</h2>
                {episodes.length > 0 ? (
                  <div className="grid gap-3">
                    {episodes.map((episode) => (
                      <div
                        key={episode.id}
                        className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg hover:bg-black/50 transition-colors cursor-pointer group"
                        onClick={() => handlePlayEpisode(episode.episodeNumber)}
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-neon-blue/20 rounded-lg flex items-center justify-center group-hover:bg-neon-blue/40 transition-colors">
                          <Play className="h-5 w-5 text-neon-blue" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">
                            Bölüm {episode.episodeNumber}:{" "}
                            {language === "en"
                              ? episode.titleEn
                              : episode.title}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {language === "en"
                              ? episode.descriptionEn
                              : episode.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{episode.duration}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(episode.airDate).toLocaleDateString(
                                "tr-TR",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      Henüz Bölüm Yok
                    </h3>
                    <p className="text-gray-400">
                      Bu anime için henüz bölüm eklenmemiş
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Anime Detayları
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Genel Bilgiler
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Türkçe Adı:</span>
                        <span className="text-white">{anime.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">İngilizce Adı:</span>
                        <span className="text-white">{anime.titleEn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tür:</span>
                        <span className="text-white">
                          {anime.category === "movie" ? "Film" : "Anime"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Yıl:</span>
                        <span className="text-white">{anime.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bölüm Sayısı:</span>
                        <span className="text-white">{anime.episodes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Süre:</span>
                        <span className="text-white">{anime.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Puan:</span>
                        <span className="text-white flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {anime.rating}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Durum:</span>
                        <Badge
                          variant="outline"
                          className={`${
                            anime.status === "ongoing"
                              ? "border-green-500 text-green-400"
                              : anime.status === "completed"
                                ? "border-blue-500 text-blue-400"
                                : "border-yellow-500 text-yellow-400"
                          }`}
                        >
                          {anime.status === "ongoing"
                            ? "Devam Ediyor"
                            : anime.status === "completed"
                              ? "Tamamlandı"
                              : "Yakında"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Açıklama
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {language === "en"
                        ? anime.descriptionEn
                        : anime.description}
                    </p>

                    <h3 className="text-lg font-semibold text-white mb-4 mt-6">
                      Türler
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(language === "en" ? anime.genreEn : anime.genre).map(
                        (genre) => (
                          <Badge
                            key={genre}
                            variant="outline"
                            className="border-white/30 text-gray-300"
                          >
                            {genre}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Yorumlar</h2>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex space-x-3 p-4 bg-black/30 rounded-lg"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={comment.avatar} alt={comment.user} />
                        <AvatarFallback>
                          {comment.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white">
                            {comment.user}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{comment.comment}</p>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-neon-blue h-6 px-2"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {comment.likes}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Related Anime Tab */}
            <TabsContent value="related" className="mt-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Benzer Animeler
                </h2>
                {relatedAnimes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {relatedAnimes.map((relatedAnime) => (
                      <AnimeCard
                        key={relatedAnime.id}
                        {...relatedAnime}
                        size="sm"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      Benzer Anime Bulunamadı
                    </h3>
                    <p className="text-gray-400">
                      Bu anime ile benzer türde anime bulunamadı
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
