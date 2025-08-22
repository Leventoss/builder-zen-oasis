import React, { useState } from "react";
import { Upload, FileText, Play, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAnimeStore } from "@/lib/animeStore";
import { toast } from "@/hooks/use-toast";

interface BulkEpisodeUploadProps {
  onClose: () => void;
}

interface EpisodeTemplate {
  startEpisode: number;
  endEpisode: number;
  animeId: string;
  titleTemplate: string;
  titleEnTemplate: string;
  descriptionTemplate: string;
  descriptionEnTemplate: string;
  videoUrlTemplate: string;
  duration: string;
  airDateStart: string;
  airDateInterval: number; // days between episodes
}

interface UploadProgress {
  current: number;
  total: number;
  currentEpisode: number;
  status: "preparing" | "uploading" | "completed" | "error";
  errors: string[];
}

export default function BulkEpisodeUpload({ onClose }: BulkEpisodeUploadProps) {
  const { animes, addEpisode } = useAnimeStore();
  const [template, setTemplate] = useState<EpisodeTemplate>({
    startEpisode: 1,
    endEpisode: 10,
    animeId: "",
    titleTemplate: "Bölüm {episode}",
    titleEnTemplate: "Episode {episode}",
    descriptionTemplate: "{anime} - Bölüm {episode}",
    descriptionEnTemplate: "{anime} - Episode {episode}",
    videoUrlTemplate: "https://example.com/video/{episode}.mp4",
    duration: "24min",
    airDateStart: new Date().toISOString().split("T")[0],
    airDateInterval: 7,
  });

  const [csvMode, setCsvMode] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [progress, setProgress] = useState<UploadProgress>({
    current: 0,
    total: 0,
    currentEpisode: 0,
    status: "preparing",
    errors: [],
  });
  const [isUploading, setIsUploading] = useState(false);

  const selectedAnime = animes.find((a) => a.id === template.animeId);

  // Generate episodes from template
  const generateEpisodes = () => {
    if (!selectedAnime) return [];

    const episodes = [];
    const startDate = new Date(template.airDateStart);

    for (let i = template.startEpisode; i <= template.endEpisode; i++) {
      const episodeDate = new Date(startDate);
      episodeDate.setDate(
        startDate.getDate() +
          (i - template.startEpisode) * template.airDateInterval,
      );

      episodes.push({
        episodeNumber: i,
        title: template.titleTemplate
          .replace("{episode}", i.toString())
          .replace("{anime}", selectedAnime.title),
        titleEn: template.titleEnTemplate
          .replace("{episode}", i.toString())
          .replace("{anime}", selectedAnime.titleEn || selectedAnime.title),
        description: template.descriptionTemplate
          .replace("{episode}", i.toString())
          .replace("{anime}", selectedAnime.title),
        descriptionEn: template.descriptionEnTemplate
          .replace("{episode}", i.toString())
          .replace("{anime}", selectedAnime.titleEn || selectedAnime.title),
        videoUrl: template.videoUrlTemplate.replace(
          "{episode}",
          i.toString().padStart(2, "0"),
        ),
        duration: template.duration,
        airDate: episodeDate.toISOString().split("T")[0],
        animeId: template.animeId,
      });
    }

    return episodes;
  };

  // Parse CSV data
  const parseCSV = () => {
    if (!csvData.trim()) return [];

    const lines = csvData.trim().split("\n");
    const episodes = [];

    for (let i = 1; i < lines.length; i++) {
      // Skip header
      const values = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/^"|"$/g, ""));

      if (values.length >= 6) {
        episodes.push({
          episodeNumber: parseInt(values[0]) || i,
          title: values[1] || `Bölüm ${i}`,
          titleEn: values[2] || `Episode ${i}`,
          description: values[3] || "",
          descriptionEn: values[4] || "",
          videoUrl: values[5] || "",
          duration: values[6] || "24min",
          airDate: values[7] || new Date().toISOString().split("T")[0],
          animeId: template.animeId,
        });
      }
    }

    return episodes;
  };

  // Start bulk upload
  const startBulkUpload = async () => {
    if (!template.animeId) {
      toast({
        title: "Hata",
        description: "Lütfen bir anime seçin",
        variant: "destructive",
      });
      return;
    }

    const episodes = csvMode ? parseCSV() : generateEpisodes();

    if (episodes.length === 0) {
      toast({
        title: "Hata",
        description: "Eklenecek bölüm bulunamadı",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress({
      current: 0,
      total: episodes.length,
      currentEpisode: 0,
      status: "uploading",
      errors: [],
    });

    const errors = [];
    let successful = 0;

    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];

      setProgress((prev) => ({
        ...prev,
        current: i + 1,
        currentEpisode: episode.episodeNumber,
      }));

      try {
        await addEpisode(episode);
        successful++;

        // Add small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        const errorMessage = `Bölüm ${episode.episodeNumber}: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
        errors.push(errorMessage);
      }
    }

    setProgress((prev) => ({
      ...prev,
      status: errors.length > 0 ? "error" : "completed",
      errors,
    }));

    setIsUploading(false);

    toast({
      title: "Toplu Yükleme Tamamlandı",
      description: `${successful} bölüm başarıyla eklendi${errors.length > 0 ? `, ${errors.length} hata` : ""}`,
      variant: errors.length > 0 ? "destructive" : "default",
    });
  };

  const totalEpisodes = csvMode
    ? parseCSV().length
    : Math.max(0, template.endEpisode - template.startEpisode + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Toplu Bölüm Yükleme
        </h3>
        <div className="flex gap-2">
          <Button
            variant={!csvMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCsvMode(false)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Şablon
          </Button>
          <Button
            variant={csvMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCsvMode(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Anime Selection */}
      <div className="space-y-2">
        <Label className="text-white">Anime Seçin</Label>
        <Select
          value={template.animeId}
          onValueChange={(value) =>
            setTemplate({ ...template, animeId: value })
          }
        >
          <SelectTrigger className="bg-anime-dark border-anime-accent/30">
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

      {!csvMode ? (
        /* Template Mode */
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Şablonla toplu bölüm oluşturun. {"{episode}"} ve {"{anime}"} yer
              tutucularını kullanabilirsiniz.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Başlangıç Bölümü</Label>
              <Input
                type="number"
                value={template.startEpisode}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    startEpisode: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-anime-dark border-anime-accent/30"
              />
            </div>
            <div>
              <Label className="text-white">Bitiş Bölümü</Label>
              <Input
                type="number"
                value={template.endEpisode}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    endEpisode: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-anime-dark border-anime-accent/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Başlık Şablonu (TR)</Label>
              <Input
                value={template.titleTemplate}
                onChange={(e) =>
                  setTemplate({ ...template, titleTemplate: e.target.value })
                }
                className="bg-anime-dark border-anime-accent/30"
                placeholder="Bölüm {episode}"
              />
            </div>
            <div>
              <Label className="text-white">Başlık Şablonu (EN)</Label>
              <Input
                value={template.titleEnTemplate}
                onChange={(e) =>
                  setTemplate({ ...template, titleEnTemplate: e.target.value })
                }
                className="bg-anime-dark border-anime-accent/30"
                placeholder="Episode {episode}"
              />
            </div>
          </div>

          <div>
            <Label className="text-white">Video URL Şablonu</Label>
            <Input
              value={template.videoUrlTemplate}
              onChange={(e) =>
                setTemplate({ ...template, videoUrlTemplate: e.target.value })
              }
              className="bg-anime-dark border-anime-accent/30"
              placeholder="https://example.com/video/{episode}.mp4"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Süre</Label>
              <Input
                value={template.duration}
                onChange={(e) =>
                  setTemplate({ ...template, duration: e.target.value })
                }
                className="bg-anime-dark border-anime-accent/30"
                placeholder="24min"
              />
            </div>
            <div>
              <Label className="text-white">İlk Yayın Tarihi</Label>
              <Input
                type="date"
                value={template.airDateStart}
                onChange={(e) =>
                  setTemplate({ ...template, airDateStart: e.target.value })
                }
                className="bg-anime-dark border-anime-accent/30"
              />
            </div>
            <div>
              <Label className="text-white">Bölüm Aralığı (gün)</Label>
              <Input
                type="number"
                value={template.airDateInterval}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    airDateInterval: parseInt(e.target.value) || 7,
                  })
                }
                className="bg-anime-dark border-anime-accent/30"
              />
            </div>
          </div>
        </div>
      ) : (
        /* CSV Mode */
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              CSV formatı:
              Episode,Title,TitleEn,Description,DescriptionEn,VideoURL,Duration,AirDate
            </AlertDescription>
          </Alert>

          <div>
            <Label className="text-white">CSV Verisi</Label>
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="bg-anime-dark border-anime-accent/30 min-h-[200px] font-mono text-sm"
              placeholder={`Episode,Title,TitleEn,Description,DescriptionEn,VideoURL,Duration,AirDate
1,"Bölüm 1","Episode 1","İlk bölüm","First episode","https://example.com/1.mp4","24min","2024-01-01"
2,"Bölüm 2","Episode 2","İkinci bölüm","Second episode","https://example.com/2.mp4","24min","2024-01-08"`}
            />
          </div>
        </div>
      )}

      {/* Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white">
              {progress.status === "uploading" &&
                `Yükleniyor: Bölüm ${progress.currentEpisode}`}
              {progress.status === "completed" && "Tamamlandı!"}
              {progress.status === "error" && "Hatalarla tamamlandı"}
            </span>
            <span className="text-gray-400">
              {progress.current} / {progress.total}
            </span>
          </div>
          <Progress
            value={(progress.current / progress.total) * 100}
            className="h-2"
          />
        </div>
      )}

      {/* Errors */}
      {progress.errors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-red-400">Hatalar:</Label>
          <div className="bg-red-900/20 border border-red-500/30 rounded p-3 max-h-32 overflow-y-auto">
            {progress.errors.map((error, index) => (
              <div key={index} className="text-red-300 text-sm">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {totalEpisodes > 0
            ? `${totalEpisodes} bölüm eklenecek`
            : "Bölüm sayısı: 0"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button
            onClick={startBulkUpload}
            disabled={isUploading || totalEpisodes === 0 || !template.animeId}
            className="bg-anime-accent hover:bg-anime-accent/80"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Toplu Yüklemeyi Başlat
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
