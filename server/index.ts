import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import bcrypt from "bcryptjs";
import { sql } from "./lib/database";

// Import new API routes
import {
  handleLogin,
  handleRegister,
  handleVerifyToken,
  handleDiscordAuth,
  handleDiscordCallback,
} from "./routes/auth";
import {
  handleGetAnimes,
  handleGetAnime,
  handleCreateAnime,
  handleUpdateAnime,
  handleDeleteAnime,
  handleAddEpisode,
} from "./routes/anime";
import {
  handleGetStats,
  handleGetUsers,
  handleGetNotifications,
  handleMarkNotificationRead,
  handleCreateNotification,
  handleClearNotifications,
} from "./routes/admin";
import {
  handleGetWatchProgress,
  handleUpdateWatchProgress,
  handleGetUserList,
  handleAddToUserList,
  handleRemoveFromUserList,
} from "./routes/user";
import {
  handleCreateSession,
  handleAddMessage,
  handleGetSessions,
  handleGetMessages,
  handleUpdateSessionStatus,
} from "./routes/chat";
import {
  getPremiumSettings,
  updatePremiumSettings,
  getUsers as getPremiumUsers,
  updateUserPremium,
  grantPremium,
  revokePremium,
  checkPremiumExpiry,
  getPremiumStats,
} from "./routes/premium";
import { handleAIChat, getChatHistory, checkAIHealth } from "./routes/aiChat";
import {
  handleDiscordLogin,
  handleDiscordCallback,
  getDiscordConfig,
} from "./routes/discord";
import {
  handleEnhancedImport,
  handleBulkImport,
  handleImageEnhancement,
  handleImportStats,
} from "./routes/animeImport";
import {
  getAnimeRequests,
  createAnimeRequest,
  voteOnRequest,
  updateRequestStatus,
  getPendingRequests,
  deleteAnimeRequest,
} from "./routes/animeRequests";

export function createServer() {
  console.log('🔧 Creating Express server...');
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        // Add Builder.io domains
        /.*\.fly\.dev$/,
        /.*\.builder\.io$/,
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Test endpoint for debugging
  app.get("/api/test", (_req, res) => {
    res.json({
      success: true,
      message: "API is working!",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/verify", handleVerifyToken);

  // Anime routes
  app.get("/api/animes", handleGetAnimes);
  app.get("/api/animes/:id", handleGetAnime);
  app.post("/api/animes", handleCreateAnime);
  app.put("/api/animes/:id", handleUpdateAnime);
  app.delete("/api/animes/:id", handleDeleteAnime);
  app.post("/api/animes/:id/episodes", handleAddEpisode);

  // Admin routes
  app.get("/api/admin/stats", handleGetStats);
  app.get("/api/admin/users", handleGetUsers);
  app.get("/api/admin/notifications", handleGetNotifications);
  app.put("/api/admin/notifications/:id/read", handleMarkNotificationRead);
  app.post("/api/admin/notifications", handleCreateNotification);
  app.delete("/api/admin/notifications", handleClearNotifications);

  // User routes
  app.get("/api/users/:userId/progress", handleGetWatchProgress);
  app.put("/api/users/:userId/progress", handleUpdateWatchProgress);
  app.get("/api/users/:userId/list/:listType", handleGetUserList);
  app.post("/api/users/:userId/list", handleAddToUserList);
  app.delete("/api/users/:userId/list", handleRemoveFromUserList);

  // Chat routes
  app.post("/api/chat/session", handleCreateSession);
  app.post("/api/chat/message", handleAddMessage);
  app.get("/api/chat/sessions", handleGetSessions);
  app.get("/api/chat/sessions/:sessionId/messages", handleGetMessages);
  app.put("/api/chat/sessions/:sessionId/status", handleUpdateSessionStatus);

  // AI Chat routes
  app.post("/api/chat/ai", handleAIChat);
  app.get("/api/chat/history/:sessionId", getChatHistory);
  app.get("/api/chat/health", checkAIHealth);

  // Discord OAuth routes
  app.get("/api/auth/discord", handleDiscordAuth);
  app.get("/api/auth/discord/callback", handleDiscordCallback);

  // Enhanced anime import routes
  app.post("/api/admin/import/enhanced", handleEnhancedImport);
  app.post("/api/admin/import/bulk", handleBulkImport);
  app.post("/api/admin/animes/:animeId/enhance-images", handleImageEnhancement);
  app.get("/api/admin/import/stats", handleImportStats);

  // Anime request routes
  app.get("/api/anime-requests", getAnimeRequests);
  app.post("/api/anime-requests", createAnimeRequest);
  app.post("/api/anime-requests/:requestId/vote", voteOnRequest);
  app.put("/api/admin/anime-requests/:requestId/status", updateRequestStatus);
  app.get("/api/admin/anime-requests/pending", getPendingRequests);
  app.delete("/api/admin/anime-requests/:requestId", deleteAnimeRequest);

  // Premium routes
  app.get("/api/admin/premium-settings", getPremiumSettings);
  app.put("/api/admin/premium-settings", updatePremiumSettings);
  app.get("/api/admin/users", getPremiumUsers);
  app.put("/api/admin/users/:userId/premium", updateUserPremium);
  app.post("/api/admin/users/grant-premium", grantPremium);
  app.delete("/api/admin/users/:userId/premium", revokePremium);
  app.post("/api/admin/check-premium-expiry", checkPremiumExpiry);
  app.get("/api/admin/premium-stats", getPremiumStats);

  // Admin setup endpoint - for initial setup only
  app.post("/api/setup/admin", async (req, res) => {
    try {
      const {
        email = "admin@aniwa.com",
        password = "admin123",
        username = "admin",
      } = req.body;

      // Check if any admin exists
      const existingAdmin =
        await sql`SELECT * FROM users WHERE is_admin = true LIMIT 1`;

      if (existingAdmin.length > 0) {
        return res.json({
          success: false,
          message: "Admin kullanıcı zaten mevcut",
          admin: existingAdmin[0],
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create admin user
      const adminUser = await sql`
        INSERT INTO users (username, email, password_hash, is_admin)
        VALUES (${username}, ${email}, ${passwordHash}, true)
        RETURNING id, username, email, is_admin
      `;

      res.json({
        success: true,
        message: "Admin kullanıcı oluşturuldu",
        admin: adminUser[0],
        loginCredentials: { email, password },
      });
    } catch (error) {
      console.error("Admin creation error:", error);
      res
        .status(500)
        .json({ success: false, message: "Admin oluşturma hatası" });
    }
  });

  // Fix admin password endpoint
  app.post("/api/setup/fix-admin", async (req, res) => {
    try {
      const password = "admin123";
      const passwordHash = await bcrypt.hash(password, 10);

      // Update admin password
      const updatedAdmin = await sql`
        UPDATE users
        SET password_hash = ${passwordHash}
        WHERE email = 'admin@aniwa.com' OR is_admin = true
        RETURNING id, username, email, is_admin
      `;

      res.json({
        success: true,
        message: "Admin şifresi güncellendi",
        admin: updatedAdmin[0],
        loginCredentials: { email: "admin@aniwa.com", password },
      });
    } catch (error) {
      console.error("Admin password fix error:", error);
      res
        .status(500)
        .json({ success: false, message: "Şifre güncelleme hatası" });
    }
  });

  // Database status endpoint
  app.get("/api/debug/database", async (req, res) => {
    try {
      const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;

      const users = await sql`SELECT id, username, email, is_admin FROM users`;
      const animes =
        await sql`SELECT id, title, title_en, rating, year FROM animes`;

      res.json({
        success: true,
        tables: tables.map((t) => t.table_name),
        users: users,
        animes: animes,
        counts: {
          users: users.length,
          animes: animes.length,
        },
      });
    } catch (error) {
      console.error("Database check error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Restore anime data endpoint
  app.post("/api/setup/restore-animes", async (req, res) => {
    try {
      // Sample anime data
      const sampleAnimes = [
        {
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
          status: "completed",
          category: "anime",
        },
        {
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
          descriptionEn:
            "The journey of demon slayer Tanjiro to save his sister.",
          status: "ongoing",
          category: "anime",
        },
        {
          title: "Jujutsu Kaisen",
          titleEn: "Jujutsu Kaisen",
          poster: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
          rating: 8.6,
          year: 2020,
          episodes: 24,
          genre: ["Aksiyon", "Okul", "Doğaüstü"],
          genreEn: ["Action", "School", "Supernatural"],
          duration: "23min",
          description: "Lanetli ruhlarla savaşan öğrencilerin hikayesi.",
          descriptionEn: "The story of students fighting cursed spirits.",
          status: "ongoing",
          category: "anime",
        },
        {
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
          status: "ongoing",
          category: "anime",
        },
        {
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
          descriptionEn:
            "Naruto's path to becoming powerful in the ninja world.",
          status: "completed",
          category: "anime",
        },
        {
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
          status: "ongoing",
          category: "anime",
        },
        {
          title: "Chainsaw Man",
          titleEn: "Chainsaw Man",
          poster: "https://cdn.myanimelist.net/images/anime/1806/126216.jpg",
          rating: 8.4,
          year: 2022,
          episodes: 12,
          genre: ["Aksiyon", "Korku", "Doğaüstü"],
          genreEn: ["Action", "Horror", "Supernatural"],
          duration: "24min",
          description:
            "Denji'nin şeytan avcısı olarak hayatta kalma mücadelesi.",
          descriptionEn: "Denji's struggle to survive as a devil hunter.",
          status: "ongoing",
          category: "anime",
        },
        {
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
          status: "completed",
          category: "anime",
        },
        {
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
          status: "ongoing",
          category: "anime",
        },
        {
          title: "Death Note",
          titleEn: "Death Note",
          poster: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
          rating: 9.0,
          year: 2006,
          episodes: 37,
          genre: ["Gerilim", "Doğaüstü", "Psikolojik"],
          genreEn: ["Thriller", "Supernatural", "Psychological"],
          duration: "23min",
          description:
            "Light Yagami'nin Death Note ile adaleti sağlama çabası.",
          descriptionEn:
            "Light Yagami's attempt to create justice with the Death Note.",
          status: "completed",
          category: "anime",
        },
        {
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
          status: "ongoing",
          category: "anime",
        },
        {
          title: "Hunter x Hunter",
          titleEn: "Hunter x Hunter",
          poster: "https://cdn.myanimelist.net/images/anime/11/33657.jpg",
          rating: 9.1,
          year: 2011,
          episodes: 148,
          genre: ["Macera", "Aksiyon", "Shonen"],
          genreEn: ["Adventure", "Action", "Shonen"],
          duration: "23min",
          description:
            "Gon Freecss'in babasını bulmak için Hunter olma yolculuğu.",
          descriptionEn:
            "Gon Freecss's journey to become a Hunter to find his father.",
          status: "completed",
          category: "anime",
        },
        {
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
          status: "completed",
          category: "anime",
        },
        {
          title: "Tokyo Ghoul",
          titleEn: "Tokyo Ghoul",
          poster: "https://cdn.myanimelist.net/images/anime/5/64449.jpg",
          rating: 8.0,
          year: 2014,
          episodes: 48,
          genre: ["Korku", "Aksiyon", "Doğaüstü"],
          genreEn: ["Horror", "Action", "Supernatural"],
          duration: "24min",
          description:
            "Ken Kaneki'nin ghoul dünyasında hayatta kalma mücadelesi.",
          descriptionEn: "Ken Kaneki's struggle to survive in the ghoul world.",
          status: "completed",
          category: "anime",
        },
        {
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
          status: "ongoing",
          category: "anime",
        },
        {
          title: "Violet Evergarden",
          titleEn: "Violet Evergarden",
          poster: "https://cdn.myanimelist.net/images/anime/1795/95088.jpg",
          rating: 8.5,
          year: 2018,
          episodes: 13,
          genre: ["Drama", "Romantik", "Fantastik"],
          genreEn: ["Drama", "Romance", "Fantasy"],
          duration: "24min",
          description:
            "Eski savaş veteranı Violet'in duyguları öğrenme yolculuğu.",
          descriptionEn:
            "Former war veteran Violet's journey to learn emotions.",
          status: "completed",
          category: "anime",
        },
        {
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
          status: "completed",
          category: "anime",
        },
        {
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
          status: "ongoing",
          category: "anime",
        },
        {
          title: "Haikyuu!!",
          titleEn: "Haikyuu!!",
          poster: "https://cdn.myanimelist.net/images/anime/7/65473.jpg",
          rating: 8.7,
          year: 2014,
          episodes: 85,
          genre: ["Spor", "Okul", "Komedi"],
          genreEn: ["Sports", "School", "Comedy"],
          duration: "24min",
          description:
            "Hinata ve Kageyama'nın voleybolda zirveye çıkma hikayesi.",
          descriptionEn:
            "The story of Hinata and Kageyama rising to the top in volleyball.",
          status: "completed",
          category: "anime",
        },
        {
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
          status: "completed",
          category: "anime",
        },
        // Movies
        {
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
          status: "completed",
          category: "movie",
        },
        {
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
          status: "completed",
          category: "movie",
        },
        {
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
          status: "completed",
          category: "movie",
        },
        {
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
          status: "completed",
          category: "movie",
        },
        {
          title: "Mononoke Hime",
          titleEn: "Princess Mononoke",
          poster: "https://cdn.myanimelist.net/images/anime/7/75919.jpg",
          rating: 8.4,
          year: 1997,
          episodes: 1,
          genre: ["Macera", "Drama", "Fantastik"],
          genreEn: ["Adventure", "Drama", "Fantasy"],
          duration: "134min",
          description:
            "Doğa ve sanayi arasındaki çatışmayı anlatan epik hikaye.",
          descriptionEn:
            "Epic tale of the conflict between nature and industry.",
          status: "completed",
          category: "movie",
        },
        {
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
          status: "completed",
          category: "movie",
        },
      ];

      // Clear existing animes first (optional)
      const clearDB = req.body.clearFirst !== false;
      if (clearDB) {
        await sql`DELETE FROM animes`;
      }

      let addedCount = 0;
      let errors = [];

      // Insert each anime
      for (const anime of sampleAnimes) {
        try {
          await sql`
            INSERT INTO animes (
              title, title_en, poster, banner, rating, year, episodes,
              genre, genre_en, duration, description, description_en,
              status, category
            )
            VALUES (
              ${anime.title}, ${anime.titleEn}, ${anime.poster},
              ${anime.poster}, ${anime.rating}, ${anime.year},
              ${anime.episodes}, ${anime.genre}, ${anime.genreEn},
              ${anime.duration}, ${anime.description}, ${anime.descriptionEn},
              ${anime.status}, ${anime.category}
            )
          `;
          addedCount++;
        } catch (error) {
          errors.push(`${anime.title}: ${error.message}`);
        }
      }

      res.json({
        success: true,
        message: `${addedCount} anime başarıyla eklendi`,
        addedCount,
        totalAnimes: sampleAnimes.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Anime restore error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Catch-all route for debugging
  app.use((req, res, next) => {
    // Only handle unmatched API routes
    if (req.url.startsWith('/api/')) {
      console.log(`❓ Unhandled API request: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        availableRoutes: [
          '/api/test',
          '/api/ping',
          '/api/animes',
          '/api/auth/verify',
          '/api/auth/login'
        ]
      });
    } else {
      next();
    }
  });

  console.log('✅ Express server created successfully');
  return app;
}

// Start server if this file is run directly
const app = createServer();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📋 API endpoints available at http://localhost:${port}/api`);
});
