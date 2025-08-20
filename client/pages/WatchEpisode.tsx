import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Play, Clock, Calendar, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import EnhancedVideoPlayer from "@/components/EnhancedVideoPlayer";
import { useAnimeStore } from "@/lib/animeStore";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

export default function WatchEpisode() {
  const { animeId, episodeNumber } = useParams<{ animeId: string; episodeNumber: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { animes, episodes, updateWatchProgress } = useAnimeStore();

  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // Find current anime and episode
  const anime = animes.find(a => a.id === animeId);
  const animeEpisodes = episodes.filter(ep => ep.animeId === animeId).sort((a, b) => a.episodeNumber - b.episodeNumber);
  const currentEpisode = animeEpisodes.find(ep => ep.episodeNumber === parseInt(episodeNumber || "1"));
  const currentEpisodeIndex = animeEpisodes.findIndex(ep => ep.episodeNumber === parseInt(episodeNumber || "1"));

  useEffect(() => {
    if (!anime) {
      navigate("/");
      return;
    }
    
    if (!currentEpisode) {
      toast({
        title: "Bölüm Bulunamadı",
        description: "İzlemek istediğiniz bölüm bulunamadı.",
        variant: "destructive",
      });
      navigate(`/anime/${animeId}`);
      return;
    }

    setIsLoading(false);
  }, [anime, currentEpisode, animeId, navigate]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleProgress = async (progress: number, duration?: number) => {
    if (isAuthenticated && user && currentEpisode) {
      try {
        await updateWatchProgress(animeId!, currentEpisode.id, progress);
      } catch (error) {
        console.error("Failed to update watch progress:", error);
      }
    }
  };

  const handleEpisodeSelect = (episode: any) => {
    navigate(`/anime/${animeId}/episode/${episode.episodeNumber}`);
  };

  const handleNextEpisode = () => {
    if (currentEpisodeIndex < animeEpisodes.length - 1) {
      const nextEpisode = animeEpisodes[currentEpisodeIndex + 1];
      navigate(`/anime/${animeId}/episode/${nextEpisode.episodeNumber}`);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      const prevEpisode = animeEpisodes[currentEpisodeIndex - 1];
      navigate(`/anime/${animeId}/episode/${prevEpisode.episodeNumber}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-anime-dark flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (!anime || !currentEpisode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />
      
      <div className="pt-16">
        {/* Navigation Bar */}
        <div className="bg-anime-card border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/anime/${animeId}`)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Geri Dön
                </Button>
                
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
                  <span className="text-white font-medium">{anime.title}</span>
                  <span>•</span>
                  <span>Bölüm {currentEpisode.episodeNumber}</span>
                  <span>•</span>
                  <span>{currentEpisode.title}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <Download className="h-4 w-4 mr-2" />
                  İndir
                </Button>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <Share2 className="h-4 w-4 mr-2" />
                  Paylaş
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Video Player */}
            <div className="lg:col-span-3">
              <Card className="bg-black border-white/10 overflow-hidden">
                <div className="aspect-video">
                  <EnhancedVideoPlayer
                    videoUrl={currentEpisode.videoUrl}
                    title={`${anime.title} - Bölüm ${currentEpisode.episodeNumber}`}
                    onTimeUpdate={handleTimeUpdate}
                    onProgress={handleProgress}
                    autoPlay={true}
                  />
                </div>
              </Card>

              {/* Episode Info */}
              <Card className="bg-anime-card border-white/10 mt-4 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Bölüm {currentEpisode.episodeNumber}: {currentEpisode.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{currentEpisode.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(currentEpisode.airDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed mb-6">
                  {currentEpisode.description || "Bu bölüm için açıklama bulunmuyor."}
                </p>

                {/* Episode Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    disabled={currentEpisodeIndex === 0}
                    onClick={handlePrevEpisode}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Önceki Bölüm
                  </Button>

                  <div className="text-sm text-gray-400">
                    {currentEpisodeIndex + 1} / {animeEpisodes.length}
                  </div>

                  <Button
                    variant="outline"
                    disabled={currentEpisodeIndex === animeEpisodes.length - 1}
                    onClick={handleNextEpisode}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Sonraki Bölüm
                    <ChevronLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Episode List Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-anime-card border-white/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Bölümler</h2>
                  <Badge variant="secondary" className="bg-neon-blue/20 text-neon-blue">
                    {animeEpisodes.length}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {animeEpisodes.map((episode, index) => (
                    <div
                      key={episode.id}
                      onClick={() => handleEpisodeSelect(episode)}
                      className={`
                        flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all
                        ${episode.id === currentEpisode.id 
                          ? 'bg-neon-blue/20 border border-neon-blue/50' 
                          : 'bg-black/30 hover:bg-black/50'
                        }
                      `}
                    >
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                        ${episode.id === currentEpisode.id 
                          ? 'bg-neon-blue text-black' 
                          : 'bg-white/10 text-white'
                        }
                      `}>
                        {episode.id === currentEpisode.id ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          episode.episodeNumber
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`
                          font-medium text-sm leading-tight truncate
                          ${episode.id === currentEpisode.id ? 'text-white' : 'text-gray-300'}
                        `}>
                          Bölüm {episode.episodeNumber}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {episode.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{episode.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {animeEpisodes.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Henüz bölüm eklenmemiş</p>
                  </div>
                )}
              </Card>

              {/* Anime Info Card */}
              <Card className="bg-anime-card border-white/10 p-4 mt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="text-white font-medium text-sm leading-tight">
                      {anime.title}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {anime.year} • {anime.episodes} bölüm
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-gray-400 text-xs">{anime.rating}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/anime/${animeId}`)}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Anime Sayfasına Git
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
