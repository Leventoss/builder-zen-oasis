import React, { useState, useEffect, useRef } from "react";
import { Send, Image, Settings, Bot, User, AlertCircle, Crown, Lock } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  category?: string;
}

interface ChatSession {
  id: string;
  category: string;
  status: "active" | "waiting" | "resolved";
  createdAt: Date;
}

interface PremiumSettings {
  chatAccess: 'premium' | 'registered' | 'both';
  enabled: boolean;
}

export default function ChatEnhanced() {
  const { user, isAuthenticated, isPremium } = useAuth();
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
  const [premiumSettings, setPremiumSettings] = useState<PremiumSettings>({
    chatAccess: 'both',
    enabled: true
  });

  const categories = [
    { value: "anime-ekletme", label: "Anime Ekletme", premium: false },
    { value: "anime-sorun", label: "Anime/Player Sorunu", premium: false },
    { value: "site-isleyisi", label: "Site İşleyişi", premium: false },
    { value: "premium", label: "Premium Destek", premium: true },
    { value: "oncelik-destek", label: "Öncelikli Destek", premium: true },
  ];

  const categoryGreetings = {
    "anime-ekletme": "Merhaba! Anime ekletme talepleriniz için buradayım. Eklemek istediğiniz animeyi ve detaylarını yazınız.",
    "anime-sorun": "Merhaba! Anime izlerken veya playerda yaşadığınız sorunları detaylıca yazarsanız hızlıca yardımcı olabilirim.",
    "site-isleyisi": "Merhaba! Sitemizin işleyişiyle ilgili sorularınızı ve önerilerinizi buradan iletebilirsiniz.",
    "premium": "Merhaba! Premium üyelik ve özel destek için sorularınızı bekliyorum. Size özel yardım sağlayabilirim.",
    "oncelik-destek": "Merhaba! Premium üyemizsiniz, bu yüzden öncelikli destek hattındasınız. Size hızlı çözüm sağlayacağım."
  };

  const categoryTips = {
    "anime-ekletme": "İpucu: Ekletmek istediğiniz anime adını, sezonunu ve varsa özel isteğinizi belirtin.",
    "anime-sorun": "İpucu: Sorununuzu detaylıca yazarsanız daha hızlı çözüm bulabilirim.",
    "site-isleyisi": "İpucu: Siteyle ilgili öneri veya şikayetlerinizi açıkça belirtin.",
    "premium": "İpucu: Premium üyelik avantajları ve ödeme sorunları için buradayım.",
    "oncelik-destek": "İpucu: Premium üye olarak 7/24 öncelikli destek alıyorsunuz."
  };

  // Load settings and check access
  useEffect(() => {
    loadPremiumSettings();
    loadAllowedEmails();
  }, []);

  const loadPremiumSettings = async () => {
    try {
      const response = await fetch('/api/admin/premium-settings');
      if (response.ok) {
        const settings = await response.json();
        setPremiumSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load premium settings:', error);
    }
  };

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

  // Check if user has access to chat
  const hasAccessToChat = () => {
    if (!isAuthenticated) return false;
    if (user?.isAdmin) return true;

    switch (premiumSettings.chatAccess) {
      case 'premium':
        return isPremium;
      case 'registered':
        return true;
      case 'both':
        return true;
      default:
        return allowedEmails.includes(user?.email || '');
    }
  };

  // Check if user can access premium categories
  const canAccessPremiumCategory = (category: string) => {
    const categoryInfo = categories.find(c => c.value === category);
    if (!categoryInfo?.premium) return true;
    return isPremium || user?.isAdmin;
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startChat = () => {
    if (!selectedCategory) return;

    const categoryInfo = categories.find(c => c.value === selectedCategory);
    if (categoryInfo?.premium && !isPremium && !user?.isAdmin) {
      toast({
        title: "Premium Gerekli",
        description: "Bu kategori sadece premium üyeler için geçerlidir.",
        variant: "destructive",
      });
      return;
    }

    setChatStarted(true);
    const sessionId = `session_${Date.now()}`;
    setSessionId(sessionId);

    // Add greeting message
    const greetingMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "bot",
      message: categoryGreetings[selectedCategory] || "Merhaba! Size nasıl yardımcı olabilirim?",
      timestamp: new Date(),
      category: selectedCategory
    };

    setMessages([greetingMessage]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() && !selectedImage) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: "user",
      message: currentMessage,
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
      timestamp: new Date(),
      category: selectedCategory
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Enhanced AI prompt for topic-specific responses
      const aiPrompt = getTopicSpecificPrompt(selectedCategory, currentMessage);
      
      const response = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: aiPrompt,
          category: selectedCategory,
          sessionId: sessionId,
          userId: user?.id,
          isPremium: isPremium
        }),
      });

      if (!response.ok) {
        throw new Error('AI yanıtı alınamadı');
      }

      const aiResponse = await response.json();

      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        sender: "bot",
        message: aiResponse.message || "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.",
        timestamp: new Date(),
        category: selectedCategory
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        sender: "bot",
        message: "Özür dilerim, teknik bir sorun yaşadım. Lütfen sorunuzı farklı şekilde ifade edebilir misiniz?",
        timestamp: new Date(),
        isError: true,
        category: selectedCategory
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get topic-specific AI prompt
  const getTopicSpecificPrompt = (category: string, userMessage: string) => {
    const baseContext = `Sen bir anime sitesi destek asistanısın. Sadece anime, site işleyişi ve ilgili konularda yardım et. Programlama, matematik veya alakasız konularda yardım etme.`;
    
    const categoryPrompts = {
      "anime-ekletme": `${baseContext} Kullanıcı anime ekletme talebi yapıyor. Anime adını, sezonunu ve özel isteklerini sor. Anime veritabanından kontrol et ve ekleme süreci hakkında bilgi ver.`,
      "anime-sorun": `${baseContext} Kullanıcı anime izleme veya player sorunu yaşıyor. Teknik sorunları çözmek için detaylı bilgi iste ve çözüm öneriler sun.`,
      "site-isleyisi": `${baseContext} Site işleyişi ile ilgili sorular cevapla. Özellikler, hesap yönetimi ve site kullanımı hakkında yardım et.`,
      "premium": `${baseContext} Premium üyelik avantajları, ödemeler ve özel özellikler hakkında bilgi ver. Premium kullanıcıya özel hizmet sun.`,
      "oncelik-destek": `${baseContext} Bu premium kullanıcı öncelikli destek alıyor. Hızlı ve detaylı çözümler sun, özel yardım sağla.`
    };

    return `${categoryPrompts[category] || baseContext}\n\nKullanıcı mesajı: ${userMessage}`;
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  };

  // Render access denied message
  if (!hasAccessToChat()) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Lock className="h-16 w-16 text-anime-accent mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">Destek Erişimi</h1>
            {!isAuthenticated ? (
              <div>
                <p className="text-gray-400 mb-6">
                  Destek hattını kullanmak için giriş yapmanız gerekiyor.
                </p>
                <Button className="bg-anime-accent hover:bg-anime-accent/80">
                  Giriş Yap
                </Button>
              </div>
            ) : premiumSettings.chatAccess === 'premium' && !isPremium ? (
              <div>
                <p className="text-gray-400 mb-6">
                  Destek hattı sadece premium üyeler için açıktır.
                </p>
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Premium Ol
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 mb-6">
                  Şu anda destek hattına erişim yetkiniz bulunmamaktadır.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!chatStarted) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">Destek Merkezi</h1>
              <p className="text-gray-400">
                Size nasıl yardımcı olmamızı istiyorsunuz? Kategori seçerek başlayın.
              </p>
              {isPremium && (
                <Badge className="bg-yellow-600 mt-4">
                  <Crown className="h-4 w-4 mr-1" />
                  Premium Üye - Öncelikli Destek
                </Badge>
              )}
            </div>

            <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Destek Kategorisi Seçin</h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    disabled={category.premium && !isPremium && !user?.isAdmin}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      selectedCategory === category.value
                        ? "bg-anime-accent text-white"
                        : category.premium && !isPremium && !user?.isAdmin
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-anime-dark text-white hover:bg-anime-accent/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.label}</span>
                      {category.premium && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    {category.premium && !isPremium && !user?.isAdmin && (
                      <p className="text-sm text-gray-500 mt-1">Premium üyelik gerekli</p>
                    )}
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className="mt-6 p-4 bg-anime-dark rounded-lg">
                  <p className="text-sm text-gray-300">
                    {categoryTips[selectedCategory]}
                  </p>
                </div>
              )}

              <Button
                onClick={startChat}
                disabled={!selectedCategory || !canAccessPremiumCategory(selectedCategory)}
                className="w-full mt-6 bg-anime-accent hover:bg-anime-accent/80"
              >
                <Bot className="h-4 w-4 mr-2" />
                Sohbeti Başlat
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />
      
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Chat Header */}
          <div className="bg-anime-card border border-anime-accent/20 p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-anime-accent" />
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {categories.find(c => c.value === selectedCategory)?.label} Desteği
                  </h2>
                  <p className="text-sm text-gray-400">AI Destek Asistanı</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPremium && (
                  <Badge className="bg-yellow-600">
                    <Crown className="h-4 w-4 mr-1" />
                    Premium
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-green-600">
                  Aktif
                </Badge>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-anime-card border-x border-anime-accent/20 h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-anime-accent text-white"
                      : message.isError
                      ? "bg-red-600/20 border border-red-600/40 text-red-200"
                      : "bg-anime-dark text-white"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === "bot" && (
                      <Bot className="h-5 w-5 text-anime-accent mt-0.5 flex-shrink-0" />
                    )}
                    {message.sender === "user" && (
                      <User className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.message}</p>
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Uploaded"
                          className="mt-2 max-w-xs rounded"
                        />
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-anime-dark text-white p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-anime-accent" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-anime-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-anime-accent rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-anime-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-anime-card border border-anime-accent/20 p-4 rounded-b-lg">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="bg-anime-dark border-anime-accent/30"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className="border-anime-accent/30"
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || (!currentMessage.trim() && !selectedImage)}
                  className="bg-anime-accent hover:bg-anime-accent/80"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {selectedImage && (
              <div className="mt-3 flex items-center gap-2">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected"
                  className="w-16 h-16 object-cover rounded"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                  className="border-anime-accent/30"
                >
                  Kaldır
                </Button>
              </div>
            )}

            {isPremium && (
              <Alert className="mt-3 border-yellow-600/40 bg-yellow-600/10">
                <Crown className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-200">
                  Premium üye olarak öncelikli destek alıyorsunuz. Yanıtlarımız daha hızlı ve detaylı olacaktır.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
