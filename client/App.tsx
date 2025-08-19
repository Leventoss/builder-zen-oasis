import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider, ProtectedRoute, useAuth } from "@/lib/auth";
import { AnimeStoreProvider } from "@/lib/animeStore";
import LoadingScreen from "@/components/LoadingScreen";
import ApiStatus from "@/components/ApiStatus";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AnimeDetails from "./pages/AnimeDetails";
import Browse from "./pages/Browse";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminTest from "./pages/AdminTest";
import CompleteAdmin from "./pages/CompleteAdmin";
import UltimateAdmin from "./pages/UltimateAdmin";
import AnimeRequest from "./pages/AnimeRequest";
import AnimeRequestFixed from "./pages/AnimeRequestFixed";
import Chat from "./pages/Chat";
import ChatFixed from "./pages/ChatFixed";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const AppContent = () => {
  const { loading } = useAuth();
  const [initialLoading, setInitialLoading] = useState(() => {
    return !sessionStorage.getItem("aniwa_app_loaded");
  });

  if (initialLoading) {
    return (
      <LoadingScreen
        onComplete={() => {
          setInitialLoading(false);
          sessionStorage.setItem("aniwa_app_loaded", "true");
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-anime-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
          <p className="text-white">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimeStoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/anime/:id" element={<AnimeDetails />} />
            <Route path="/anime-details/:id" element={<AnimeDetails />} />
            <Route path="/anime" element={<Browse />} />
            <Route path="/movies" element={<Browse />} />
            <Route path="/trending" element={<Browse />} />
            <Route path="/anime-request" element={<AnimeRequestFixed />} />
            <Route path="/anime-request-old" element={<AnimeRequest />} />
            <Route
              path="/my-list"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UltimateAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-old"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-test"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatFixed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat-old"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AnimeStoreProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
