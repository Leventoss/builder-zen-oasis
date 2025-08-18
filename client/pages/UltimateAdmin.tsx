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
  ExternalLink
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
    const totalAnimes = animes.length;
    const totalEpisodes = episodes.length;
    const ongoing = animes.filter(a => a.status === 'ongoing').length;
    const completed = animes.filter(a => a.status === 'completed').length;
    const movies = animes.filter(a => a.category === 'movie').length;
    const averageRating = totalAnimes > 0 ? 
      animes.reduce((sum, a) => sum + (a.rating || 0), 0) / totalAnimes : 0;

    setStats({
      totalAnimes,
      totalEpisodes,
      ongoing,
      completed,
      movies,
      averageRating: parseFloat(averageRating.toFixed(1))
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
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
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
      const animeData = await advancedAnimeAPI.convertToAnimeData(apiAnime, []);
      
      // Get episodes if requested
      if (includeEpisodes && apiAnime.mal_id) {
        const episodes = await advancedAnimeAPI.getAllEpisodesJikan(apiAnime.mal_id);
        animeData.episodeList = episodes.map((ep: any, index: number) => ({
          episodeNumber: index + 1,
          title: ep.title || `Bölüm ${index + 1}`,
          titleEn: ep.title || `Episode ${index + 1}`,
          description: ep.synopsis || '',
          descriptionEn: ep.synopsis || '',
          duration: animeData.duration,
          airDate: ep.aired || new Date().toISOString().split('T')[0],
          videoUrl: '',
          animeId: ''
        }));
      }

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
        
        // Add episodes if included
        if (animeData.episodeList && animeData.episodeList.length > 0) {
          for (const episode of animeData.episodeList) {
            episode.animeId = animeData.id;
            addEpisode(episode);
          }
        }
        
        toast({
          title: "Anime Eklendi",
          description: `${animeData.title} başarıyla eklendi${includeEpisodes ? ` (${animeData.episodeList?.length || 0} bölümle)` : ''}`,
        });
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
    
    const titles = bulkImportText.split('\n').filter(t => t.trim());
    setBulkImportProgress(titles.map(title => ({ title: title.trim(), status: 'pending' })));
    setIsImporting(true);

    try {
      const result = await advancedAnimeAPI.bulkImportAnime(titles, includeEpisodes);
      
      // Update progress
      const newProgress = titles.map((title, index) => {
        const isSuccess = index < result.imported;
        const error = result.errors.find(e => e.title === title.trim());
        
        return {
          title: title.trim(),
          status: isSuccess ? 'success' : 'error' as const,
          message: error?.error || (isSuccess ? 'Başarılı' : 'Hata'),
          result: isSuccess ? result.results[index] : null
        };
      });
      
      setBulkImportProgress(newProgress);
      
      // Add successful imports to store
      for (const item of newProgress) {
        if (item.status === 'success' && item.result) {
          addAnime(item.result);
        }
      }
      
      toast({
        title: "Toplu İçe Aktarma Tamamlandı",
        description: `${result.imported} başarılı, ${result.failed} başarısız`,
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
                  <div className="text-2xl font-bold text-white">{stats.totalAnimes}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Toplam Bölüm</CardTitle>
                  <Play className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalEpisodes}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Devam Eden</CardTitle>
                  <Zap className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.ongoing}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Tamamlanan</CardTitle>
                  <Star className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.completed}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Filmler</CardTitle>
                  <Video className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.movies}</div>
                </CardContent>
              </Card>

              <Card className="bg-anime-card border-anime-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Ort. Puan</CardTitle>
                  <Star className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.averageRating}</div>
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

          {/* Continue with other tabs... */}
          {/* This is getting quite long, so I'll break here and continue in the next part */}
        </Tabs>
      </div>
    </div>
  );
}
