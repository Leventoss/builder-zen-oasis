import { RequestHandler } from "express";

interface ChatRequest {
  message: string;
  category: string;
  sessionId: string;
  userId?: number;
  isPremium?: boolean;
}

// Topic keywords for filtering
const ANIME_RELATED_KEYWORDS = [
  "anime",
  "manga",
  "episode",
  "bölüm",
  "izle",
  "watch",
  "player",
  "video",
  "site",
  "hesap",
  "account",
  "giriş",
  "login",
  "kayıt",
  "register",
  "premium",
  "abonelik",
  "subscription",
  "destek",
  "support",
  "yardım",
  "help",
  "sorun",
  "problem",
  "hata",
  "error",
  "çalışmıyor",
  "not working",
  "one piece",
  "naruto",
  "black clover",
  "demon slayer",
  "attack on titan",
];

const OFF_TOPIC_KEYWORDS = [
  "kod",
  "code",
  "programming",
  "python",
  "javascript",
  "html",
  "css",
  "matematik",
  "math",
  "fizik",
  "physics",
  "kimya",
  "chemistry",
  "tarih",
  "history",
  "coğrafya",
  "geography",
  "yemek",
  "food",
  "recipe",
];

// Check if message is anime/site related
function isTopicRelated(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Check if message contains off-topic keywords
  const hasOffTopicKeywords = OFF_TOPIC_KEYWORDS.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase()),
  );

  if (hasOffTopicKeywords) {
    return false;
  }

  // Check if message contains anime-related keywords
  const hasAnimeKeywords = ANIME_RELATED_KEYWORDS.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase()),
  );

  return hasAnimeKeywords || lowerMessage.length < 50; // Allow short messages
}

// Generate contextual and varying responses
function getTopicSpecificResponse(
  category: string,
  message: string,
  isPremium: boolean = false,
): string {
  const lowerMessage = message.toLowerCase();

  // If message is off-topic, return redirect message
  if (!isTopicRelated(message)) {
    const redirectMessages = [
      "Üzgünüm, ben sadece anime ve sitemizle ilgili konularda yardım edebilirim. Anime ekletme, player sorunları, hesap yönetimi veya site kullanımı hakkında sorular sorabilirsiniz.",
      "Ben anime destek asistanıyım! Anime ekleme, video sorunları, premium üyelik gibi konularda size yardım edebilirim. Başka ne öğrenmek istersiniz?",
      "Sadece anime sitesiyle ilgili konularda uzmanım. İzleme sorunları, yeni anime talepleri veya hesap yönetimi hakkında sorularınızı yanıtlayabilirim."
    ];
    return redirectMessages[Math.floor(Math.random() * redirectMessages.length)];
  }

  // Add message context analysis
  const messageLength = message.length;
  const hasQuestion = lowerMessage.includes('?') || lowerMessage.includes('nasıl') || lowerMessage.includes('ne') || lowerMessage.includes('neden');
  const hasComplaint = lowerMessage.includes('çalışmıyor') || lowerMessage.includes('sorun') || lowerMessage.includes('hata') || lowerMessage.includes('problem');
  const hasRequest = lowerMessage.includes('ekle') || lowerMessage.includes('istiyorum') || lowerMessage.includes('lütfen');
  const isGreeting = lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hello');
  const isThanks = lowerMessage.includes('teşekkür') || lowerMessage.includes('sağol') || lowerMessage.includes('thanks');

  // Category-specific responses
  switch (category) {
    case "anime-ekletme":
      if (lowerMessage.includes("ekle") || lowerMessage.includes("add")) {
        return `Anime ekletme talebinizi aldım! Lütfen şu bilgileri verin:
        
1. Eklemek istediğiniz animeinin tam adı
2. Hangi sezon (örn: 1. sezon, 2. sezon)
3. Bölüm sayısı (eğer biliyorsanız)
4. Özel isteğiniz var mı?

Bu bilgileri verdikten sonra ekletme işlemini admin ekibimize ileteceğim.`;
      }
      break;

    case "anime-sorun":
      if (
        lowerMessage.includes("çalışmıyor") ||
        lowerMessage.includes("sorun") ||
        lowerMessage.includes("problem")
      ) {
        return `Player veya anime izleme sorununuz için şu bilgileri paylaşır mısınız:

1. Hangi anime ve bölümde sorun yaşıyorsunuz?
2. Sorun nasıl oluşuyor? (video açılmıyor, donuyor, ses yok vs.)
3. Hangi tarayıcı kullanıyorsunuz?
4. Mobil mi masaüstü mü kullanıyorsunuz?

Bu bilgilerle size daha iyi yardım edebilirim.`;
      }
      break;

    case "premium":
      if (isPremium) {
        return `Premium üyemizsiniz! Size özel yardım sağlayabilirim. Premium avantajlarınız:

✅ Reklamsız izleme
✅ Yüksek kalite video
✅ Öncelikli destek
✅ Erken erişim
✅ Özel içerikler

Hangi konuda yardıma ihtiyacınız var?`;
      } else {
        return `Premium üyelik hakkında bilgi mi istiyorsunuz? Premium avantajları:

⭐ Tamamen reklamsız deneyim
⭐ 4K kalitede anime izleme
⭐ Öncelikli müşteri desteği
⭐ Yeni bölümlere erken erişim
⭐ Özel premium içerikler
⭐ Çoklu cihaz desteği

Premium olmak ister misiniz?`;
      }
      break;

    case "site-isleyisi":
      return `Site kullanımı hakkında yardım edebilirim. Hangi konuda bilgi istiyorsunuz:

• Hesap oluşturma ve giriş yapma
• Anime arama ve keşfetme
• İzleme listesi kullanımı
• Site ayarları
• Mobil kullanım
• Diğer özellikler

Spesifik bir sorunuz var mı?`;

    default:
      break;
  }

  // Generic helpful response
  if (
    lowerMessage.includes("merhaba") ||
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi")
  ) {
    const premiumGreeting = isPremium
      ? " Premium üyemizsiniz, size özel destek sağlayacağım!"
      : "";
    return `Merhaba! Anime sitesi destek asistanıyım.${premiumGreeting} Size nasıl yardımcı olabilirim?`;
  }

  if (
    lowerMessage.includes("teşekkür") ||
    lowerMessage.includes("thanks") ||
    lowerMessage.includes("sağol")
  ) {
    return isPremium
      ? "Rica ederim! Premium üyemiz olduğunuz için her zaman buradayım. Başka bir konuda yardıma ihtiyacınız olursa hemen sorun!"
      : "Rica ederim! Başka sorularınız olursa çekinmeden sorabilirsiniz.";
  }

  // Default response for anime-related but unspecific messages
  return `Anladım, ${category.replace("-", " ")} konusunda yardım istiyorsunuz. Lütfen sorununuzu biraz daha detaylandırabilir misiniz? Bu şekilde size daha iyi yardım edebilirim.

İpucu: Mümkün olduğunca spesifik bilgi verirseniz (anime adı, sorun türü vb.) daha hızlı çözüm bulabiliriz.`;
}

// Main AI chat handler
export const handleAIChat: RequestHandler = async (req, res) => {
  try {
    const { message, category, sessionId, userId, isPremium }: ChatRequest =
      req.body;

    if (!message || !category) {
      return res.status(400).json({
        error: "Message and category are required",
      });
    }

    // Generate AI response
    const aiResponse = getTopicSpecificResponse(category, message, isPremium);

    // Log the conversation (optional)
    console.log(`AI Chat [${category}] User ${userId}: ${message}`);
    console.log(`AI Response: ${aiResponse}`);

    // In production, you might want to save this to database
    // await saveToDatabase(sessionId, userId, message, aiResponse, category);

    res.json({
      message: aiResponse,
      category,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(500).json({
      error: "AI servisinde bir hata oluştu",
      message:
        "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.",
    });
  }
};

// Get chat history
export const getChatHistory: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // In production, fetch from database
    // const history = await fetchChatHistory(sessionId);

    res.json({
      sessionId,
      messages: [], // Return empty for now
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ error: "Failed to get chat history" });
  }
};

// Check AI service health
export const checkAIHealth: RequestHandler = async (req, res) => {
  try {
    // Basic health check
    const testResponse = getTopicSpecificResponse("anime-sorun", "test", false);

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      testResponse: testResponse ? "working" : "error",
    });
  } catch (error) {
    console.error("AI Health check error:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
};
