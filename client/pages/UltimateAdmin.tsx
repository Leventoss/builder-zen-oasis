import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Settings,
  Crown,
  Search,
  Download,
  Upload,
  Edit,
  Save,
  Trash2,
  Play,
  Image,
  Film,
  Calendar,
  Star,
  Clock,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
  Zap,
  FileText,
  Video,
  Layers,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Maximize2,
  Copy,
  ExternalLink,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useAnimeStore } from "@/lib/animeStore";
import { advancedAnimeAPI } from "@/lib/advancedAnimeApi";
import { toast } from "@/hooks/use-toast";

interface AnimeFormData {
  id?: string;
  title: string;
  titleEn: string;
  titleTr: string;
  description: string;
  descriptionEn: string;
  poster: string;
  banner: string;
  rating: number;
  year: number;
  episodes: number;
  duration: string;
  status: 'ongoing' | 'completed' | 'upcoming';
  category: 'anime' | 'movie';
  genre: string[];
  genreEn: string[];
  studio: string;
  producer: string;
  season: string;
  source: string;
  trailer: string;
  malId?: number;
  externalLinks: Array<{ name: string; url: string }>;
  streamingLinks: Array<{ name: string; url: string }>;
}

interface EpisodeFormData {
  id?: string;
  episodeNumber: number;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  videoUrl: string;
  duration: string;
  airDate: string;
  animeId: string;
}

interface BulkImportProgress {
  title: string;
  status: 'pending' | 'importing' | 'success' | 'error';
  message?: string;
  result?: any;
}

export default function UltimateAdmin() {
  const { user, isAdmin } = useAuth();
  const { animes, addAnime, updateAnime, deleteAnime, episodes, addEpisode, updateEpisode, deleteEpisode } = useAnimeStore();

  // State Management
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [editingAnime, setEditingAnime] = useState<AnimeFormData | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<EpisodeFormData | null>(null);
  const [showAnimeDialog, setShowAnimeDialog] = useState(false);
  const [showEpisodeDialog, setShowEpisodeDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Bulk Import
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportProgress, setBulkImportProgress] = useState<BulkImportProgress[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [includeEpisodes, setIncludeEpisodes] = useState(false);
  
  // API Search
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [apiSearchResults, setApiSearchResults] = useState<any[]>([]);
  const [isApiSearching, setIsApiSearching] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalAnimes: 0,
    totalEpisodes: 0,
    ongoing: 0,
    completed: 0,
    movies: 0,
    averageRating: 0
  });

  // Load data
  useEffect(() => {
    updateStats();
  }, [animes, episodes]);

  const updateStats = () => {
    const totalAnimes = animes.length || 0;
    const totalEpisodes = episodes.length || 0;
    const ongoing = animes.filter(a => a.status === 'ongoing').length || 0;
    const completed = animes.filter(a => a.status === 'completed').length || 0;
    const movies = animes.filter(a => a.category === 'movie').length || 0;

    // Safe rating calculation with NaN protection
    const validRatings = animes.filter(a => typeof a.rating === 'number' && !isNaN(a.rating) && a.rating > 0);
    const averageRating = validRatings.length > 0 ?
      validRatings.reduce((sum, a) => sum + a.rating, 0) / validRatings.length : 0;

    setStats({
      totalAnimes,
      totalEpisodes,
      ongoing,
      completed,
      movies,
      averageRating: isNaN(averageRating) ? 0 : Number(averageRating.toFixed(1))
    });
  };

  // Filter and sort animes
  const filteredAnimes = animes
    .filter(anime => {
      const matchesSearch = !searchQuery || 
        anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        anime.titleEn?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || anime.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || anime.category === filterCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'rating') {
        aValue = typeof aValue === 'number' && !isNaN(aValue) ? aValue : 0;
        bValue = typeof bValue === 'number' && !isNaN(bValue) ? bValue : 0;
      }

      // Ensure we have valid values for comparison
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // API Search
  const handleApiSearch = async () => {
    if (!apiSearchQuery.trim()) return;
    
    setIsApiSearching(true);
    try {
      const results = await advancedAnimeAPI.enhancedSearch(apiSearchQuery, 20);
      setApiSearchResults(results);
      
      toast({
        title: "API Arama Tamamlandı",
        description: `${results.length} anime bulundu`,
      });
    } catch (error) {
      console.error('API search error:', error);
      toast({
        title: "API Arama Hatası",
        description: "Arama sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsApiSearching(false);
    }
  };

  // Add anime from API
  const addAnimeFromApi = async (apiAnime: any, includeEpisodes: boolean = false) => {
    try {
      // Convert API anime to our format with proper title handling
      const titleEn = apiAnime.title_english || apiAnime.title?.english || apiAnime.title || 'Unknown';
      const titleTr = apiAnime.title || apiAnime.title?.romaji || titleEn;

      // Check if anime already exists
      const existingAnime = animes.find(a =>
        a.titleEn?.toLowerCase() === titleEn.toLowerCase() ||
        a.title?.toLowerCase() === titleTr.toLowerCase() ||
        (apiAnime.mal_id && a.malId === apiAnime.mal_id)
      );

      if (existingAnime) {
        toast({
          title: "Anime Zaten Mevcut",
          description: `${titleTr} zaten eklenmiş`,
          variant: "destructive",
        });
        return;
      }

      const animeData = {
        title: titleTr, // Use Turkish/Romaji title as primary
        titleEn: titleEn,
        titleTr: titleTr,
        description: apiAnime.synopsis?.replace(/<[^>]*>/g, '') || apiAnime.description?.replace(/<[^>]*>/g, '') || 'Açıklama mevcut değil',
        descriptionEn: apiAnime.synopsis?.replace(/<[^>]*>/g, '') || apiAnime.description?.replace(/<[^>]*>/g, '') || 'No description available',
        poster: apiAnime.images?.jpg?.large_image_url || apiAnime.images?.jpg?.image_url || apiAnime.coverImage?.large || 'https://via.placeholder.com/300x400',
        banner: apiAnime.images?.jpg?.large_image_url || apiAnime.images?.jpg?.image_url || apiAnime.coverImage?.large || 'https://via.placeholder.com/1200x400',
        rating: apiAnime.score ? parseFloat(apiAnime.score.toString()) : (apiAnime.averageScore ? apiAnime.averageScore / 10 : 8.0),
        year: apiAnime.year || apiAnime.aired?.prop?.from?.year || apiAnime.startDate?.year || new Date().getFullYear(),
        episodes: apiAnime.episodes || 12,
        duration: apiAnime.duration ? `${apiAnime.duration}min` : '24min',
        status: apiAnime.status === 'Finished Airing' || apiAnime.status === 'FINISHED' ? 'completed' :
               apiAnime.status === 'Currently Airing' || apiAnime.status === 'RELEASING' ? 'ongoing' : 'upcoming',
        category: apiAnime.type === 'Movie' || apiAnime.format === 'MOVIE' ? 'movie' : 'anime',
        genre: apiAnime.genres?.map((g: any) => g.name || g) || ['Genel'],
        genreEn: apiAnime.genres?.map((g: any) => g.name || g) || ['General'],
        studio: apiAnime.studios?.[0]?.name || apiAnime.studios?.nodes?.[0]?.name || 'Bilinmiyor',
        producer: apiAnime.producers?.[0]?.name || 'Bilinmiyor',
        season: apiAnime.season?.toLowerCase() || 'unknown',
        source: apiAnime.source || 'Unknown',
        trailer: apiAnime.trailer?.url || '',
        malId: apiAnime.mal_id || apiAnime.id,
        externalLinks: apiAnime.external_links?.map((link: any) => ({ name: link.name, url: link.url })) || [],
        streamingLinks: apiAnime.streaming?.map((stream: any) => ({ name: stream.name, url: stream.url })) || []
      };

      // Save to backend
      const response = await fetch('/api/animes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animeData),
      });

      if (response.ok) {
        const result = await response.json();
        animeData.id = result.data.id;

        addAnime(animeData);

        toast({
          title: "Anime Eklendi",
          description: `${animeData.title} başarıyla eklendi`,
        });
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Add anime from API error:', error);
      toast({
        title: "Hata",
        description: "Anime eklenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Bulk import
  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;

    const titles = bulkImportText.split('\n').filter(t => t.trim()).map(t => t.trim());
    const uniqueTitles = [...new Set(titles)]; // Remove duplicates

    setBulkImportProgress(uniqueTitles.map(title => ({ title, status: 'pending' })));
    setIsImporting(true);

    let importedCount = 0;
    let failedCount = 0;
    const results = [];

    try {
      // Process one by one to avoid duplicates
      for (const title of uniqueTitles) {
        try {
          setBulkImportProgress(prev => prev.map(item =>
            item.title === title ? { ...item, status: 'importing' } : item
          ));

          const searchResults = await advancedAnimeAPI.enhancedSearch(title, 1);

          if (searchResults.length > 0) {
            const animeData = searchResults[0];

            // Check if anime already exists
            const existingAnime = animes.find(a =>
              a.title.toLowerCase().includes(title.toLowerCase()) ||
              a.titleEn?.toLowerCase().includes(title.toLowerCase())
            );

            if (existingAnime) {
              setBulkImportProgress(prev => prev.map(item =>
                item.title === title ? {
                  ...item,
                  status: 'error',
                  message: 'Zaten mevcut'
                } : item
              ));
              failedCount++;
              continue;
            }

            await addAnimeFromApi(animeData);

            setBulkImportProgress(prev => prev.map(item =>
              item.title === title ? {
                ...item,
                status: 'success',
                message: 'Başarılı'
              } : item
            ));
            importedCount++;
            results.push(animeData);
          } else {
            setBulkImportProgress(prev => prev.map(item =>
              item.title === title ? {
                ...item,
                status: 'error',
                message: 'Bulunamadı'
              } : item
            ));
            failedCount++;
          }

          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`Import failed for ${title}:`, error);
          setBulkImportProgress(prev => prev.map(item =>
            item.title === title ? {
              ...item,
              status: 'error',
              message: 'API Hatası'
            } : item
          ));
          failedCount++;
        }
      }

      toast({
        title: "Toplu İçe Aktarma Tamamlandı",
        description: `${importedCount} başarılı, ${failedCount} başarısız`,
      });

    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Toplu İçe Aktarma Hatası",
        description: "İşlem sırasında hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Save anime
  const saveAnime = async () => {
    if (!editingAnime) return;
    
    try {
      const endpoint = editingAnime.id ? `/api/animes/${editingAnime.id}` : '/api/animes';
      const method = editingAnime.id ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAnime),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (editingAnime.id) {
          updateAnime(editingAnime.id, editingAnime);
        } else {
          editingAnime.id = result.data.id;
          addAnime(editingAnime);
        }
        
        setEditingAnime(null);
        setShowAnimeDialog(false);
        
        toast({
          title: "Başarılı",
          description: `Anime ${editingAnime.id ? 'güncellendi' : 'eklendi'}`,
        });
      }
    } catch (error) {
      console.error('Save anime error:', error);
      toast({
        title: "Hata",
        description: "Kayıt sırasında hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Save episode
  const saveEpisode = async () => {
    if (!editingEpisode) return;
    
    try {
      const endpoint = editingEpisode.id ? `/api/episodes/${editingEpisode.id}` : '/api/episodes';
      const method = editingEpisode.id ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEpisode),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (editingEpisode.id) {
          updateEpisode(editingEpisode.id, editingEpisode);
        } else {
          editingEpisode.id = result.data.id;
          addEpisode(editingEpisode);
        }
        
        setEditingEpisode(null);
        setShowEpisodeDialog(false);
        
        toast({
          title: "Başarılı",
          description: `Bölüm ${editingEpisode.id ? 'güncellendi' : 'eklendi'}`,
        });
      }
    } catch (error) {
      console.error('Save episode error:', error);
      toast({
        title: "Hata",
        description: "Bölüm kaydı sırasında hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Delete anime
  const handleDeleteAnime = async (animeId: string) => {
    if (!confirm('Bu animeyi silmek istediğinize emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/animes/${animeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        deleteAnime(animeId);
        toast({
          title: "Anime Silindi",
          description: "Anime başarıyla silindi",
        });
      }
    } catch (error) {
      console.error('Delete anime error:', error);
      toast({
        title: "Hata",
        description: "Silme sırasında hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Enhance anime images
  const enhanceAnimeImages = async (animeId: string) => {
    const anime = animes.find(a => a.id === animeId);
    if (!anime || !anime.malId) return;
    
    try {
      const improvements = await advancedAnimeAPI.enhanceImages(anime);
      
      if (improvements) {
        updateAnime(animeId, improvements);
        toast({
          title: "Resimler Geliştirildi",
          description: "Anime resimleri daha yüksek kaliteli versiyonlarla güncellendi",
        });
      } else {
        toast({
          title: "Resim Geliştirme",
          description: "Daha iyi resim bulunamadı",
        });
      }
    } catch (error) {
      console.error('Enhance images error:', error);
      toast({
        title: "Hata",
        description: "Resim geliştirme sırasında hata oluştu",
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

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">Ultimate Anime Yönetimi</h1>
            <Badge variant="secondary" className="bg-anime-accent text-white">
              <Database className="h-4 w-4 mr-1" />
              Admin Panel
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="border-anime-accent/30"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={() => {
                setEditingAnime({
                  title: '', titleEn: '', titleTr: '', description: '', descriptionEn: '',
                  poster: '', banner: '', rating: 7.0, year: new Date().getFullYear(),
                  episodes: 12, duration: '24min', status: 'upcoming', category: 'anime',
                  genre: [], genreEn: [], studio: '', producer: '', season: '', source: '', 
                  trailer: '', externalLinks: [], streamingLinks: []
                });
                setShowAnimeDialog(true);
              }}
              className="bg-anime-accent hover:bg-anime-accent/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Anime
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-anime-card border border-anime-accent/20">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger value="anime-management" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Anime Yönetimi
            </TabsTrigger>
            <TabsTrigger value="api-import" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              API İçe Aktarma
            </TabsTrigger>
            <TabsTrigger value="bulk-operations" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Toplu İşlemler
            </TabsTrigger>
            <TabsTrigger value="episodes" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Bölüm Yönetimi
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kullanıcı Yönetimi
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Toplam Anime</CardTitle>
                  <Film className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalAnimes || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Toplam Bölüm</CardTitle>
                  <Play className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalEpisodes || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Devam Eden</CardTitle>
                  <Zap className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.ongoing || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Tamamlanan</CardTitle>
                  <Star className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.completed || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Filmler</CardTitle>
                  <Video className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.movies || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Ort. Puan</CardTitle>
                  <Star className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.averageRating || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader>
                  <CardTitle className="text-white">Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-anime-accent hover:bg-anime-accent/80"
                    onClick={() => setActiveTab('api-import')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    API'den Anime İçe Aktar
                  </Button>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setActiveTab('bulk-operations')}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Toplu İşlemler
                  </Button>
                  
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setEditingAnime({
                        title: '', titleEn: '', titleTr: '', description: '', descriptionEn: '',
                        poster: '', banner: '', rating: 7.0, year: new Date().getFullYear(),
                        episodes: 12, duration: '24min', status: 'upcoming', category: 'anime',
                        genre: [], genreEn: [], studio: '', producer: '', season: '', source: '', 
                        trailer: '', externalLinks: [], streamingLinks: []
                      });
                      setShowAnimeDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manuel Anime Ekle
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader>
                  <CardTitle className="text-white">Son Eklenen Animeler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {animes.slice(0, 5).map((anime) => (
                      <div key={anime.id} className="flex items-center gap-3">
                        <img
                          src={anime.poster}
                          alt={anime.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{anime.title}</p>
                          <p className="text-gray-400 text-xs">{anime.year} • {anime.episodes} bölüm</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {anime.status === 'ongoing' ? 'Devam' : 
                           anime.status === 'completed' ? 'Bitti' : 'Yakında'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Anime Management Tab */}
          <TabsContent value="anime-management" className="space-y-6">
            <Card className="bg-anime-card border-anime-accent/20">
              <CardHeader>
                <CardTitle className="text-white">Anime Yönetimi</CardTitle>
                <CardDescription className="text-gray-400">
                  Tüm animeleri görüntüle, düzenle ve yönet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Anime ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-anime-dark border-anime-accent/30"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32 bg-anime-dark border-anime-accent/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                        <SelectItem value="ongoing">Devam Eden</SelectItem>
                        <SelectItem value="completed">Biten</SelectItem>
                        <SelectItem value="upcoming">Yakında</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-32 bg-anime-dark border-anime-accent/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Kategoriler</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="movie">Film</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32 bg-anime-dark border-anime-accent/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">İsim</SelectItem>
                        <SelectItem value="year">Yıl</SelectItem>
                        <SelectItem value="rating">Puan</SelectItem>
                        <SelectItem value="episodes">Bölüm</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="border-anime-accent/30"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredAnimes.map((anime) => (
                      <Card key={anime.id} className="bg-anime-dark border-anime-accent/20 hover:border-anime-accent/50 transition-colors">
                        <div className="relative">
                          <img
                            src={anime.poster}
                            alt={anime.title}
                            className="w-full h-64 object-cover rounded-t"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingAnime(anime);
                                setShowAnimeDialog(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAnime(anime.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                            {anime.title}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span>{anime.year}</span>
                            <span>{anime.episodes} bölüm</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {anime.status === 'ongoing' ? 'Devam' : 
                               anime.status === 'completed' ? 'Bitti' : 'Yakında'}
                            </Badge>
                            <div className="flex items-center gap-1 text-yellow-500 text-xs">
                              <Star className="h-3 w-3 fill-current" />
                              {anime.rating}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-400">Poster</TableHead>
                        <TableHead className="text-gray-400">Başlık</TableHead>
                        <TableHead className="text-gray-400">Yıl</TableHead>
                        <TableHead className="text-gray-400">Durum</TableHead>
                        <TableHead className="text-gray-400">Puan</TableHead>
                        <TableHead className="text-gray-400">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnimes.map((anime) => (
                        <TableRow key={anime.id}>
                          <TableCell>
                            <img
                              src={anime.poster}
                              alt={anime.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                          </TableCell>
                          <TableCell className="text-white">
                            <div>
                              <p className="font-medium">{anime.title}</p>
                              <p className="text-gray-400 text-sm">{anime.titleEn}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{anime.year}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {anime.status === 'ongoing' ? 'Devam' : 
                               anime.status === 'completed' ? 'Bitti' : 'Yakında'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-yellow-500">{anime.rating}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAnime(anime);
                                  setShowAnimeDialog(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => enhanceAnimeImages(anime.id)}
                                title="Resimleri Geliştir"
                              >
                                <Image className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteAnime(anime.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {filteredAnimes.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Anime bulunamadı
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Import Tab */}
          <TabsContent value="api-import" className="space-y-6">
            <Card className="bg-anime-card border-anime-accent/20">
              <CardHeader>
                <CardTitle className="text-white">API'den Anime İçe Aktarma</CardTitle>
                <CardDescription className="text-gray-400">
                  MyAnimeList ve AniList'ten anime ara ve ekle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Anime ara (örn: Attack on Titan)..."
                    value={apiSearchQuery}
                    onChange={(e) => setApiSearchQuery(e.target.value)}
                    className="flex-1 bg-anime-dark border-anime-accent/30"
                    onKeyPress={(e) => e.key === 'Enter' && handleApiSearch()}
                  />
                  <Button
                    onClick={handleApiSearch}
                    disabled={isApiSearching}
                    className="bg-anime-accent hover:bg-anime-accent/80"
                  >
                    {isApiSearching ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Ara
                  </Button>
                </div>

                {apiSearchResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium">Arama Sonuçları ({apiSearchResults.length})</h3>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={includeEpisodes}
                          onCheckedChange={setIncludeEpisodes}
                        />
                        <Label className="text-gray-400 text-sm">Bölümleri de ekle</Label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {apiSearchResults.map((anime, index) => (
                        <Card key={index} className="bg-anime-dark border-anime-accent/20">
                          <div className="flex">
                            <img
                              src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.coverImage?.large}
                              alt={anime.title}
                              className="w-24 h-32 object-cover rounded-l"
                            />
                            <div className="flex-1 p-4">
                              <h4 className="text-white font-medium text-sm mb-2 line-clamp-2">
                                {anime.title || anime.title?.romaji}
                              </h4>
                              <div className="text-xs text-gray-400 space-y-1 mb-3">
                                <p>Yıl: {anime.year || anime.startDate?.year || 'Bilinmiyor'}</p>
                                <p>Puan: {anime.score || anime.averageScore || 'N/A'}</p>
                                <p>Durum: {anime.status || anime.status}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addAnimeFromApi(anime, includeEpisodes)}
                                className="w-full bg-anime-accent hover:bg-anime-accent/80"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Ekle
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Operations Tab */}
          <TabsContent value="bulk-operations" className="space-y-6">
            <Card className="bg-anime-card border-anime-accent/20">
              <CardHeader>
                <CardTitle className="text-white">Toplu ��şlemler</CardTitle>
                <CardDescription className="text-gray-400">
                  Birden fazla animeyi aynı anda içe aktar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Switch
                      checked={includeEpisodes}
                      onCheckedChange={setIncludeEpisodes}
                    />
                    <Label className="text-gray-400">Bölümleri de içe aktar</Label>
                  </div>
                  
                  <Textarea
                    placeholder="Her satıra bir anime ismi yazın:&#10;Attack on Titan&#10;Death Note&#10;One Piece&#10;Naruto"
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                    className="min-h-32 bg-anime-dark border-anime-accent/30"
                  />
                  
                  <Button
                    onClick={handleBulkImport}
                    disabled={isImporting || !bulkImportText.trim()}
                    className="w-full bg-anime-accent hover:bg-anime-accent/80"
                  >
                    {isImporting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Toplu İçe Aktarma Başlat
                  </Button>
                </div>

                {bulkImportProgress.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-white font-medium mb-4">İçe Aktarma Durumu</h3>
                    <div className="space-y-2">
                      {bulkImportProgress.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-anime-dark rounded border border-anime-accent/20">
                          <span className="text-white text-sm">{item.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{item.message}</span>
                            <Badge
                              variant={
                                item.status === 'success' ? 'default' :
                                item.status === 'error' ? 'destructive' :
                                item.status === 'importing' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {item.status === 'success' ? 'Başarılı' :
                               item.status === 'error' ? 'Hata' :
                               item.status === 'importing' ? 'İçe Aktarılıyor' : 'Bekliyor'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Episodes Tab */}
          <TabsContent value="episodes" className="space-y-6">
            <Card className="bg-anime-card border-anime-accent/20">
              <CardHeader>
                <CardTitle className="text-white">Bölüm Yönetimi</CardTitle>
                <CardDescription className="text-gray-400">
                  Anime bölümlerini ekle, düzenle ve yönet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-4">
                    <Select value={selectedAnime?.id || ''} onValueChange={(value) => setSelectedAnime(animes.find(a => a.id === value))}>
                      <SelectTrigger className="w-64 bg-anime-dark border-anime-accent/30">
                        <SelectValue placeholder="Anime seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {animes.map((anime) => (
                          <SelectItem key={anime.id} value={anime.id}>
                            {anime.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={() => {
                      if (!selectedAnime) {
                        toast({
                          title: "Hata",
                          description: "Önce bir anime seçin",
                          variant: "destructive",
                        });
                        return;
                      }
                      setEditingEpisode({
                        episodeNumber: 1,
                        title: '',
                        titleEn: '',
                        description: '',
                        descriptionEn: '',
                        videoUrl: '',
                        duration: '24min',
                        airDate: new Date().toISOString().split('T')[0],
                        animeId: selectedAnime.id
                      });
                      setShowEpisodeDialog(true);
                    }}
                    className="bg-anime-accent hover:bg-anime-accent/80"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Bölüm
                  </Button>
                </div>

                {selectedAnime && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-anime-dark rounded border border-anime-accent/20">
                      <img
                        src={selectedAnime.poster}
                        alt={selectedAnime.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div>
                        <h3 className="text-white font-medium">{selectedAnime.title}</h3>
                        <p className="text-gray-400 text-sm">{selectedAnime.titleEn}</p>
                        <p className="text-gray-400 text-xs">{selectedAnime.year} • {selectedAnime.episodes} bölüm</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {episodes
                        .filter(ep => ep.animeId === selectedAnime.id)
                        .sort((a, b) => a.episodeNumber - b.episodeNumber)
                        .map((episode) => (
                          <div key={episode.id} className="flex items-center justify-between p-4 bg-anime-dark rounded border border-anime-accent/20">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-anime-accent rounded flex items-center justify-center">
                                <span className="text-white font-bold">{episode.episodeNumber}</span>
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{episode.title}</h4>
                                <p className="text-gray-400 text-sm">{episode.titleEn}</p>
                                <p className="text-gray-400 text-xs">{episode.duration} • {episode.airDate}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingEpisode(episode);
                                  setShowEpisodeDialog(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('Bu bölümü silmek istediğinize emin misiniz?')) {
                                    deleteEpisode(episode.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      
                      {episodes.filter(ep => ep.animeId === selectedAnime.id).length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          Bu anime için henüz bölüm eklenmemiş
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!selectedAnime && (
                  <div className="text-center py-8 text-gray-400">
                    Bölümleri görüntülemek için bir anime seçin
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-anime-card border-anime-accent/20">
              <CardHeader>
                <CardTitle className="text-white">Kullanıcı Yönetimi</CardTitle>
                <CardDescription className="text-gray-400">
                  Tüm kullanıcıları görüntüle ve yönet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                      <Input
                        placeholder="Kullanıcı ara..."
                        className="w-64 bg-anime-dark border-anime-accent/30"
                      />
                      <Select defaultValue="all">
                        <SelectTrigger className="w-40 bg-anime-dark border-anime-accent/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                          <SelectItem value="admin">Adminler</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="regular">Normal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="bg-anime-accent hover:bg-anime-accent/80 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Kullanıcı
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-400">Kullanıcı</TableHead>
                        <TableHead className="text-gray-400">Email</TableHead>
                        <TableHead className="text-gray-400">Kayıt Tarihi</TableHead>
                        <TableHead className="text-gray-400">Durum</TableHead>
                        <TableHead className="text-gray-400">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-anime-accent rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">admin</p>
                              <p className="text-gray-400 text-sm">Discord: Bağlı</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">admin@aniwa.com</TableCell>
                        <TableCell className="text-gray-300">2024-01-01</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge className="bg-red-600 text-white">Admin</Badge>
                            <Badge className="bg-yellow-600 text-white">Premium</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Anime Edit Dialog */}
      <Dialog open={showAnimeDialog} onOpenChange={setShowAnimeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-anime-card border-anime-accent/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingAnime?.id ? 'Anime Düzenle' : 'Yeni Anime Ekle'}
            </DialogTitle>
          </DialogHeader>
          
          {editingAnime && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Türkçe Başlık *</Label>
                  <Input
                    value={editingAnime.title}
                    onChange={(e) => setEditingAnime({...editingAnime, title: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">İngilizce Başlık</Label>
                  <Input
                    value={editingAnime.titleEn}
                    onChange={(e) => setEditingAnime({...editingAnime, titleEn: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Türkçe Açıklama</Label>
                <Textarea
                  value={editingAnime.description}
                  onChange={(e) => setEditingAnime({...editingAnime, description: e.target.value})}
                  className="bg-anime-dark border-anime-accent/30"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">İngilizce Açıklama</Label>
                <Textarea
                  value={editingAnime.descriptionEn}
                  onChange={(e) => setEditingAnime({...editingAnime, descriptionEn: e.target.value})}
                  className="bg-anime-dark border-anime-accent/30"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Poster URL</Label>
                  <Input
                    value={editingAnime.poster}
                    onChange={(e) => setEditingAnime({...editingAnime, poster: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Banner URL</Label>
                  <Input
                    value={editingAnime.banner}
                    onChange={(e) => setEditingAnime({...editingAnime, banner: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Puan</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={editingAnime.rating}
                    onChange={(e) => setEditingAnime({...editingAnime, rating: parseFloat(e.target.value)})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Yıl</Label>
                  <Input
                    type="number"
                    value={editingAnime.year}
                    onChange={(e) => setEditingAnime({...editingAnime, year: parseInt(e.target.value)})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Bölüm Sayısı</Label>
                  <Input
                    type="number"
                    value={editingAnime.episodes}
                    onChange={(e) => setEditingAnime({...editingAnime, episodes: parseInt(e.target.value)})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Süre</Label>
                  <Input
                    value={editingAnime.duration}
                    onChange={(e) => setEditingAnime({...editingAnime, duration: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Durum</Label>
                  <Select 
                    value={editingAnime.status} 
                    onValueChange={(value: 'ongoing' | 'completed' | 'upcoming') => 
                      setEditingAnime({...editingAnime, status: value})
                    }
                  >
                    <SelectTrigger className="bg-anime-dark border-anime-accent/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Devam Eden</SelectItem>
                      <SelectItem value="completed">Tamamlanan</SelectItem>
                      <SelectItem value="upcoming">Yakında</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Kategori</Label>
                  <Select 
                    value={editingAnime.category} 
                    onValueChange={(value: 'anime' | 'movie') => 
                      setEditingAnime({...editingAnime, category: value})
                    }
                  >
                    <SelectTrigger className="bg-anime-dark border-anime-accent/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="movie">Film</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Stüdyo</Label>
                  <Input
                    value={editingAnime.studio}
                    onChange={(e) => setEditingAnime({...editingAnime, studio: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Yapımcı</Label>
                  <Input
                    value={editingAnime.producer}
                    onChange={(e) => setEditingAnime({...editingAnime, producer: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Sezon</Label>
                  <Input
                    value={editingAnime.season}
                    onChange={(e) => setEditingAnime({...editingAnime, season: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Kaynak</Label>
                  <Input
                    value={editingAnime.source}
                    onChange={(e) => setEditingAnime({...editingAnime, source: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Trailer URL</Label>
                <Input
                  value={editingAnime.trailer}
                  onChange={(e) => setEditingAnime({...editingAnime, trailer: e.target.value})}
                  className="bg-anime-dark border-anime-accent/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Türkçe Türler (virgülle ayırın)</Label>
                <Input
                  value={editingAnime.genre.join(', ')}
                  onChange={(e) => setEditingAnime({
                    ...editingAnime, 
                    genre: e.target.value.split(',').map(g => g.trim()).filter(g => g)
                  })}
                  className="bg-anime-dark border-anime-accent/30"
                  placeholder="Aksiyon, Macera, Drama"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">İngilizce Türler (virgülle ayırın)</Label>
                <Input
                  value={editingAnime.genreEn.join(', ')}
                  onChange={(e) => setEditingAnime({
                    ...editingAnime, 
                    genreEn: e.target.value.split(',').map(g => g.trim()).filter(g => g)
                  })}
                  className="bg-anime-dark border-anime-accent/30"
                  placeholder="Action, Adventure, Drama"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAnimeDialog(false)}
                  className="border-anime-accent/30"
                >
                  İptal
                </Button>
                <Button 
                  onClick={saveAnime}
                  className="bg-anime-accent hover:bg-anime-accent/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Episode Edit Dialog */}
      <Dialog open={showEpisodeDialog} onOpenChange={setShowEpisodeDialog}>
        <DialogContent className="max-w-2xl bg-anime-card border-anime-accent/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingEpisode?.id ? 'Bölüm Düzenle' : 'Yeni Bölüm Ekle'}
            </DialogTitle>
          </DialogHeader>
          
          {editingEpisode && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Bölüm Numarası *</Label>
                  <Input
                    type="number"
                    value={editingEpisode.episodeNumber}
                    onChange={(e) => setEditingEpisode({...editingEpisode, episodeNumber: parseInt(e.target.value)})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Süre</Label>
                  <Input
                    value={editingEpisode.duration}
                    onChange={(e) => setEditingEpisode({...editingEpisode, duration: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Türkçe Başlık *</Label>
                  <Input
                    value={editingEpisode.title}
                    onChange={(e) => setEditingEpisode({...editingEpisode, title: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">İngilizce Başlık</Label>
                  <Input
                    value={editingEpisode.titleEn}
                    onChange={(e) => setEditingEpisode({...editingEpisode, titleEn: e.target.value})}
                    className="bg-anime-dark border-anime-accent/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Türkçe Açıklama</Label>
                <Textarea
                  value={editingEpisode.description}
                  onChange={(e) => setEditingEpisode({...editingEpisode, description: e.target.value})}
                  className="bg-anime-dark border-anime-accent/30"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">İngilizce Açıklama</Label>
                <Textarea
                  value={editingEpisode.descriptionEn}
                  onChange={(e) => setEditingEpisode({...editingEpisode, descriptionEn: e.target.value})}
                  className="bg-anime-dark border-anime-accent/30"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Video URL</Label>
                <Input
                  value={editingEpisode.videoUrl}
                  onChange={(e) => setEditingEpisode({...editingEpisode, videoUrl: e.target.value})}
                  className="bg-anime-dark border-anime-accent/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Yayın Tarihi</Label>
                <Input
                  type="date"
                  value={editingEpisode.airDate}
                  onChange={(e) => setEditingEpisode({...editingEpisode, airDate: e.target.value})}
                  className="bg-anime-dark border-anime-accent/30"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEpisodeDialog(false)}
                  className="border-anime-accent/30"
                >
                  İptal
                </Button>
                <Button 
                  onClick={saveEpisode}
                  className="bg-anime-accent hover:bg-anime-accent/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
