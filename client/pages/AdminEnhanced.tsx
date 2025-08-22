import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Settings,
  Users,
  Bot,
  Crown,
  Download,
  Upload,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useAnimeStore } from "@/lib/animeStore";
import { enhancedAnimeAPI } from "@/lib/enhancedAnimeApi";
import { toast } from "@/hooks/use-toast";

interface PremiumSettings {
  chatAccess: "premium" | "registered" | "both";
  enabled: boolean;
}

interface BulkImportItem {
  title: string;
  status: "pending" | "importing" | "success" | "error";
  message?: string;
}

export default function AdminEnhanced() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { animes, addAnime, updateAnime } = useAnimeStore();

  // States
  const [activeTab, setActiveTab] = useState("anime");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportItems, setBulkImportItems] = useState<BulkImportItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [premiumSettings, setPremiumSettings] = useState<PremiumSettings>({
    chatAccess: "both",
    enabled: true,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  // Load users and settings
  useEffect(() => {
    loadUsers();
    loadPremiumSettings();
  }, []);

  const loadUsers = async () => {
    try {
      // Load users from API
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadPremiumSettings = async () => {
    try {
      const response = await fetch("/api/admin/premium-settings");
      if (response.ok) {
        const settings = await response.json();
        setPremiumSettings(settings);
      }
    } catch (error) {
      console.error("Failed to load premium settings:", error);
    }
  };

  // Enhanced quick add with full anime details
  const handleEnhancedQuickAdd = async () => {
    if (!quickAddTitle.trim()) return;

    const title = quickAddTitle.trim();

    toast({
      title: "Gelişmiş İçe Aktarma Başlatıldı",
      description: `${title} için detaylı veri ve bölümler toplanıyor...`,
    });

    try {
      const fullResults = await enhancedAnimeAPI.searchAndGetFull(title);

      if (fullResults.length > 0) {
        const animeData = enhancedAnimeAPI.convertToFullAnimeData(
          fullResults[0].anime,
          fullResults[0].episodes,
        );

        // Add anime to store
        addAnime(animeData);

        // Add episodes if available
        if (animeData.episodeList && animeData.episodeList.length > 0) {
          // Add episodes to database via API
          for (const episode of animeData.episodeList) {
            await fetch("/api/episodes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...episode,
                animeId: animeData.id,
              }),
            });
          }
        }

        toast({
          title: "Başarılı!",
          description: `${title} ${animeData.episodeList?.length || 0} bölümle birlikte eklendi!`,
        });

        setQuickAddTitle("");
      } else {
        throw new Error("Anime bulunamadı");
      }
    } catch (error) {
      console.error("Enhanced quick add error:", error);
      toast({
        title: "Hata",
        description: `${title} eklenirken hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Bulk import function
  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;

    const titles = bulkImportText.split("\n").filter((t) => t.trim());
    setBulkImportItems(
      titles.map((title) => ({ title: title.trim(), status: "pending" })),
    );
    setIsImporting(true);

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i].trim();

      // Update status to importing
      setBulkImportItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "importing" } : item,
        ),
      );

      try {
        const fullResults = await enhancedAnimeAPI.searchAndGetFull(title);

        if (fullResults.length > 0) {
          const animeData = enhancedAnimeAPI.convertToFullAnimeData(
            fullResults[0].anime,
            fullResults[0].episodes,
          );

          addAnime(animeData);

          // Update status to success
          setBulkImportItems((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: "success",
                    message: `${fullResults[0].episodes.length} bölümle eklendi`,
                  }
                : item,
            ),
          );
        } else {
          throw new Error("Bulunamadı");
        }
      } catch (error) {
        // Update status to error
        setBulkImportItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  message: error.message,
                }
              : item,
          ),
        );
      }

      // Add delay between imports
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    setIsImporting(false);
    toast({
      title: "Toplu İçe Aktarma Tamamlandı",
      description: `${titles.length} animeden başarılı olanlar eklendi.`,
    });
  };

  // Image quality enhancement
  const enhanceImageQuality = async (animeId: string) => {
    const anime = animes.find((a) => a.id === animeId);
    if (!anime) return;

    try {
      const improvements = await enhancedAnimeAPI.enhanceImageQuality(anime);

      if (improvements) {
        updateAnime(animeId, improvements);
        toast({
          title: "Resim Kalitesi Geliştirildi",
          description: `${anime.title} için daha iyi resimler bulundu ve güncellendi.`,
        });
      } else {
        toast({
          title: "Resim Kalitesi",
          description: `${anime.title} için daha iyi resim bulunamadı.`,
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Resim kalitesi geliştirme sırasında hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Premium management
  const updateUserPremium = async (
    userId: number,
    isPremium: boolean,
    expiryDate?: string,
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/premium`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium, expiryDate }),
      });

      if (response.ok) {
        await loadUsers();
        toast({
          title: "Başarılı",
          description: "Kullanıcı premium durumu güncellendi.",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Premium durumu güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Save premium settings
  const savePremiumSettings = async () => {
    try {
      const response = await fetch("/api/admin/premium-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(premiumSettings),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Premium ayarları kaydedildi.",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return <div>Yetkiniz yok</div>;
  }

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">
            Gelişmiş Admin Paneli
          </h1>
          <Badge variant="secondary" className="bg-anime-accent text-white">
            Yönetici
          </Badge>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-anime-card border border-anime-accent/20">
            <TabsTrigger value="anime" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Anime Yönetimi
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kullanıcı Yönetimi
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Premium Ayarları
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Chat Ayarları
            </TabsTrigger>
          </TabsList>

          {/* Anime Management Tab */}
          <TabsContent value="anime" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Quick Add */}
              <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Gelişmiş Hızlı Ekleme
                </h3>
                <div className="space-y-4">
                  <Input
                    placeholder="Anime adı (örn: One Piece, Black Clover)"
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                  <Button
                    onClick={handleEnhancedQuickAdd}
                    className="w-full bg-anime-accent hover:bg-anime-accent/80"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Detaylı Veri ile Ekle (Bölümlerle)
                  </Button>
                  <p className="text-sm text-gray-400">
                    * Bu özellik anime verilerini, posterlerini, bannerlarını ve
                    bölüm listesini otomatik olarak ekler.
                  </p>
                </div>
              </div>

              {/* Bulk Import */}
              <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Toplu İçe Aktarma
                </h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Her satıra bir anime adı yazın:&#10;One Piece&#10;Black Clover&#10;Demon Slayer"
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                    className="bg-anime-dark border-anime-accent/30 min-h-32"
                  />
                  <Button
                    onClick={handleBulkImport}
                    disabled={isImporting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isImporting ? "İçe Aktarılıyor..." : "Toplu İçe Aktar"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Bulk Import Progress */}
            {bulkImportItems.length > 0 && (
              <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">
                  İçe Aktarma Durumu
                </h3>
                <div className="space-y-2">
                  {bulkImportItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-anime-dark rounded"
                    >
                      <span className="text-white">{item.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.status === "success"
                              ? "default"
                              : item.status === "error"
                                ? "destructive"
                                : item.status === "importing"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {item.status === "success"
                            ? "Başarılı"
                            : item.status === "error"
                              ? "Hata"
                              : item.status === "importing"
                                ? "İşleniyor"
                                : "Bekliyor"}
                        </Badge>
                        {item.message && (
                          <span className="text-sm text-gray-400">
                            {item.message}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Quality Control */}
            <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">
                Resim Kalitesi Kontrolü
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {animes.slice(0, 6).map((anime) => (
                  <div key={anime.id} className="bg-anime-dark p-4 rounded-lg">
                    <img
                      src={anime.poster}
                      alt={anime.title}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                    <h4 className="text-white font-medium mb-2">
                      {anime.title}
                    </h4>
                    <Button
                      onClick={() => enhanceImageQuality(anime.id)}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Resim Kalitesini Artır
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">
                Kullanıcı Listesi
              </h3>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-anime-dark rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="text-white font-medium">
                          {user.username}
                        </h4>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        {user.isAdmin && (
                          <Badge variant="destructive">Admin</Badge>
                        )}
                        {user.isPremium && (
                          <Badge className="bg-yellow-600">Premium</Badge>
                        )}
                        {user.discordUsername && (
                          <Badge variant="secondary">Discord</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDialog(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Düzenle
                      </Button>
                      <Button
                        onClick={() =>
                          updateUserPremium(user.id, !user.isPremium)
                        }
                        size="sm"
                        className={
                          user.isPremium
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-yellow-600 hover:bg-yellow-700"
                        }
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        {user.isPremium ? "Premium Kaldır" : "Premium Yap"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Premium Settings Tab */}
          <TabsContent value="premium" className="space-y-6">
            <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">
                Premium Özellik Ayarları
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Premium Sistem Aktif</Label>
                    <p className="text-sm text-gray-400">
                      Premium üyelik sistemini etkinleştir/devre dışı b��rak
                    </p>
                  </div>
                  <Switch
                    checked={premiumSettings.enabled}
                    onCheckedChange={(checked) =>
                      setPremiumSettings((prev) => ({
                        ...prev,
                        enabled: checked,
                      }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-white">AI Chat Erişimi</Label>
                  <Select
                    value={premiumSettings.chatAccess}
                    onValueChange={(value: "premium" | "registered" | "both") =>
                      setPremiumSettings((prev) => ({
                        ...prev,
                        chatAccess: value,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-anime-dark border-anime-accent/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">
                        Sadece Premium Üyeler
                      </SelectItem>
                      <SelectItem value="registered">
                        Sadece Kayıtlı Üyeler
                      </SelectItem>
                      <SelectItem value="both">
                        Hem Premium Hem Kayıtlı
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-400">
                    AI chat desteğini kimler kullanabilir?
                  </p>
                </div>

                <Button
                  onClick={savePremiumSettings}
                  className="bg-anime-accent hover:bg-anime-accent/80"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarları Kaydet
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* AI Chat Settings Tab */}
          <TabsContent value="ai" className="space-y-6">
            <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">
                AI Chat Ayarları
              </h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-white">
                    Konuyla İlgili Destek Modu
                  </Label>
                  <div className="p-4 bg-anime-dark rounded-lg">
                    <p className="text-sm text-gray-300 mb-3">
                      AI sadece anime ve site ile ilgili konularda destek
                      versin, programlama veya alakasız konularda yardım
                      etmesin.
                    </p>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">
                    Otomatik Kategori Yönlendirme
                  </Label>
                  <div className="p-4 bg-anime-dark rounded-lg">
                    <p className="text-sm text-gray-300 mb-3">
                      Kullanıcı mesajlarını otomatik olarak doğru kategoriye
                      yönlendir.
                    </p>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Destek Mesaj Şablonları</Label>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Anime ekletme talebi için şablon mesaj..."
                      className="bg-anime-dark border-anime-accent/30"
                      defaultValue="Anime ekletme talebiniz alındı. Lütfen eklemek istediğiniz animeyi ve sezonunu belirtin."
                    />
                    <Textarea
                      placeholder="Teknik sorun için şablon mesaj..."
                      className="bg-anime-dark border-anime-accent/30"
                      defaultValue="Teknik sorun bildiriminiz alındı. Lütfen sorunu detaylıca açıklayın."
                    />
                  </div>
                </div>

                <Button className="bg-anime-accent hover:bg-anime-accent/80">
                  <Bot className="h-4 w-4 mr-2" />
                  AI Ayarlarını Kaydet
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Edit Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="bg-anime-card border-anime-accent/20">
          <DialogHeader>
            <DialogTitle className="text-white">Kullanıcı Düzenle</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-white">Kullanıcı Adı</Label>
                <Input
                  value={selectedUser.username}
                  className="bg-anime-dark border-anime-accent/30"
                  readOnly
                />
              </div>
              <div>
                <Label className="text-white">Email</Label>
                <Input
                  value={selectedUser.email}
                  className="bg-anime-dark border-anime-accent/30"
                  readOnly
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedUser.isPremium}
                    onCheckedChange={(checked) =>
                      setSelectedUser((prev) => ({
                        ...prev,
                        isPremium: checked,
                      }))
                    }
                  />
                  <Label className="text-white">Premium Üye</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedUser.isAdmin}
                    onCheckedChange={(checked) =>
                      setSelectedUser((prev) => ({ ...prev, isAdmin: checked }))
                    }
                  />
                  <Label className="text-white">Admin</Label>
                </div>
              </div>
              <Button
                onClick={() => {
                  updateUserPremium(selectedUser.id, selectedUser.isPremium);
                  setShowUserDialog(false);
                }}
                className="w-full bg-anime-accent hover:bg-anime-accent/80"
              >
                Değişiklikleri Kaydet
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
