import { useState } from "react";
import { Play, Plus, Star, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

interface AnimeCardProps {
  id: string;
  title: string;
  titleEn: string;
  poster: string;
  rating: number;
  year: number;
  episodes: number;
  genre: string[];
  genreEn: string[];
  duration?: string;
  isInWatchlist?: boolean;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  progress?: number;
  description?: string;
  descriptionEn?: string;
  status?: "ongoing" | "completed" | "upcoming";
  category?: "anime" | "movie";
}

export default function AnimeCard({
  id,
  title,
  titleEn,
  poster,
  rating,
  year,
  episodes,
  genre,
  genreEn,
  duration = "24min",
  isInWatchlist = false,
  size = "md",
  showProgress = false,
  progress = 0,
  description = "",
  descriptionEn = "",
  category = "anime",
}: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { language } = useLanguage();

  // Ensure rating is a valid number - provide default of 8.0 if invalid
  const safeRating =
    typeof rating === "number" && !isNaN(rating) && rating > 0 ? rating : 8.0;

  const sizeClasses = {
    sm: "w-48 h-72",
    md: "w-56 h-80",
    lg: "w-64 h-96",
  };

  const handleWatchClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Navigate to anime details/watch page
    window.location.href = `/anime/${id}`;
  };

  const handleWatchlistToggle = () => {
    // Add to watchlist logic
    console.log("Toggle watchlist for", id);
  };

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
  };

  // Use language-appropriate content
  const displayTitle = language === "en" ? titleEn : title;
  const displayGenres = language === "en" ? genreEn : genre;

  return (
    <div
      className={`anime-card group cursor-pointer ${sizeClasses[size]} relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleWatchClick}
    >
      {/* Poster Image */}
      <div className="relative h-full overflow-hidden">
        <img
          src={poster}
          alt={displayTitle}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

        {/* Rating Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-black/70 text-neon-blue border-neon-blue/30 flex items-center gap-1">
            <Star className="h-3 w-3 fill-neon-blue" />
            {safeRating.toFixed(1)}
          </Badge>
        </div>

        {/* Year Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            variant="secondary"
            className="bg-white/10 text-white border-white/20"
          >
            {year}
          </Badge>
        </div>

        {/* Progress Bar (if watching) */}
        {showProgress && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full bg-neon-blue transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-300">
            <div
              className="text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="lg"
                className="bg-anime-accent hover:bg-anime-accent/80 text-white font-bold"
                onClick={(e) => handleWatchClick(e)}
              >
                <Play className="h-5 w-5 mr-2" />
                {language === "en" ? "Watch Now" : "İzle"}
              </Button>

              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWatchlistToggle}
                  className="text-white hover:text-anime-accent bg-black/50 hover:bg-anime-accent/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLikeToggle}
                  className={`bg-black/50 hover:bg-red-500/20 ${
                    isLiked
                      ? "text-red-500 hover:text-red-400"
                      : "text-white hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-neon-blue transition-colors">
            {displayTitle}
          </h3>

          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>
                {episodes} {language === "en" ? "eps" : "bölüm"}
              </span>
              <span>•</span>
              <span>{duration}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {displayGenres.slice(0, 2).map((g) => (
              <Badge
                key={g}
                variant="outline"
                className="text-xs border-white/30 text-gray-300"
              >
                {g}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Comprehensive anime database with dual language support
export const sampleAnimes = [
  {
    id: "1",
    title: "Shingeki no Kyojin",
    titleEn: "Attack on Titan",
    poster: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    rating: 9.0,
    year: 2013,
    episodes: 87,
    genre: ["Aksiyon", "Drama", "Fantastik"],
    genreEn: ["Action", "Drama", "Fantasy"],
    duration: "24min",
    description:
      "İnsanlığın devasa titanlarla hayatta kalma mücadelesini konu alan epik bir anime.",
    descriptionEn:
      "An epic anime about humanity's struggle for survival against giant titans.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "2",
    title: "Kimetsu no Yaiba",
    titleEn: "Demon Slayer",
    poster: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    rating: 8.7,
    year: 2019,
    episodes: 44,
    genre: ["Aksiyon", "Doğaüstü"],
    genreEn: ["Action", "Supernatural"],
    duration: "23min",
    description: "Demon avcısı Tanjiro'nun kardeşini kurtarma yolculuğu.",
    descriptionEn: "The journey of demon slayer Tanjiro to save his sister.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "3",
    title: "Jujutsu Kaisen",
    titleEn: "Jujutsu Kaisen",
    poster: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    rating: 8.6,
    year: 2020,
    episodes: 24,
    genre: ["Aksiyon", "Okul", "Doğaüstü"],
    genreEn: ["Action", "School", "Supernatural"],
    duration: "23min",
    description: "Lanetli ruhlarla sava��an öğrencilerin hikayesi.",
    descriptionEn: "The story of students fighting cursed spirits.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "4",
    title: "One Piece",
    titleEn: "One Piece",
    poster: "https://cdn.myanimelist.net/images/anime/6/73245.jpg",
    rating: 9.1,
    year: 1999,
    episodes: 1000,
    genre: ["Macera", "Komedi", "Shonen"],
    genreEn: ["Adventure", "Comedy", "Shonen"],
    duration: "24min",
    description: "Monkey D. Luffy'nin Pirate King olma yolculuğu.",
    descriptionEn: "Monkey D. Luffy's journey to become the Pirate King.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "5",
    title: "Naruto Shippuden",
    titleEn: "Naruto Shippuden",
    poster: "https://cdn.myanimelist.net/images/anime/1565/111305.jpg",
    rating: 8.8,
    year: 2007,
    episodes: 500,
    genre: ["Aksiyon", "Dövüş Sanatları", "Shonen"],
    genreEn: ["Action", "Martial Arts", "Shonen"],
    duration: "23min",
    description: "Naruto'nun ninja dünyasında güçlü olmaya giden yolu.",
    descriptionEn: "Naruto's path to becoming powerful in the ninja world.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "6",
    title: "Boku no Hero Academia",
    titleEn: "My Hero Academia",
    poster: "https://cdn.myanimelist.net/images/anime/1319/92084.jpg",
    rating: 8.5,
    year: 2016,
    episodes: 138,
    genre: ["Aksiyon", "Okul", "Süper Kahraman"],
    genreEn: ["Action", "School", "Superhero"],
    duration: "24min",
    description:
      "Süper güçlerin normal olduğu bir dünyada kahraman olmaya çalışan Deku.",
    descriptionEn:
      "Deku trying to become a hero in a world where superpowers are normal.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "7",
    title: "Chainsaw Man",
    titleEn: "Chainsaw Man",
    poster: "https://cdn.myanimelist.net/images/anime/1806/126216.jpg",
    rating: 8.4,
    year: 2022,
    episodes: 12,
    genre: ["Aksiyon", "Korku", "Doğaüstü"],
    genreEn: ["Action", "Horror", "Supernatural"],
    duration: "24min",
    description: "Denji'nin şeytan avcısı olarak hayatta kalma mücadelesi.",
    descriptionEn: "Denji's struggle to survive as a devil hunter.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "8",
    title: "Mob Psycho 100",
    titleEn: "Mob Psycho 100",
    poster: "https://cdn.myanimelist.net/images/anime/1812/117973.jpg",
    rating: 8.9,
    year: 2016,
    episodes: 37,
    genre: ["Komedi", "Doğaüstü", "Aksiyon"],
    genreEn: ["Comedy", "Supernatural", "Action"],
    duration: "24min",
    description: "Psişik güçlere sahip Mob'un büyüme hikayesi.",
    descriptionEn: "The coming-of-age story of Mob with psychic powers.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "9",
    title: "One Punch Man",
    titleEn: "One Punch Man",
    poster: "https://cdn.myanimelist.net/images/anime/12/76049.jpg",
    rating: 8.8,
    year: 2015,
    episodes: 24,
    genre: ["Aksiyon", "Komedi", "Süper Kahraman"],
    genreEn: ["Action", "Comedy", "Superhero"],
    duration: "24min",
    description: "Tek yumrukla her düşmanını yenen Saitama'nın hikayesi.",
    descriptionEn:
      "The story of Saitama who defeats every enemy with one punch.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "10",
    title: "Death Note",
    titleEn: "Death Note",
    poster: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    rating: 9.0,
    year: 2006,
    episodes: 37,
    genre: ["Gerilim", "Doğaüstü", "Psikolojik"],
    genreEn: ["Thriller", "Supernatural", "Psychological"],
    duration: "23min",
    description: "Light Yagami'nin Death Note ile adaleti sağlama çabası.",
    descriptionEn:
      "Light Yagami's attempt to create justice with the Death Note.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "11",
    title: "Dragon Ball Super",
    titleEn: "Dragon Ball Super",
    poster: "https://cdn.myanimelist.net/images/anime/1977/111741.jpg",
    rating: 8.3,
    year: 2015,
    episodes: 131,
    genre: ["Aksiyon", "Macera", "Shonen"],
    genreEn: ["Action", "Adventure", "Shonen"],
    duration: "23min",
    description:
      "Goku ve arkadaşlarının yeni evrensel savaşlar ve güçlü düşmanlarla karşılaştığı macera.",
    descriptionEn:
      "The adventure of Goku and friends facing new universal battles and powerful enemies.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "12",
    title: "Hunter x Hunter",
    titleEn: "Hunter x Hunter",
    poster: "https://cdn.myanimelist.net/images/anime/11/33657.jpg",
    rating: 9.1,
    year: 2011,
    episodes: 148,
    genre: ["Macera", "Aksiyon", "Shonen"],
    genreEn: ["Adventure", "Action", "Shonen"],
    duration: "23min",
    description: "Gon Freecss'in babasını bulmak için Hunter olma yolculuğu.",
    descriptionEn:
      "Gon Freecss's journey to become a Hunter to find his father.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "13",
    title: "Fullmetal Alchemist: Brotherhood",
    titleEn: "Fullmetal Alchemist: Brotherhood",
    poster: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
    rating: 9.5,
    year: 2009,
    episodes: 64,
    genre: ["Aksiyon", "Drama", "Fantastik"],
    genreEn: ["Action", "Drama", "Fantasy"],
    duration: "24min",
    description:
      "Edward ve Alphonse Elric kardeşlerin felsefe taşını arama hikayesi.",
    descriptionEn:
      "The story of brothers Edward and Alphonse Elric searching for the philosopher's stone.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "14",
    title: "Tokyo Ghoul",
    titleEn: "Tokyo Ghoul",
    poster: "https://cdn.myanimelist.net/images/anime/5/64449.jpg",
    rating: 8.0,
    year: 2014,
    episodes: 48,
    genre: ["Korku", "Aksiyon", "Doğaüstü"],
    genreEn: ["Horror", "Action", "Supernatural"],
    duration: "24min",
    description: "Ken Kaneki'nin ghoul dünyasında hayatta kalma mücadelesi.",
    descriptionEn: "Ken Kaneki's struggle to survive in the ghoul world.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "15",
    title: "Bleach: Thousand-Year Blood War",
    titleEn: "Bleach: Thousand-Year Blood War",
    poster: "https://cdn.myanimelist.net/images/anime/1764/126627.jpg",
    rating: 9.0,
    year: 2022,
    episodes: 26,
    genre: ["Aksiyon", "Doğaüstü", "Shonen"],
    genreEn: ["Action", "Supernatural", "Shonen"],
    duration: "24min",
    description:
      "Ichigo'nun Quincy'lerle olan son savaşındaki destansı macerası.",
    descriptionEn:
      "Ichigo's epic adventure in the final battle against the Quincies.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "16",
    title: "Violet Evergarden",
    titleEn: "Violet Evergarden",
    poster: "https://cdn.myanimelist.net/images/anime/1795/95088.jpg",
    rating: 8.5,
    year: 2018,
    episodes: 13,
    genre: ["Drama", "Romantik", "Fantastik"],
    genreEn: ["Drama", "Romance", "Fantasy"],
    duration: "24min",
    description: "Eski savaş veteranı Violet'in duyguları öğrenme yolculuğu.",
    descriptionEn: "Former war veteran Violet's journey to learn emotions.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "17",
    title: "Code Geass",
    titleEn: "Code Geass: Lelouch of the Rebellion",
    poster: "https://cdn.myanimelist.net/images/anime/5/50331.jpg",
    rating: 8.9,
    year: 2006,
    episodes: 50,
    genre: ["Drama", "Mecha", "Askeri"],
    genreEn: ["Drama", "Mecha", "Military"],
    duration: "25min",
    description:
      "Lelouch'un Geass gücüyle Britanya İmparatorluğuna karşı isyanı.",
    descriptionEn:
      "Lelouch's rebellion against the Britannia Empire with the power of Geass.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "18",
    title: "Spy x Family",
    titleEn: "Spy x Family",
    poster: "https://cdn.myanimelist.net/images/anime/1441/122795.jpg",
    rating: 8.6,
    year: 2022,
    episodes: 25,
    genre: ["Komedi", "Aksiyon", "Aile"],
    genreEn: ["Comedy", "Action", "Family"],
    duration: "24min",
    description:
      "Sahte aile kuran casus, suikastçı ve telepat kızın komik maceraları.",
    descriptionEn:
      "Comic adventures of a spy, assassin, and telepathic girl forming a fake family.",
    status: "ongoing" as const,
    category: "anime" as const,
  },
  {
    id: "19",
    title: "Haikyuu!!",
    titleEn: "Haikyuu!!",
    poster: "https://cdn.myanimelist.net/images/anime/7/65473.jpg",
    rating: 8.7,
    year: 2014,
    episodes: 85,
    genre: ["Spor", "Okul", "Komedi"],
    genreEn: ["Sports", "School", "Comedy"],
    duration: "24min",
    description: "Hinata ve Kageyama'nın voleybolda zirveye çıkma hikayesi.",
    descriptionEn:
      "The story of Hinata and Kageyama rising to the top in volleyball.",
    status: "completed" as const,
    category: "anime" as const,
  },
  {
    id: "20",
    title: "The Seven Deadly Sins",
    titleEn: "The Seven Deadly Sins",
    poster: "https://cdn.myanimelist.net/images/anime/8/65409.jpg",
    rating: 7.8,
    year: 2014,
    episodes: 96,
    genre: ["Macera", "Fantastik", "Aksiyon"],
    genreEn: ["Adventure", "Fantasy", "Action"],
    duration: "24min",
    description:
      "Yedi Ölümcül Günah şövalyelerinin krallığı kurtarma macerası.",
    descriptionEn:
      "The adventure of the Seven Deadly Sins knights to save the kingdom.",
    status: "completed" as const,
    category: "anime" as const,
  },
  // Movies
  {
    id: "movie-1",
    title: "Kimi no Na wa",
    titleEn: "Your Name",
    poster: "https://cdn.myanimelist.net/images/anime/5/87048.jpg",
    rating: 8.4,
    year: 2016,
    episodes: 1,
    genre: ["Romantik", "Drama", "Doğaüstü"],
    genreEn: ["Romance", "Drama", "Supernatural"],
    duration: "106min",
    description: "İki gencin vücut değiştirme macerası ve aşk hikayesi.",
    descriptionEn:
      "The body-swapping adventure and love story of two teenagers.",
    status: "completed" as const,
    category: "movie" as const,
  },
  {
    id: "movie-2",
    title: "Sen to Chihiro no Kamikakushi",
    titleEn: "Spirited Away",
    poster: "https://cdn.myanimelist.net/images/anime/6/79597.jpg",
    rating: 9.3,
    year: 2001,
    episodes: 1,
    genre: ["Macera", "Aile", "Fantastik"],
    genreEn: ["Adventure", "Family", "Fantasy"],
    duration: "125min",
    description: "Chihiro'nun ruhlar dünyasındaki büyülü macerası.",
    descriptionEn: "Chihiro's magical adventure in the spirit world.",
    status: "completed" as const,
    category: "movie" as const,
  },
  {
    id: "movie-3",
    title: "Akira",
    titleEn: "Akira",
    poster: "https://cdn.myanimelist.net/images/anime/1190/119794.jpg",
    rating: 8.0,
    year: 1988,
    episodes: 1,
    genre: ["Aksiyon", "Bilim-Kurgu", "Gerilim"],
    genreEn: ["Action", "Sci-Fi", "Thriller"],
    duration: "124min",
    description: "2019 Neo-Tokyo'sunda geçen cyberpunk klasiği.",
    descriptionEn: "Cyberpunk classic set in 2019 Neo-Tokyo.",
    status: "completed" as const,
    category: "movie" as const,
  },
  {
    id: "movie-4",
    title: "Howl no Ugoku Shiro",
    titleEn: "Howl's Moving Castle",
    poster: "https://cdn.myanimelist.net/images/anime/1440/88092.jpg",
    rating: 8.2,
    year: 2004,
    episodes: 1,
    genre: ["Macera", "Fantastik", "Romantik"],
    genreEn: ["Adventure", "Fantasy", "Romance"],
    duration: "119min",
    description: "Sophie'nin büyücü Howl ile büyülü maceraları.",
    descriptionEn: "Sophie's magical adventures with wizard Howl.",
    status: "completed" as const,
    category: "movie" as const,
  },
  {
    id: "movie-5",
    title: "Mononoke Hime",
    titleEn: "Princess Mononoke",
    poster: "https://cdn.myanimelist.net/images/anime/7/75919.jpg",
    rating: 8.4,
    year: 1997,
    episodes: 1,
    genre: ["Macera", "Drama", "Fantastik"],
    genreEn: ["Adventure", "Drama", "Fantasy"],
    duration: "134min",
    description: "Doğa ve sanayi arasındaki çatışmayı anlatan epik hikaye.",
    descriptionEn: "Epic tale of the conflict between nature and industry.",
    status: "completed" as const,
    category: "movie" as const,
  },
  {
    id: "movie-6",
    title: "Weathering with You",
    titleEn: "Weathering with You",
    poster: "https://cdn.myanimelist.net/images/anime/1777/101323.jpg",
    rating: 7.5,
    year: 2019,
    episodes: 1,
    genre: ["Romantik", "Drama", "Doğaüstü"],
    genreEn: ["Romance", "Drama", "Supernatural"],
    duration: "112min",
    description:
      "Hava durumunu kontrol edebilen kızla tanışan gencin hikayesi.",
    descriptionEn:
      "The story of a boy who meets a girl who can control the weather.",
    status: "completed" as const,
    category: "movie" as const,
  },
];

// Filter functions for categories
export const getAnimeByCategory = (
  category: "anime" | "movie" | "trending" | "all" = "all",
) => {
  switch (category) {
    case "anime":
      return sampleAnimes.filter((anime) => anime.category === "anime");
    case "movie":
      return sampleAnimes.filter((anime) => anime.category === "movie");
    case "trending":
      return sampleAnimes
        .filter((anime) => anime.rating >= 8.6)
        .sort((a, b) => b.rating - a.rating);
    default:
      return sampleAnimes;
  }
};
