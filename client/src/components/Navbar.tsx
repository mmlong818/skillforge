import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Sparkles, History, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span>Skill Generator</span>
        </Link>

        <nav className="flex items-center gap-1">
          {isAuthenticated && (
            <>
              <Link href="/history">
                <Button
                  variant={location === "/history" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">历史记录</span>
                </Button>
              </Link>
              <div className="ml-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user?.name || "用户"}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          {!isAuthenticated && (
            <Button size="sm" asChild>
              <a href={getLoginUrl()}>登录</a>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
