import { useState } from "react";
import { Search, Menu, X, User, Bell, Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchDropdown from "@/components/SearchDropdown";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useAnimeStore } from "@/lib/animeStore";

interface HeaderProps {
  onAuthClick?: () => void;
}

export default function Header({ onAuthClick }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications, markNotificationRead } = useAnimeStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { name: t.home, href: "/" },
    { name: t.anime, href: "/anime?category=anime" },
    { name: t.movies, href: "/anime?category=movie" },
    { name: t.trending, href: "/anime?category=trending" },
    { name: t.requests, href: "/anime-request" },
    { name: t.myList, href: "/my-list" },
    { name: "Destek Chat", href: "/chat" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-morphism">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold neon-text">Aniwa</div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-neon-blue transition-colors duration-300 font-medium"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              {isSearchOpen ? (
                <SearchDropdown
                  onClose={() => setIsSearchOpen(false)}
                  className="w-80"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-400 hover:text-neon-blue transition-colors"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Notifications */}
            {isAuthenticated && (
              <DropdownMenu
                open={showNotifications}
                onOpenChange={setShowNotifications}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative text-gray-400 hover:text-neon-blue transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 bg-anime-card border-white/10 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-white/10">
                    <h3 className="text-white font-semibold">
                      {t.notifications}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {unreadCount} {t.unreadNotifications}
                    </p>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-white/10 hover:bg-white/5 cursor-pointer ${
                            !notification.read ? "bg-neon-blue/5" : ""
                          }`}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4
                                className={`text-sm font-medium ${!notification.read ? "text-white" : "text-gray-300"}`}
                              >
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(
                                  notification.timestamp,
                                ).toLocaleDateString("tr-TR")}{" "}
                                •{" "}
                                {new Date(
                                  notification.timestamp,
                                ).toLocaleTimeString("tr-TR")}
                              </p>
                            </div>
                            <div
                              className={`ml-2 w-2 h-2 rounded-full ${
                                notification.type === "success"
                                  ? "bg-green-400"
                                  : notification.type === "warning"
                                    ? "bg-yellow-400"
                                    : notification.type === "error"
                                      ? "bg-red-400"
                                      : "bg-neon-blue"
                              }`}
                            />
                          </div>
                          {!notification.read && (
                            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-neon-blue rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t.noNotifications}</p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-neon-blue transition-colors"
                >
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-32 bg-anime-card border-white/10">
                <DropdownMenuItem
                  onClick={() => setLanguage("tr")}
                  className={`text-white hover:bg-white/10 ${language === "tr" ? "bg-white/10" : ""}`}
                >
                  🇹🇷 Türkçe
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className={`text-white hover:bg-white/10 ${language === "en" ? "bg-white/10" : ""}`}
                >
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Actions */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-neon-blue"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-anime-card border-white/10">
                    <DropdownMenuItem className="text-white hover:bg-white/10 font-medium">
                      {user?.username}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/profile")}
                      className="text-white hover:bg-white/10 cursor-pointer"
                    >
                      {t.profile}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        (window.location.href = "/profile?tab=history")
                      }
                      className="text-white hover:bg-white/10 cursor-pointer"
                    >
                      {t.watchHistory}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        (window.location.href = "/profile?tab=watchlist")
                      }
                      className="text-white hover:bg-white/10 cursor-pointer"
                    >
                      {t.myList}
                    </DropdownMenuItem>
                    {user?.isAdmin && (
                      <DropdownMenuItem
                        onClick={() => (window.location.href = "/admin")}
                        className="text-neon-blue hover:bg-neon-blue/10"
                      >
                        {t.admin}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        (window.location.href = "/profile?tab=settings")
                      }
                      className="text-white hover:bg-white/10 cursor-pointer"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {t.settings}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      {t.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button onClick={onAuthClick} className="btn-primary text-sm">
                {t.signIn}
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-neon-blue transition-colors duration-300 font-medium px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              {!isAuthenticated && (
                <Button
                  onClick={() => {
                    onAuthClick?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn-primary text-sm w-fit"
                >
                  {t.signIn}
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
