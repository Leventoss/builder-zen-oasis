import { useState, useEffect } from "react";
import {
  Play,
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import AnimeCard from "@/components/AnimeCard";
import AuthModal from "@/components/AuthModal";
import { useAnimeStore } from "@/lib/animeStore";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const [currentHero, setCurrentHero] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [featuredAnimes, setFeaturedAnimes] = useState<any[]>([]);
  const { t, language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { animes, watchProgress, getUserProgress } = useAnimeStore();

  // Fallback featured animes if none are set in database
  const defaultFeaturedAnimes = [
    {
      id: "hero-1",
      title:
        language === "en"
          ? "Attack on Titan Final Season"
          : "Shingeki no Kyojin Final Season",
      description:
        language === "en"
          ? "Humanity's last stand against the titans. The truth behind the walls is finally revealed in this epic conclusion to the legendary series."
          : "İnsanl��ğın titanlara karşı son duruşu. Duvarların arkasındaki gerçek, bu efsanevi serinin destansı finalinde sonunda ortaya çıkıyor.",
      poster: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
      banner: "https://wallpaperaccess.com/full/1088163.jpg",
      rating: 9.0,
      year: 2023,
      genres:
        language === "en"
          ? ["Action", "Drama", "Fantasy"]
          : ["Aksiyon", "Drama", "Fantastik"],
      episodes: 87,
      duration: "24min",
    },
    {
      id: "hero-2",
      title:
        language === "en"
          ? "Jujutsu Kaisen Shibuya Arc"
          : "Jujutsu Kaisen Shibuya Arc",
      description:
        language === "en"
          ? "The most intense arc yet. Follow Yuji and friends as they face their greatest challenge in the heart of Shibuya during Halloween night."
          : "Şimdiye kadarki en yoğun bölüm. Yuji ve arkadaşlarının Cadılar Bayramı gecesi Shibuya'nın kalbinde karşılaştıkları en büyük meydan okumayı takip edin.",
      poster: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
      banner: "https://wallpaperaccess.com/full/2792930.jpg",
      rating: 8.9,
      year: 2023,
      genres:
        language === "en"
          ? ["Action", "Supernatural", "School"]
          : ["Aksiyon", "Doğaüstü", "Okul"],
      episodes: 24,
      duration: "23min",
    },
    {
      id: "hero-3",
      title:
        language === "en"
          ? "Demon Slayer: Hashira Training Arc"
          : "Kimetsu no Yaiba: Hashira Eğitim Arc",
      description:
        language === "en"
          ? "The Hashira prepare for the final battle. Witness intense training sequences and character development in this thrilling arc."
          : "Hashira'lar son savaşa hazırlanıyor. Bu heyecan verici bölümde yoğun antrenman sahneleri ve karakter gelişimi izleyin.",
      poster: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
      banner: "https://wallpaperaccess.com/full/2532191.jpg",
      rating: 8.8,
      year: 2024,
      genres:
        language === "en"
          ? ["Action", "Historical", "Supernatural"]
          : ["Aksiyon", "Tarihi", "Doğaüstü"],
      episodes: 11,
      duration: "23min",
    },
  ];

  // Update featured animes when animes array changes
  useEffect(() => {
    // Get featured animes from database (fallback to static data)
    const databaseFeaturedAnimes = animes
      .filter(anime => anime.featured && anime.featured >= 1 && anime.featured <= 3)
      .sort((a, b) => (a.featured || 0) - (b.featured || 0))
      .map(anime => ({
        id: anime.id,
        title: language === "en" ?
          (anime.featuredTitleEn || anime.featuredTitle || anime.titleEn || anime.title) :
          (anime.featuredTitle || anime.title),
        description: language === "en" ?
          (anime.featuredDescriptionEn || anime.featuredDescription || anime.descriptionEn || anime.description) :
          (anime.featuredDescription || anime.description),
        poster: anime.poster,
        banner: anime.featuredBanner || anime.banner || anime.poster,
        rating: anime.rating,
        year: anime.year,
        genres: language === "en" ? anime.genreEn : anime.genre,
        episodes: anime.episodes,
        duration: anime.duration,
      }));

    // Use database featured animes if available, otherwise fallback to default
    const newFeaturedAnimes = databaseFeaturedAnimes.length > 0 ? databaseFeaturedAnimes : defaultFeaturedAnimes;
    setFeaturedAnimes(newFeaturedAnimes);
  }, [animes, language]);

  // Auto-rotate hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % featuredAnimes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredAnimes.length]);

  const currentFeature = featuredAnimes[currentHero];

  const nextHero = () => {
    setCurrentHero((prev) => (prev + 1) % featuredAnimes.length);
  };

  const prevHero = () => {
    setCurrentHero(
      (prev) => (prev - 1 + featuredAnimes.length) % featuredAnimes.length,
    );
  };

  // Filter functions for categories
  const getAnimeByCategory = (
    category: "anime" | "movie" | "trending" | "all" = "all",
  ) => {
    switch (category) {
      case "anime":
        return animes.filter((anime) => anime.category === "anime");
      case "movie":
        return animes.filter((anime) => anime.category === "movie");
      case "trending":
        return animes
          .filter((anime) => anime.rating >= 8.6)
          .sort((a, b) => b.rating - a.rating);
      default:
        return animes;
    }
  };

  // Properly categorized data
  const trendingAnimes = getAnimeByCategory("trending").slice(0, 6);
  const newReleases = animes.filter((anime) => anime.year >= 2020).slice(0, 6);
  const topRated = animes.filter((anime) => anime.rating >= 8.5).slice(0, 6);
  const continueWatching = animes.slice(0, 4).map((anime) => ({
    ...anime,
    progress: Math.floor(Math.random() * 80) + 10,
  }));

  const handleWatchClick = () => {
    const currentFeature = featuredAnimes[currentHero];
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // Navigate to anime details page
    window.location.href = `/anime/${currentFeature.id}`;
  };

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header onAuthClick={() => setShowAuthModal(true)} />

      {/* Hero Section - Fully Responsive */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={currentFeature.banner || currentFeature.poster}
            alt={currentFeature.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-hero-gradient" />
        </div>

        {/* Hero Content - Responsive */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl space-y-4 md:space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
              <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/50 w-fit">
                {t.featured}
              </Badge>
              <div className="flex items-center space-x-2 text-gray-300 text-sm">
                <Star className="h-4 w-4 fill-neon-blue text-neon-blue" />
                <span className="font-semibold">{currentFeature.rating}</span>
                <span>•</span>
                <span>{currentFeature.year}</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>
                  {currentFeature.episodes} {t.episodes}
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-8xl font-bold leading-tight hero-text">
              {currentFeature.title}
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-xl">
              {currentFeature.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {currentFeature.genres.map((genre) => (
                <Badge
                  key={genre}
                  variant="outline"
                  className="border-white/30 text-gray-300"
                >
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                size="lg"
                className="btn-primary w-full sm:w-auto"
                onClick={handleWatchClick}
              >
                <Play className="h-5 w-5 mr-2" />
                {t.watchNow}
              </Button>
              <Button size="lg" className="btn-secondary w-full sm:w-auto">
                <Info className="h-5 w-5 mr-2" />
                {t.moreInfo}
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Navigation - Responsive */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center space-x-2">
            {featuredAnimes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHero(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  index === currentHero
                    ? "bg-neon-blue shadow-neon-blue"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Arrows - Hidden on Mobile */}
        <button
          onClick={prevHero}
          className="hidden md:block absolute left-4 lg:left-8 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all duration-300"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextHero}
          className="hidden md:block absolute right-4 lg:right-8 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all duration-300"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </section>

      {/* Content Sections - Fully Responsive */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-12 md:space-y-16">
        {/* Continue Watching - Only show for authenticated users */}
        {isAuthenticated && (
          <section>
            <h2 className="section-title flex items-center text-xl md:text-2xl lg:text-3xl">
              <Clock className="h-6 w-6 md:h-8 md:w-8 mr-3 text-neon-blue" />
              {t.continueWatching}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {continueWatching.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  {...anime}
                  size="sm"
                  showProgress={true}
                  progress={anime.progress}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending Now */}
        <section>
          <h2 className="section-title flex items-center text-xl md:text-2xl lg:text-3xl">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 mr-3 text-neon-purple" />
            {t.trendingNow}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {trendingAnimes.map((anime) => (
              <AnimeCard key={anime.id} {...anime} size="md" />
            ))}
          </div>
        </section>

        {/* New Releases */}
        <section>
          <h2 className="section-title flex items-center text-xl md:text-2xl lg:text-3xl">
            <span className="w-6 h-6 md:w-8 md:h-8 mr-3 bg-gradient-to-r from-neon-blue to-neon-purple rounded flex items-center justify-center text-black font-bold text-sm md:text-base">
              {language === "en" ? "N" : "Y"}
            </span>
            {t.newReleases}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {newReleases.map((anime) => (
              <AnimeCard key={anime.id} {...anime} size="md" />
            ))}
          </div>
        </section>

        {/* Top Rated */}
        <section>
          <h2 className="section-title flex items-center text-xl md:text-2xl lg:text-3xl">
            <Star className="h-6 w-6 md:h-8 md:w-8 mr-3 text-yellow-400 fill-current" />
            {t.topRated}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {topRated.map((anime) => (
              <AnimeCard key={anime.id} {...anime} size="md" />
            ))}
          </div>
        </section>

        {/* Login Prompt for Unauthenticated Users */}
        {!isAuthenticated && (
          <section className="text-center py-8 md:py-16">
            <div className="max-w-2xl mx-auto px-4">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
                {t.mustLoginToWatch}
              </h2>
              <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8">
                {language === "en"
                  ? "Sign in for thousands of anime and movies. Continue where you left off, save your favorites."
                  : "Binlerce anime ve film için giriş yapın. Kaldığınız yerden devam edin, favorilerinizi kaydedin."}
              </p>
              <Button
                size="lg"
                className="btn-primary text-lg md:text-xl px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto"
                onClick={() => setShowAuthModal(true)}
              >
                {t.signIn}
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Footer - Responsive */}
      <footer className="bg-black/50 border-t border-white/10 py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div className="text-2xl font-bold neon-text mb-4">Aniwa</div>
              <p className="text-gray-400 text-sm md:text-base">
                {language === "en"
                  ? "The ultimate destination for anime streaming. Watch your favorite shows in HD quality."
                  : "Anime izleme deneyimi için en iyi destinasyon. Favori dizilerinizi HD kalitede izleyin."}
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t.browse}</h3>
              <ul className="space-y-2 text-gray-400 text-sm md:text-base">
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.popular}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.newReleases}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.topRated}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.genres}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t.support}</h3>
              <ul className="space-y-2 text-gray-400 text-sm md:text-base">
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.helpCenter}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.contactUs}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.termsOfService}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.privacyPolicy}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t.connect}</h3>
              <ul className="space-y-2 text-gray-400 text-sm md:text-base">
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    Reddit
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-neon-blue transition-colors"
                  >
                    {t.newsletter}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-gray-400 text-sm md:text-base">
            <p>&copy; 2024 Aniwa. {t.allRightsReserved}</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
}
