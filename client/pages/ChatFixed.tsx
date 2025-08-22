import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Image,
  Settings,
  Bot,
  User,
  AlertCircle,
  Lock,
} from "lucide-react";
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

export default function ChatFixed() {
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

  const categories = [
    { value: "anime-ekletme", label: "Anime Ekletme" },
    { value: "anime-sorun", label: "Anime/Player Sorunu" },
    { value: "site-isleyisi", label: "Site İşleyişi" },
    { value: "premium", label: "Premium Destek" },
  ];

  const categoryGreetings = {
    "anime-ekletme":
      "Merhaba! Anime ekletme talepleriniz için buradayım. Eklemek istediğiniz animeyi ve detaylarını yazınız.",
    "anime-sorun":
      "Merhaba! Anime izlerken veya playerda yaşadığınız sorunları detaylıca yazarsanız hızlıca yardımcı olabilirim.",
    "site-isleyisi":
      "Merhaba! Sitemizin işleyişiyle ilgili sorularınızı ve önerilerinizi buradan iletebilirsiniz.",
    premium:
      "Merhaba! Premium üyelik ve özel destek için sorularınızı bekliyorum.",
  };

  const categoryTips = {
    "anime-ekletme":
      "İpucu: Ekletmek istediğiniz anime adını, sezonunu ve varsa özel isteğinizi belirtin.",
    "anime-sorun":
      "İpucu: Sorununuzu detaylıca yazarsanız daha hızlı çözüm bulabilirim.",
    "site-isleyisi":
      "İpucu: Siteyle ilgili öneri veya şikayetlerinizi açıkça belirtin.",
    premium:
      "İpucu: Premium üyelik avantajları ve ödeme sorunları için buradayım.",
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user has access to chat (only registered users)
  const hasAccessToChat = () => {
    return isAuthenticated; // Simply check if user is logged in
  };

  const startChat = () => {
    if (!selectedCategory) return;

    setChatStarted(true);
    const sessionId = `session_${Date.now()}`;
    setSessionId(sessionId);

    // Add greeting message
    const greetingMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "bot",
      message:
        categoryGreetings[selectedCategory] ||
        "Merhaba! Size nasıl yardımcı olabilirim?",
      timestamp: new Date(),
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
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          category: selectedCategory,
          sessionId: sessionId,
          userId: user?.id,
          isPremium: user?.isPremium || false,
        }),
      });

      if (!response.ok) {
        throw new Error("AI yanıtı alınamadı");
      }

      const aiResponse = await response.json();

      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        sender: "bot",
        message:
          aiResponse.message ||
          "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("AI chat error:", error);

      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        sender: "bot",
        message:
          "Özür dilerim, teknik bir sorun yaşadım. Lütfen sorunuzı farklı şekilde ifade edebilir misiniz?",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
    }
  };

  // Render access denied message for non-authenticated users
  if (!hasAccessToChat()) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Lock className="h-16 w-16 text-anime-accent mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Destek Erişimi
            </h1>
            <p className="text-gray-400 mb-6">
              Destek hattını kullanmak için siteye giriş yapmanız gerekiyor.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Sadece kayıtlı kullanıcılar destek hattını kullanabilir.
            </p>
            <Button
              className="bg-anime-accent hover:bg-anime-accent/80 text-white font-bold"
              onClick={() => (window.location.href = "/")}
            >
              Giriş Yap
            </Button>
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
              <h1 className="text-3xl font-bold text-white mb-4">
                Destek Merkezi
              </h1>
              <p className="text-gray-400">
                Size nasıl yardımcı olmamızı istiyorsunuz? Kategori seçerek
                başlayın.
              </p>
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm">
                  ✅ Kayıtlı kullanıcı olarak destek hattına erişiminiz var
                </p>
              </div>
            </div>

            <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">
                Destek Kategorisi Seçin
              </h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      selectedCategory === category.value
                        ? "bg-anime-accent text-white"
                        : "bg-anime-dark text-white hover:bg-anime-accent/20"
                    }`}
                  >
                    <span className="font-medium">{category.label}</span>
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
                disabled={!selectedCategory}
                className="w-full mt-6 bg-anime-accent hover:bg-anime-accent/80 text-white font-bold disabled:bg-gray-600 disabled:text-gray-400"
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
                    {
                      categories.find((c) => c.value === selectedCategory)
                        ?.label
                    }{" "}
                    Desteği
                  </h2>
                  <p className="text-sm text-gray-400">AI Destek Asistanı</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-600">
                  Kayıtlı Kullanıcı
                </Badge>
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
                      <div
                        className="w-2 h-2 bg-anime-accent rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-anime-accent rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
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
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                  className="border-anime-accent/30"
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={
                    isLoading || (!currentMessage.trim() && !selectedImage)
                  }
                  className="bg-anime-accent hover:bg-anime-accent/80 text-white font-bold disabled:bg-gray-600 disabled:text-gray-400"
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

            <div className="mt-3 p-3 bg-blue-600/10 border border-blue-600/40 rounded-lg">
              <p className="text-blue-200 text-sm">
                💡 Sadece anime ve site ile ilgili konularda destek verebilirim.
                Kayıtlı kullanıcı olarak bu hizmeti kullanabiliyorsunuz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
