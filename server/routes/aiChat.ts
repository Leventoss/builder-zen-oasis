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

  // Category-specific responses with variation
  switch (category) {
    case "anime-ekletme":
      if (hasRequest || lowerMessage.includes("ekle") || lowerMessage.includes("add")) {
        const requestResponses = [
          `Tabii! Anime ekletme talebinizi işleme alıyorum. Bu bilgileri paylaşır mısınız:\n\n📋 Anime adı (Türkçe/İngilizce/Japonca)\n📅 Çıkış yılı ve sezon bilgisi\n🎬 Bölüm sayısı (toplam)\n⭐ Özel notlarınız\n\nAdmin ekibimiz 24 saat içinde değerlendirecek!`,
          `Harika! Yeni anime talebi alıyorum 🎉\n\nLütfen şu detayları verin:\n• Animeinin tam adı\n• Hangi yıl ve sezon\n• Kaç bölümlük\n• Türü (aksiyon, romantik, vs.)\n\nEkleme işlemi genelde 1-2 gün sürer.`,
          `Anime ekletme talebiniz başarıyla alındı! 📝\n\nİhtiyacım olan bilgiler:\n1️⃣ Anime adı (orijinal + Türkçe)\n2️⃣ Sezon/yıl bilgisi\n3️⃣ Bölüm sayısı\n4️⃣ MAL/AniList linki (varsa)\n\nTalebiğiniz öncelik sırasına alınacak!`
        ];
        return requestResponses[Math.floor(Math.random() * requestResponses.length)];
      }

      if (hasQuestion) {
        return `Anime ekletme süreci hakkında merak ettiklerinizi çözelim! 🤔\n\n❓ Nasıl anime ekliyoruz?\n❓ Ne kadar sürer?\n❓ Hangi kriterler var?\n❓ Öncelik sırası nasıl?\n\nHangi konuda detay istiyorsunuz?`;
      }
      break;

    case "anime-sorun":
      if (hasComplaint || lowerMessage.includes("çalışm��yor") || lowerMessage.includes("açılmıyor")) {
        const troubleshootingResponses = [
          `Sorununu hemen çözelim! 🔧\n\nBilmem gerekenler:\n🎯 Hangi anime/bölüm?\n📱 Cihaz türü (telefon/bilgisayar)\n🌐 Tarayıcı (Chrome, Safari, vs.)\n⚡ Sorun türü (açılmıyor, donuyor, ses yok)\n\n%90 sorunları 5 dakikada çözüyoruz!`,
          `Teknik sorun mu? Hemen bakayım! 👨‍💻\n\nŞu bilgileri paylaşır mısın:\n• Hangi animede problem?\n• Video açılıyor mu?\n• Ses var mı?\n• İnternet hızın nasıl?\n\nÇoğu sorunu anında çözebiliriz.`,
          `Sorun bildirimi alındı! 🚨\n\nTanı için gerekli:\n📺 Anime/bölüm adı\n💻 Kullandığın platform\n🔊 Ses/görüntü durumu\n📶 Bağlantı kalitesi\n\nProblemi birlikte çözelim!`
        ];
        return troubleshootingResponses[Math.floor(Math.random() * troubleshootingResponses.length)];
      }

      if (lowerMessage.includes("yavaş") || lowerMessage.includes("yüklemiyor")) {
        return `Yavaşlık sorunu için hızlı çözümler:\n\n⚡ Sayfayı yenile (F5)\n🔄 Farklı sunucu dene\n📶 İnternet bağlantını kontrol et\n🧹 Tarayıcı cache'ini temizle\n\nGenelde bu adımlardan biri sorunu çözüyor!`;
      }

      if (lowerMessage.includes("ses") || lowerMessage.includes("sound")) {
        return `Ses sorunu için:\n\n🔊 Ses seviyesini kontrol et\n🎧 Kulaklık/hoparlör bağlantısı\n🔇 Tarayıcı ses izinleri\n▶️ Video player ayarları\n\nHangi adımı denedin?`;
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
