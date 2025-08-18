import { useState, useEffect, useRef } from "react";
import { Send, Image, Settings, Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "admin";
  message: string;
  imageUrl?: string;
  timestamp: Date;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  category: string;
  status: "active" | "waiting" | "resolved";
  createdAt: Date;
}

export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);

  const categories = [
    { value: "anime-ekletme", label: "Anime Ekletme" },
    { value: "anime-sorun", label: "Anime/Player Sorunu" },
    { value: "site-isleyisi", label: "Site İşleyişi" },
    { value: "premium", label: "Premium Destek" },
  ];

  const categoryGreetings = {
    "anime-ekletme": "Merhaba! Anime ekletme talepleriniz için buradayım. Eklemek istediğiniz animeyi ve detaylarını yazınız.",
    "anime-sorun": "Merhaba! Anime izlerken veya playerda yaşadığınız sorunları detaylıca yazarsanız hızlıca yardımcı olabilirim.",
    "site-isleyisi": "Merhaba! Sitemizin işleyişiyle ilgili sorularınızı ve önerilerinizi buradan iletebilirsiniz.",
    "premium": "Merhaba! Premium üyelik ve özel destek için sorularınızı bekliyorum."
  };

  const categoryTips = {
    "anime-ekletme": "İpucu: Ekletmek istediğiniz anime adını, sezonunu ve varsa özel isteğinizi belirtin.",
    "anime-sorun": "İpucu: Sorununuzu detaylıca yazarsanız daha hızlı çözüm bulabilirim.",
    "site-isleyisi": "İpucu: Siteyle ilgili öneri veya şikayetlerinizi açıkça belirtin.",
    "premium": "İpucu: Premium üyelik avantajları ve ödeme sorunları için buradayım."
  };

  // Load allowed emails
  useEffect(() => {
    const loadAllowedEmails = async () => {
      try {
        const response = await fetch("/api.txt");
        if (response.ok) {
          const text = await response.text();
          const emails = text.split("\n").map(email => email.trim()).filter(email => email);
          setAllowedEmails(emails);
        }
      } catch (error) {
        console.error("Failed to load allowed emails:", error);
      }
    };

    loadAllowedEmails();
  }, []);

  // Check if user is allowed
  const isUserAllowed = () => {
    if (!user?.email) return false;
    return allowedEmails.includes(user.email) || user.isAdmin;
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("tr-TR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const startChat = async () => {
    if (!selectedCategory || !isUserAllowed()) {
      toast({
        title: "Hata",
        description: "Kategori seçin ve izinli Gmail ile giriş yapın",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create chat session
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          userEmail: user?.email,
        }),
      });

      if (response.ok) {
        const { sessionId: newSessionId } = await response.json();
        setSessionId(newSessionId);
        setChatStarted(true);

        // Add welcome messages
        const welcomeMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: "bot",
          message: categoryGreetings[selectedCategory as keyof typeof categoryGreetings],
          timestamp: new Date(),
        };

        const tipMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          message: categoryTips[selectedCategory as keyof typeof categoryTips],
          timestamp: new Date(),
        };

        setMessages([welcomeMessage, tipMessage]);
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast({
        title: "Hata",
        description: "Sohbet başlatılamadı",
        variant: "destructive",
      });
    }
  };

  const buildPrompt = (userMessage: string) => {
    if (user?.isAdmin) {
      return `
Sen ultra zeki bir yazılım ve destek AI'sın. 
Kullanıcı her konuda, özellikle yazılım ve kodlama ile ilgili sorular sorabilir. 
Her türlü konuda en akıllı, en detaylı, en kısa ve öz, en doğru cevabı ver. 
Kod örnekleri, açıklamalar ve en iyi uygulamaları sunabilirsin.
Yanıtlarında kodları tam ve kopyalanabilir şekilde markdown kod bloğu ile ver.
Kullanıcı: ${userMessage}
Yanıtın:
`;
    }

    let categoryInfo = "";
    switch (selectedCategory) {
      case "anime-ekletme":
        categoryInfo = "Kullanıcı anime ekletmek istiyor. Ekletmek istediği animeyi, sezonu, bölümü ve varsa özel isteğini sor.";
        break;
      case "anime-sorun":
        categoryInfo = "Kullanıcı anime izlerken veya playerda sorun yaşıyor. Sorunu detaylıca anlamaya çalış, teknik destek ver.";
        break;
      case "site-isleyisi":
        categoryInfo = "Kullanıcı site işleyişiyle ilgili soru soruyor. Site kullanımı, hesap işlemleri, öneriler ve geri bildirimler için yardımcı ol.";
        break;
      case "premium":
        categoryInfo = "Kullanıcı premium destek istiyor. Premium üyelik, avantajlar, ödeme ve özel destek hakkında bilgi ver.";
        break;
      default:
        categoryInfo = "Anime izleme sitesiyle ilgili destek ver.";
    }

    return `
Sen bir anime izleme web sitesinin MEGA ZEKİ destek AI botusun. 
Kullanıcıdan önce kategori: ${selectedCategory}, email: ${user?.email}
Kategori açıklaması: ${categoryInfo}
Animeyle alakasız soruları kibarca reddet ve animeyle ilgili yardımcı ol.
Çok zeki, kısa, detaylı ve öz cevaplar ver. 
Kullanıcı: ${userMessage}
Yanıtın: 
`;
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() && !selectedImage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      message: currentMessage || "Fotoğraf gönderildi.",
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const prompt = buildPrompt(userMessage.message);
      
      const response = await fetch("https://backend.buildpicoapps.com/aero/run/llm-api?pk=v1-Z0FBQUFBQm5IZkJDMlNyYUVUTjIyZVN3UWFNX3BFTU85SWpCM2NUMUk3T2dxejhLSzBhNWNMMXNzZlp3c09BSTR6YW1Sc1BmdGNTVk1GY0liT1RoWDZZX1lNZlZ0Z1dqd3c9PQ==", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          message: data.status === "success" ? data.text : "Bir hata oluştu. Lütfen tekrar deneyin.",
          timestamp: new Date(),
          isError: data.status !== "success",
        };

        setMessages(prev => [...prev, botMessage]);

        // Log to admin (send to backend)
        if (sessionId) {
          await fetch("/api/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              sender: "user",
              message: userMessage.message,
              imageUrl: userMessage.imageUrl,
            }),
          });

          await fetch("/api/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              sender: "bot",
              message: botMessage.message,
            }),
          });
        }
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          message: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
          timestamp: new Date(),
          isError: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        message: "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="h-16 w-16 text-neon-blue mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Giriş Gerekli
            </h1>
            <p className="text-gray-400 mb-6">
              Destek chat'ini kullanmak için giriş yapmalısınız.
            </p>
            <Button 
              onClick={() => window.location.href = "/"}
              className="btn-primary"
            >
              Ana Sayfaya Git
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isUserAllowed()) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Erişim Kısıtlı
            </h1>
            <p className="text-gray-400 mb-6">
              Bu özellik sadece kayıtlı kullanıcılar için kullanılabilir.
              Lütfen kayıtlı bir Gmail hesabı ile giriş yapın.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Mevcut email: {user?.email}
            </p>
            <Button 
              onClick={() => window.location.href = "/"}
              className="btn-primary"
            >
              Ana Sayfaya Git
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 neon-text">
              AI Destek Chat
            </h1>
            <p className="text-gray-300">
              Anime sitemizle ilgili her türlü sorunuz için AI desteği
            </p>
          </div>

          {!chatStarted ? (
            <div className="glass-morphism p-6 rounded-xl max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="text-white font-semibold block mb-2">
                    Destek Kategorisi Seçin:
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-black/50 border-white/20 text-white">
                      <SelectValue placeholder="Kategori seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="bg-anime-card border-white/10">
                      {categories.map((category) => (
                        <SelectItem 
                          key={category.value} 
                          value={category.value}
                          className="text-white"
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white font-semibold block mb-2">
                    Email:
                  </label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-black/50 border-white/20 text-white"
                  />
                </div>

                <Button
                  onClick={startChat}
                  disabled={!selectedCategory}
                  className="w-full btn-primary"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Sohbete Başla
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="glass-morphism p-6 rounded-xl h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === "user" 
                          ? "bg-neon-blue text-black" 
                          : message.isError 
                            ? "bg-red-500 text-white"
                            : "bg-neon-purple text-white"
                      }`}>
                        {message.sender === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className={`max-w-md rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-neon-blue text-black ml-auto"
                          : message.isError
                            ? "bg-red-900/50 text-red-200"
                            : "bg-white/10 text-white"
                      }`}>
                        <div className="whitespace-pre-wrap break-words">
                          {message.message}
                        </div>
                        
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            alt="Gönderilen görsel"
                            className="mt-2 rounded-lg max-w-xs"
                          />
                        )}
                        
                        <div className={`text-xs mt-1 opacity-70 ${
                          message.sender === "user" ? "text-black" : "text-gray-300"
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-neon-purple text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white/10 text-white rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-neon-blue border-t-transparent"></div>
                          <span>AI yanıt yazıyor...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="glass-morphism p-4 rounded-xl">
                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  </label>

                  <div className="flex-1">
                    <Textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Mesajınızı yazın..."
                      className="bg-black/50 border-white/20 text-white resize-none"
                      rows={1}
                    />
                    {selectedImage && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="border-neon-blue text-neon-blue">
                          Görsel seçildi: {selectedImage.name}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedImage(null)}
                          className="text-red-400"
                        >
                          Kaldır
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={sendMessage}
                    disabled={(!currentMessage.trim() && !selectedImage) || isLoading}
                    className="btn-primary"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
