import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Star,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

interface AnimeRequest {
  id: string;
  animeName: string;
  description: string;
  requestedBy: string;
  requestedById: number;
  timestamp: string;
  votes: number;
  status: "pending" | "approved" | "rejected" | "added";
  userVoted?: boolean;
}

export default function AnimeRequestFixed() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [animeName, setAnimeName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<AnimeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load requests from API
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch("/api/anime-requests");
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
      // Fallback to mock data
      setRequests([
        {
          id: "1",
          animeName: "One Piece Film: Red",
          description:
            "One Piece serisinin yeni filmi. Shanks ve Uta'nın hikayesi",
          requestedBy: "AnimeOtaku2024",
          requestedById: 1,
          timestamp: "2024-01-15T10:30:00Z",
          votes: 45,
          status: "approved",
          userVoted: false,
        },
        {
          id: "2",
          animeName: "Jujutsu Kaisen Season 3",
          description: "Jujutsu Kaisen'in yeni sezonunu bekliyoruz",
          requestedBy: "MangaFan",
          requestedById: 2,
          timestamp: "2024-01-14T15:45:00Z",
          votes: 38,
          status: "pending",
          userVoted: true,
        },
        {
          id: "3",
          animeName: "Studio Ghibli Collection",
          description: "Miyazaki filmlerinin tamamını ekleyebilir misiniz?",
          requestedBy: "GhibliFan",
          requestedById: 3,
          timestamp: "2024-01-13T09:20:00Z",
          votes: 62,
          status: "added",
          userVoted: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Giriş Yapın",
        description: "Anime isteği göndermek için giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      return;
    }

    if (!animeName.trim()) {
      toast({
        title: "Anime Adı Gerekli",
        description: "Lütfen istemek istediğiniz anime adını girin",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        animeName: animeName.trim(),
        description: description.trim(),
        requestedBy: user?.username || "Anonim",
        requestedById: user?.id || 0,
      };

      const response = await fetch("/api/anime-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();

        // Add to local state
        const newRequest: AnimeRequest = {
          id: result.data.id.toString(),
          animeName: animeName.trim(),
          description: description.trim(),
          requestedBy: user?.username || "Anonim",
          requestedById: user?.id || 0,
          timestamp: new Date().toISOString(),
          votes: 1,
          status: "pending",
          userVoted: true,
        };

        setRequests((prev) => [newRequest, ...prev]);
        setAnimeName("");
        setDescription("");

        toast({
          title: "İstek Gönderildi",
          description:
            "Anime isteğiniz başarıyla gönderildi ve admin paneline iletildi!",
        });
      } else {
        throw new Error("Failed to submit request");
      }
    } catch (error) {
      console.error("Submit request error:", error);
      toast({
        title: "Hata",
        description:
          "İstek gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (requestId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Giriş Yapın",
        description: "Oy vermek için giriş yapmanız gerekiyor",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/anime-requests/${requestId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update local state
        setRequests((prev) =>
          prev.map((req) => {
            if (req.id === requestId) {
              const wasVoted = req.userVoted;
              return {
                ...req,
                votes: result.data.votes,
                userVoted: !wasVoted,
              };
            }
            return req;
          }),
        );

        toast({
          title: "Oy Kaydedildi",
          description: "Oyunuz başarıyla kaydedildi",
        });
      }
    } catch (error) {
      console.error("Vote error:", error);
      toast({
        title: "Hata",
        description: "Oy verirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: AnimeRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Beklemede
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Onaylandı
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Reddedildi
          </Badge>
        );
      case "added":
        return (
          <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
            Eklendi
          </Badge>
        );
      default:
        return null;
    }
  };

  const sortedRequests = requests.sort((a, b) => {
    // Sort by status priority, then by votes
    const statusPriority = { added: 4, approved: 3, pending: 2, rejected: 1 };
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[b.status] - statusPriority[a.status];
    }
    return b.votes - a.votes;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="text-white">İstekler yükleniyor...</p>
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
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <MessageSquare className="inline h-12 w-12 mr-4 text-neon-blue" />
              Anime İstekleri
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              İzlemek istedi��iniz animeleri isteyin ve diğer kullanıcıların
              isteklerini oylayın. En çok oy alan animeler siteye eklenecek!
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Request Form */}
            <div className="lg:col-span-1">
              <Card className="bg-anime-card border-white/10 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Send className="h-5 w-5 mr-2 text-neon-blue" />
                    Yeni İstek Gönder
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    İstediğiniz animeyi açıklayın
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="anime-name" className="text-white">
                      Anime Adı *
                    </Label>
                    <Input
                      id="anime-name"
                      value={animeName}
                      onChange={(e) => setAnimeName(e.target.value)}
                      placeholder="Örn: Attack on Titan Season 4"
                      className="bg-black/50 border-white/20 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">
                      Açıklama (İsteğe bağlı)
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Bu anime neden eklenmeli? Kısa bir açıklama yazın..."
                      className="bg-black/50 border-white/20 text-white mt-1"
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting || !animeName.trim()}
                    className="w-full btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        İstek Gönder
                      </>
                    )}
                  </Button>

                  {!isAuthenticated && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        💡 İstek göndermek için giriş yapmanız gerekiyor
                      </p>
                    </div>
                  )}

                  {isAuthenticated && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400 text-sm">
                        ✅ İstekleriniz doğrudan admin paneline iletilecek
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Requests List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Tüm İstekler ({requests.length})
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>En çok oy alanlar üstte</span>
                </div>
              </div>

              <div className="space-y-4">
                {sortedRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="bg-anime-card border-white/10 hover:border-white/20 transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {request.animeName}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>

                          {request.description && (
                            <p className="text-gray-300 mb-3 leading-relaxed">
                              {request.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>👤 {request.requestedBy}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(request.timestamp).toLocaleDateString(
                                  "tr-TR",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={request.userVoted ? "default" : "outline"}
                            onClick={() => handleVote(request.id)}
                            disabled={
                              request.status === "added" ||
                              request.status === "rejected"
                            }
                            className={
                              request.userVoted
                                ? "bg-neon-blue text-black hover:bg-neon-blue/80"
                                : "border-white/20 text-white hover:bg-white/10"
                            }
                          >
                            <Star
                              className={`h-4 w-4 mr-1 ${request.userVoted ? "fill-current" : ""}`}
                            />
                            {request.votes}
                          </Button>

                          {request.status === "added" && (
                            <div className="flex items-center space-x-1 text-neon-blue text-sm">
                              <CheckCircle className="h-4 w-4" />
                              <span>Siteye eklendi!</span>
                            </div>
                          )}
                        </div>

                        {request.status === "pending" &&
                          request.votes >= 50 && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Yüksek öncelik!
                            </Badge>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {requests.length === 0 && (
                <Card className="bg-anime-card border-white/10">
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      Henüz İstek Yok
                    </h3>
                    <p className="text-gray-400">
                      İlk anime isteğini sen gönder!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
