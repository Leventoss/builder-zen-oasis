import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  MessageSquare,
  Settings,
  Crown,
  Check,
  X,
  Eye,
  EyeOff,
  Shield,
  Star,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useAnimeStore } from "@/lib/animeStore";
import { toast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isPremium: boolean;
  premiumExpiresAt?: string;
  discordId?: string;
  discordUsername?: string;
  createdAt: string;
}

interface AnimeRequest {
  id: string;
  animeName: string;
  description: string;
  requestedBy: string;
  requestedById: number;
  timestamp: string;
  votes: number;
  status: "pending" | "approved" | "rejected" | "added";
}

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalAnimes: number;
  totalEpisodes: number;
  pendingRequests: number;
  todayWatches: number;
}

export default function CompleteAdmin() {
  const { user, isAdmin } = useAuth();
  const { animes, addAnime } = useAnimeStore();

  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [animeRequests, setAnimeRequests] = useState<AnimeRequest[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    premiumUsers: 0,
    totalAnimes: 0,
    totalEpisodes: 0,
    pendingRequests: 0,
    todayWatches: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  // Load data
  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch("/api/admin/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Load users
      const usersResponse = await fetch("/api/admin/users");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
      }

      // Load anime requests
      const requestsResponse = await fetch("/api/admin/anime-requests/pending");
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setAnimeRequests(requestsData.data || []);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
      toast({
        title: "Hata",
        description: "Admin verileri yüklenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle anime request actions
  const handleRequestAction = async (
    requestId: string,
    action: "approved" | "rejected" | "added",
  ) => {
    try {
      const response = await fetch(
        `/api/admin/anime-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: action }),
        },
      );

      if (response.ok) {
        setAnimeRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: action } : req,
          ),
        );

        toast({
          title: "İstek Güncellendi",
          description: `İstek ${action === "approved" ? "onaylandı" : action === "rejected" ? "reddedildi" : "eklendi olarak işaretlendi"}`,
        });
      }
    } catch (error) {
      console.error("Failed to update request:", error);
      toast({
        title: "Hata",
        description: "İstek güncellenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Handle user premium update
  const updateUserPremium = async (
    userId: number,
    isPremium: boolean,
    expiryDate?: string,
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/premium`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPremium, expiryDate }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, isPremium, premiumExpiresAt: expiryDate }
              : u,
          ),
        );

        toast({
          title: "Başarılı",
          description: "Kullanıcı premium durumu güncellendi",
        });
      }
    } catch (error) {
      console.error("Failed to update user premium:", error);
      toast({
        title: "Hata",
        description: "Premium durumu güncellenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Handle user admin update
  const updateUserAdmin = async (userId: number, isAdmin: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAdmin }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isAdmin } : u)),
        );

        toast({
          title: "Başarılı",
          description: "Kullanıcı admin durumu güncellendi",
        });
      }
    } catch (error) {
      console.error("Failed to update user admin:", error);
      toast({
        title: "Hata",
        description: "Admin durumu güncellenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Quick add anime from request
  const quickAddAnimeFromRequest = async (request: AnimeRequest) => {
    try {
      const animeData = {
        title: request.animeName,
        titleEn: request.animeName,
        poster: "https://via.placeholder.com/400x600",
        banner: "https://via.placeholder.com/800x300",
        rating: 8.0,
        year: new Date().getFullYear(),
        episodes: 12,
        genre: ["Aksiyon"],
        genreEn: ["Action"],
        duration: "24min",
        description:
          request.description || `${request.animeName} - İstek üzerine eklendi`,
        descriptionEn:
          request.description || `${request.animeName} - Added by request`,
        status: "ongoing",
        category: "anime",
      };

      const response = await fetch("/api/animes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(animeData),
      });

      if (response.ok) {
        addAnime(animeData);
        await handleRequestAction(request.id, "added");

        toast({
          title: "Anime Eklendi",
          description: `${request.animeName} başarıyla siteye eklendi!`,
        });
      }
    } catch (error) {
      console.error("Failed to add anime from request:", error);
      toast({
        title: "Hata",
        description: "Anime eklenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white">Yetkiniz yok</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-anime-accent mx-auto mb-4"></div>
              <p className="text-white">Admin verileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">Tam Admin Paneli</h1>
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
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Anime İstekleri (
              {animeRequests.filter((r) => r.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kullanıc�� Yönetimi
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              İçerik Yönetimi
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Toplam Kullanıcı
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalUsers}
                  </div>
                  <p className="text-xs text-gray-500">
                    {stats.premiumUsers} premium üye
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Toplam Anime
                  </CardTitle>
                  <Star className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalAnimes}
                  </div>
                  <p className="text-xs text-gray-500">
                    {stats.totalEpisodes} bölüm
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Bekleyen İstekler
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.pendingRequests}
                  </div>
                  <p className="text-xs text-gray-500">İnceleme bekliyor</p>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Günlük İzlenme
                  </CardTitle>
                  <Eye className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.todayWatches}
                  </div>
                  <p className="text-xs text-gray-500">Bugün izlenen</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader>
                  <CardTitle className="text-white">Son Kullanıcılar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                        <div className="flex gap-1">
                          {user.isAdmin && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                          {user.isPremium && (
                            <Badge className="bg-yellow-600">Premium</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader>
                  <CardTitle className="text-white">Son İstekler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {animeRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {request.animeName}
                          </p>
                          <p className="text-sm text-gray-400">
                            {request.requestedBy} • {request.votes} oy
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : "default"
                          }
                          className={
                            request.status === "pending"
                              ? "bg-yellow-600"
                              : request.status === "approved"
                                ? "bg-green-600"
                                : request.status === "rejected"
                                  ? "bg-red-600"
                                  : "bg-blue-600"
                          }
                        >
                          {request.status === "pending"
                            ? "Bekliyor"
                            : request.status === "approved"
                              ? "Onaylandı"
                              : request.status === "rejected"
                                ? "Reddedildi"
                                : "Eklendi"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Anime Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card className="bg-anime-card border-anime-accent/20">
              <CardHeader>
                <CardTitle className="text-white">Anime İstekleri</CardTitle>
                <CardDescription className="text-gray-400">
                  Kullanıcılardan gelen anime isteklerini onaylayın, reddedin
                  veya siteye ekleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {animeRequests
                    .filter((r) => r.status === "pending")
                    .map((request) => (
                      <div
                        key={request.id}
                        className="bg-anime-dark p-4 rounded-lg border border-anime-accent/20"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">
                              {request.animeName}
                            </h3>
                            <p className="text-gray-300 mt-1">
                              {request.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                              <span>👤 {request.requestedBy}</span>
                              <span>⭐ {request.votes} oy</span>
                              <span>
                                📅{" "}
                                {new Date(request.timestamp).toLocaleDateString(
                                  "tr-TR",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() =>
                              handleRequestAction(request.id, "approved")
                            }
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Onayla
                          </Button>

                          <Button
                            onClick={() =>
                              handleRequestAction(request.id, "rejected")
                            }
                            size="sm"
                            variant="destructive"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reddet
                          </Button>

                          <Button
                            onClick={() => quickAddAnimeFromRequest(request)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Hızlı Ekle
                          </Button>
                        </div>
                      </div>
                    ))}

                  {animeRequests.filter((r) => r.status === "pending")
                    .length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">
                        Bekleyen İstek Yok
                      </h3>
                      <p className="text-gray-400">
                        Şu anda onay bekleyen anime isteği bulunmuyor.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-anime-card border-anime-accent/20">
              <CardHeader>
                <CardTitle className="text-white">Kullanıcı Yönetimi</CardTitle>
                <CardDescription className="text-gray-400">
                  Kullanıcıları yönetin, premium ve admin yetkilerini düzenleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-anime-dark rounded-lg border border-anime-accent/20"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="text-white font-medium">
                            {user.username}
                          </h4>
                          <p className="text-sm text-gray-400">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Kayıt:{" "}
                            {new Date(user.createdAt).toLocaleDateString(
                              "tr-TR",
                            )}
                          </p>
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

                        <Button
                          onClick={() =>
                            updateUserAdmin(user.id, !user.isAdmin)
                          }
                          size="sm"
                          variant={user.isAdmin ? "destructive" : "outline"}
                          disabled={user.id === user?.id} // Can't change own admin status
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          {user.isAdmin ? "Admin Kaldır" : "Admin Yap"}
                        </Button>

                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDialog(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader>
                  <CardTitle className="text-white">
                    İçerik İstatistikleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Toplam Anime:</span>
                      <span className="text-white font-bold">
                        {stats.totalAnimes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Toplam Bölüm:</span>
                      <span className="text-white font-bold">
                        {stats.totalEpisodes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Devam Eden:</span>
                      <span className="text-white font-bold">
                        {animes.filter((a) => a.status === "ongoing").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tamamlanan:</span>
                      <span className="text-white font-bold">
                        {animes.filter((a) => a.status === "completed").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader>
                  <CardTitle className="text-white">Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-anime-accent hover:bg-anime-accent/80"
                    onClick={loadAdminData}
                  >
                    Verileri Yenile
                  </Button>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setActiveTab("requests")}
                  >
                    İstekleri İncele (
                    {animeRequests.filter((r) => r.status === "pending").length}
                    )
                  </Button>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open("/admin-test", "_blank")}
                  >
                    API Durumunu Kontrol Et
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Edit Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="bg-anime-card border-anime-accent/20">
          <DialogHeader>
            <DialogTitle className="text-white">Kullanıcı Düzenle</DialogTitle>
            <DialogDescription className="text-gray-400">
              Kullanıcı bilgilerini ve yetkilerini düzenleyin
            </DialogDescription>
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
                      setSelectedUser((prev) =>
                        prev ? { ...prev, isPremium: checked } : null,
                      )
                    }
                  />
                  <Label className="text-white">Premium Üye</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedUser.isAdmin}
                    onCheckedChange={(checked) =>
                      setSelectedUser((prev) =>
                        prev ? { ...prev, isAdmin: checked } : null,
                      )
                    }
                    disabled={selectedUser.id === user?.id}
                  />
                  <Label className="text-white">Admin</Label>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    updateUserPremium(selectedUser.id, selectedUser.isPremium);
                    updateUserAdmin(selectedUser.id, selectedUser.isAdmin);
                  }
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
