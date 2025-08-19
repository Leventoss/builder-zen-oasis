import { createContext, useContext, useState, ReactNode } from "react";

export interface Translations {
  // Navigation
  home: string;
  anime: string;
  movies: string;
  trending: string;
  myList: string;
  profile: string;
  admin: string;

  // Auth
  signIn: string;
  signUp: string;
  register: string;
  welcomeBack: string;
  joinAniwa: string;
  signInMessage: string;
  createAccountMessage: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  createAccount: string;
  orContinueWith: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  termsOfService: string;
  privacyPolicy: string;
  byCreatingAccount: string;

  // Homepage sections
  featured: string;
  continueWatching: string;
  trendingNow: string;
  newReleases: string;
  topRated: string;
  watchNow: string;
  moreInfo: string;
  episodes: string;

  // General
  search: string;
  searchAnime: string;
  year: string;
  rating: string;
  genre: string;
  duration: string;

  // Footer
  browse: string;
  popular: string;
  genres: string;
  support: string;
  helpCenter: string;
  contactUs: string;
  connect: string;
  newsletter: string;
  allRightsReserved: string;

  // Placeholders
  comingSoon: string;
  underConstruction: string;
  backToHome: string;
  goBack: string;
  continueConversation: string;

  // Admin
  adminPanel: string;
  addAnime: string;
  editAnime: string;
  addEpisode: string;
  manageContent: string;
  userAnalytics: string;
  moderationTools: string;

  // Player
  play: string;
  pause: string;
  volume: string;
  fullscreen: string;
  settings: string;
  quality: string;
  speed: string;
  subtitles: string;

  // Errors & Messages
  loginRequired: string;
  mustLoginToWatch: string;
  invalidCredentials: string;
  registrationSuccess: string;
  loginSuccess: string;

  // Additional UI
  requests: string;
  notifications: string;
  unreadNotifications: string;
  noNotifications: string;
  watchHistory: string;
  settings: string;
  logout: string;
  imageQualityCheck: string;
  quickAdd: string;
  dashboard: string;
  statistics: string;
  manageAnime: string;
  bulkImport: string;
  apiImport: string;
  popular: string;
  completed: string;
  ongoing: string;
  upcoming: string;
  total: string;
  today: string;
  lastUpdate: string;
  title: string;
  description: string;
  poster: string;
  banner: string;
  status: string;
  category: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  add: string;
  search: string;
  loading: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

export const tr: Translations = {
  // Navigation
  home: "Ana Sayfa",
  anime: "Anime",
  movies: "Filmler",
  trending: "Trend",
  myList: "Listem",
  profile: "Profil",
  admin: "Admin",

  // Auth
  signIn: "Giriş Yap",
  signUp: "Kayıt Ol",
  register: "Kayıt Ol",
  welcomeBack: "Tekrar Hoş Geldin",
  joinAniwa: "Aniwa'ya Katıl",
  signInMessage: "Anime yolculuğuna devam etmek için giriş yap",
  createAccountMessage: "Sınırsız anime izlemek için hesap oluştur",
  username: "Kullanıcı Adı",
  email: "E-posta",
  password: "Şifre",
  confirmPassword: "Şifre Tekrar",
  forgotPassword: "Şifremi Unuttum?",
  createAccount: "Hesap Oluştur",
  orContinueWith: "veya şununla devam et",
  dontHaveAccount: "Hesabın yok mu?",
  alreadyHaveAccount: "Zaten hesabın var mı?",
  termsOfService: "Kullanım Şartlar��",
  privacyPolicy: "Gizlilik Politikası",
  byCreatingAccount: "Hesap oluşturarak",

  // Homepage sections
  featured: "Öne Çıkan",
  continueWatching: "İzlemeye Devam Et",
  trendingNow: "Şu Anda Trend",
  newReleases: "Yeni Çıkanlar",
  topRated: "En Yüksek Puanlı",
  watchNow: "İzle",
  moreInfo: "Detaylar",
  episodes: "bölüm",

  // General
  search: "Ara",
  searchAnime: "Anime ara...",
  year: "Yıl",
  rating: "Puan",
  genre: "Tür",
  duration: "Süre",

  // Footer
  browse: "Gözat",
  popular: "Popüler",
  genres: "Türler",
  support: "Destek",
  helpCenter: "Yardım Merkezi",
  contactUs: "İletişim",
  connect: "Bağlan",
  newsletter: "Haber Bülteni",
  allRightsReserved: "Tüm hakları saklıdır.",

  // Placeholders
  comingSoon: "Yakında Geliyor",
  underConstruction: "Bu sayfa yakında hazır olacak!",
  backToHome: "Ana Sayfaya Dön",
  goBack: "Geri Git",
  continueConversation:
    "Bu sayfa için fikirleriniz var mı? Bu özellikleri oluşturmaya yardımcı olmak için AI asistanımızla konuşmaya devam edin!",

  // Admin
  adminPanel: "Admin Paneli",
  addAnime: "Anime Ekle",
  editAnime: "Anime Düzenle",
  addEpisode: "Bölüm Ekle",
  manageContent: "İçerik Yönetimi",
  userAnalytics: "Kullanıcı Analitikleri",
  moderationTools: "Moderasyon Araçları",

  // Player
  play: "Oynat",
  pause: "Duraklat",
  volume: "Ses",
  fullscreen: "Tam Ekran",
  settings: "Ayarlar",
  quality: "Kalite",
  speed: "Hız",
  subtitles: "Altyazı",

  // Errors & Messages
  loginRequired: "Giriş Gerekli",
  mustLoginToWatch: "Anime izlemek için giriş yapmalısınız",
  invalidCredentials: "Geçersiz kullanıcı bilgileri",
  registrationSuccess: "Kayıt başarılı!",
  loginSuccess: "Giriş başarılı!",

  // Additional UI
  requests: "İstekler",
  notifications: "Bildirimler",
  unreadNotifications: "okunmamış bildirim",
  noNotifications: "Henüz bildirim yok",
  watchHistory: "İzleme Geçmişi",
  logout: "Çıkış Yap",
  imageQualityCheck: "Resim Kalitesi Kontrolü",
  quickAdd: "Hızlı Ekle",
  dashboard: "Panel",
  statistics: "İstatistikler",
  manageAnime: "Anime Yönetimi",
  bulkImport: "Toplu İçe Aktarma",
  apiImport: "API İçe Aktarma",
  completed: "Tamamlandı",
  ongoing: "Devam Ediyor",
  upcoming: "Yakında",
  total: "Toplam",
  today: "Bugün",
  lastUpdate: "Son Güncelleme",
  title: "Başlık",
  description: "Açıklama",
  poster: "Poster",
  banner: "Banner",
  status: "Durum",
  category: "Kategori",
  save: "Kaydet",
  cancel: "İptal",
  edit: "Düzenle",
  delete: "Sil",
  add: "Ekle",
  loading: "Yükleniyor",
  success: "Başarılı",
  error: "Hata",
  warning: "Uyarı",
  info: "Bilgi",
};

export const en: Translations = {
  // Navigation
  home: "Home",
  anime: "Anime",
  movies: "Movies",
  trending: "Trending",
  myList: "My List",
  profile: "Profile",
  admin: "Admin",

  // Auth
  signIn: "Sign In",
  signUp: "Sign Up",
  register: "Register",
  welcomeBack: "Welcome Back",
  joinAniwa: "Join Aniwa",
  signInMessage: "Sign in to continue your anime journey",
  createAccountMessage: "Create an account to unlock unlimited anime streaming",
  username: "Username",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm Password",
  forgotPassword: "Forgot password?",
  createAccount: "Create Account",
  orContinueWith: "or continue with",
  dontHaveAccount: "Don't have an account?",
  alreadyHaveAccount: "Already have an account?",
  termsOfService: "Terms of Service",
  privacyPolicy: "Privacy Policy",
  byCreatingAccount: "By creating an account, you agree to our",

  // Homepage sections
  featured: "Featured",
  continueWatching: "Continue Watching",
  trendingNow: "Trending Now",
  newReleases: "New Releases",
  topRated: "Top Rated",
  watchNow: "Watch Now",
  moreInfo: "More Info",
  episodes: "episodes",

  // General
  search: "Search",
  searchAnime: "Search anime...",
  year: "Year",
  rating: "Rating",
  genre: "Genre",
  duration: "Duration",

  // Footer
  browse: "Browse",
  popular: "Popular",
  genres: "Genres",
  support: "Support",
  helpCenter: "Help Center",
  contactUs: "Contact Us",
  connect: "Connect",
  newsletter: "Newsletter",
  allRightsReserved: "All rights reserved.",

  // Placeholders
  comingSoon: "Coming Soon",
  underConstruction: "This page will be ready soon!",
  backToHome: "Back to Home",
  goBack: "Go Back",
  continueConversation:
    "Have ideas for this page? Continue the conversation with our AI assistant to help build out these features!",

  // Admin
  adminPanel: "Admin Panel",
  addAnime: "Add Anime",
  editAnime: "Edit Anime",
  addEpisode: "Add Episode",
  manageContent: "Manage Content",
  userAnalytics: "User Analytics",
  moderationTools: "Moderation Tools",

  // Player
  play: "Play",
  pause: "Pause",
  volume: "Volume",
  fullscreen: "Fullscreen",
  settings: "Settings",
  quality: "Quality",
  speed: "Speed",
  subtitles: "Subtitles",

  // Errors & Messages
  loginRequired: "Login Required",
  mustLoginToWatch: "You must login to watch anime",
  invalidCredentials: "Invalid credentials",
  registrationSuccess: "Registration successful!",
  loginSuccess: "Login successful!",

  // Additional UI
  requests: "Requests",
  notifications: "Notifications",
  unreadNotifications: "unread notifications",
  noNotifications: "No notifications yet",
  watchHistory: "Watch History",
  logout: "Logout",
  imageQualityCheck: "Image Quality Check",
  quickAdd: "Quick Add",
  dashboard: "Dashboard",
  statistics: "Statistics",
  manageAnime: "Manage Anime",
  bulkImport: "Bulk Import",
  apiImport: "API Import",
  completed: "Completed",
  ongoing: "Ongoing",
  upcoming: "Upcoming",
  total: "Total",
  today: "Today",
  lastUpdate: "Last Update",
  title: "Title",
  description: "Description",
  poster: "Poster",
  banner: "Banner",
  status: "Status",
  category: "Category",
  save: "Save",
  cancel: "Cancel",
  edit: "Edit",
  delete: "Delete",
  add: "Add",
  loading: "Loading",
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

// Language context
export type Language = "tr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("tr"); // Varsayılan Türkçe

  const translations = language === "tr" ? tr : en;

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: translations }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
