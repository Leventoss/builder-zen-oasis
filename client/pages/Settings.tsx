import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // User Profile Settings
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newEpisodeAlerts, setNewEpisodeAlerts] = useState(true);
  const [watchlistUpdates, setWatchlistUpdates] = useState(true);

  // Playback Settings
  const [autoplay, setAutoplay] = useState(true);
  const [autoSkipIntro, setAutoSkipIntro] = useState(false);
  const [defaultQuality, setDefaultQuality] = useState("auto");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [subtitleLanguage, setSubtitleLanguage] = useState("tr");
  const [volume, setVolume] = useState(80);

  // Privacy Settings
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [watchHistoryVisible, setWatchHistoryVisible] = useState(true);
  const [allowRecommendations, setAllowRecommendations] = useState(true);

  // Theme Settings
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("blue");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Giriş Gerekli
            </h1>
            <p className="text-gray-400 mb-6">
              Ayarları görmek için giriş yapmalısınız.
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="btn-primary"
            >
              Ana Sayfaya Git
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      // Validate inputs
      if (!username.trim()) {
        toast({
          title: "Hata",
          description: "Kullanıcı adı boş olamaz",
          variant: "destructive",
        });
        return;
      }

      if (newPassword && newPassword !== confirmPassword) {
        toast({
          title: "Hata",
          description: "Şifreler eşleşmiyor",
          variant: "destructive",
        });
        return;
      }

      // TODO: Implement API call to update profile
      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Profil güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      // TODO: Implement API call to save settings
      toast({
        title: "Başarılı",
        description: "Ayarlarınız kaydedildi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      )
    ) {
      try {
        // TODO: Implement API call to delete account
        toast({
          title: "Hesap Silindi",
          description: "Hesabınız başarıyla silindi",
        });
        // Redirect to home
        window.location.href = "/";
      } catch (error) {
        toast({
          title: "Hata",
          description: "Hesap silinemedi",
          variant: "destructive",
        });
      }
    }
  };

  const handleExportData = async () => {
    try {
      // TODO: Implement data export
      toast({
        title: "Başarılı",
        description: "Verileriniz indiriliyor...",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler dışa aktarılamadı",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />

      <div className="pt-16">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Ayarlar</h1>
            <p className="text-gray-400">
              Hesap ve uygulama ayarlarınızı yönetin
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-anime-card border border-white/10">
              <TabsTrigger
                value="profile"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <User className="h-4 w-4 mr-2" />
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Bell className="h-4 w-4 mr-2" />
                Bildirimler
              </TabsTrigger>
              <TabsTrigger
                value="playback"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Palette className="h-4 w-4 mr-2" />
                Oynatma
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Shield className="h-4 w-4 mr-2" />
                Gizlilik
              </TabsTrigger>
              <TabsTrigger
                value="language"
                className="text-white data-[state=active]:bg-neon-blue data-[state=active]:text-black"
              >
                <Globe className="h-4 w-4 mr-2" />
                Dil & Tema
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">
                  Profil Bilgileri
                </h3>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username" className="text-white">
                        Kullanıcı Adı
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-black/50 border-white/20 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black/50 border-white/20 text-white mt-1"
                      />
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <h4 className="text-lg font-semibold text-white">
                    Şifre Değiştir
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password" className="text-white">
                        Mevcut Şifre
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPasswords ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-black/50 border-white/20 text-white mt-1 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-password" className="text-white">
                          Yeni Şifre
                        </Label>
                        <Input
                          id="new-password"
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-black/50 border-white/20 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="confirm-password"
                          className="text-white"
                        >
                          Şifre Tekrar
                        </Label>
                        <Input
                          id="confirm-password"
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-black/50 border-white/20 text-white mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Profili Kaydet
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-900/20 p-6 rounded-lg border border-red-500/20">
                <h3 className="text-xl font-bold text-red-400 mb-4">
                  Tehlikeli Bölge
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        Verileri Dışa Aktar
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Tüm kişisel verilerinizi indirin
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleExportData}
                      className="border-white/20 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Dışa Aktar
                    </Button>
                  </div>

                  <Separator className="bg-red-500/20" />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-red-400 font-medium">Hesabı Sil</h4>
                      <p className="text-gray-400 text-sm">
                        Hesabınızı ve tüm verilerinizi kalıcı olarak silin
                      </p>
                    </div>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hesabı Sil
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">
                  Bildirim Ayarları
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        Email Bildirimleri
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Email ile bildirim almayı tercih edin
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        Push Bildirimleri
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Tarayıcı bildirimleri alın
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        Yeni Bölüm Uyarıları
                      </h4>
                      <p className="text-gray-400 text-sm">
                        İzlediğiniz animelerin yeni bölümleri için bildirim
                      </p>
                    </div>
                    <Switch
                      checked={newEpisodeAlerts}
                      onCheckedChange={setNewEpisodeAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        Watchlist Güncellemeleri
                      </h4>
                      <p className="text-gray-400 text-sm">
                        İzleme listenizle ilgili güncellemeler
                      </p>
                    </div>
                    <Switch
                      checked={watchlistUpdates}
                      onCheckedChange={setWatchlistUpdates}
                    />
                  </div>

                  <Button onClick={handleSaveSettings} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Ayarları Kaydet
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Playback Settings */}
            <TabsContent value="playback" className="space-y-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">
                  Oynatma Ayarları
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        Otomatik Oynatma
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Videoları otomatik olarak başlat
                      </p>
                    </div>
                    <Switch checked={autoplay} onCheckedChange={setAutoplay} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Intro Atlama</h4>
                      <p className="text-gray-400 text-sm">
                        Intro bölümlerini otomatik atla
                      </p>
                    </div>
                    <Switch
                      checked={autoSkipIntro}
                      onCheckedChange={setAutoSkipIntro}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Varsayılan Kalite</Label>
                    <Select
                      value={defaultQuality}
                      onValueChange={setDefaultQuality}
                    >
                      <SelectTrigger className="bg-black/50 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-anime-card border-white/10">
                        <SelectItem value="auto">Otomatik</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="480p">480p</SelectItem>
                        <SelectItem value="360p">360p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Altyazı Dili</Label>
                    <Select
                      value={subtitleLanguage}
                      onValueChange={setSubtitleLanguage}
                    >
                      <SelectTrigger className="bg-black/50 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-anime-card border-white/10">
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="off">Kapalı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">
                      Ses Seviyesi: {volume}%
                    </Label>
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => setVolume(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <Button onClick={handleSaveSettings} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Ayarları Kaydet
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">
                  Gizlilik Ayarları
                </h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-white">Profil Görünürlüğü</Label>
                    <Select
                      value={profileVisibility}
                      onValueChange={setProfileVisibility}
                    >
                      <SelectTrigger className="bg-black/50 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-anime-card border-white/10">
                        <SelectItem value="public">Herkese Açık</SelectItem>
                        <SelectItem value="friends">
                          Sadece Arkadaşlar
                        </SelectItem>
                        <SelectItem value="private">Özel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        İzleme Geçmişi Görünür
                      </h4>
                      <p className="text-gray-400 text-sm">
                        İzleme geçmişinizi diğer kullanıcılara göster
                      </p>
                    </div>
                    <Switch
                      checked={watchHistoryVisible}
                      onCheckedChange={setWatchHistoryVisible}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        Öneriler İçin İzin
                      </h4>
                      <p className="text-gray-400 text-sm">
                        İzleme verilerinizi kullanarak kişiselleştirilmiş
                        öneriler
                      </p>
                    </div>
                    <Switch
                      checked={allowRecommendations}
                      onCheckedChange={setAllowRecommendations}
                    />
                  </div>

                  <Button onClick={handleSaveSettings} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Ayarları Kaydet
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Language & Theme Settings */}
            <TabsContent value="language" className="space-y-6">
              <div className="bg-anime-card p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">
                  Dil ve Tema Ayarları
                </h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-white">Dil</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="bg-black/50 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-anime-card border-white/10">
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Tema</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="bg-black/50 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-anime-card border-white/10">
                        <SelectItem value="dark">Koyu Tema</SelectItem>
                        <SelectItem value="light">Açık Tema</SelectItem>
                        <SelectItem value="auto">Sistem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Vurgu Rengi</Label>
                    <Select value={accentColor} onValueChange={setAccentColor}>
                      <SelectTrigger className="bg-black/50 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-anime-card border-white/10">
                        <SelectItem value="blue">Mavi</SelectItem>
                        <SelectItem value="purple">Mor</SelectItem>
                        <SelectItem value="pink">Pembe</SelectItem>
                        <SelectItem value="green">Yeşil</SelectItem>
                        <SelectItem value="orange">Turuncu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSaveSettings} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
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
