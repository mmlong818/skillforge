import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import {
  CheckCircle2, Loader2, XCircle, Clock, ArrowLeft, Plus, Sparkles
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> 已完成
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
        <Loader2 className="h-3 w-3 animate-spin" /> 生成中
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
        <XCircle className="h-3 w-3" /> 失败
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <Clock className="h-3 w-3" /> 等待中
    </span>
  );
}

export default function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: generations, isLoading } = trpc.skill.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container py-6 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2 -ml-2 gap-1">
              <ArrowLeft className="h-4 w-4" /> 返回
            </Button>
            <h1 className="text-2xl font-bold">生成历史</h1>
            <p className="text-sm text-muted-foreground">查看和管理你的 Skill 生成记录</p>
          </div>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Plus className="h-4 w-4" />
            新建 Skill
          </Button>
        </div>

        {!isAuthenticated && !authLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">请先登录查看历史记录</p>
              <Button asChild>
                <a href={getLoginUrl()}>登录</a>
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !generations || generations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-medium mb-1">还没有生成记录</p>
              <p className="text-sm text-muted-foreground mb-4">创建你的第一个 Agent Skill</p>
              <Button onClick={() => navigate("/")} className="gap-2">
                <Plus className="h-4 w-4" />
                开始创建
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {generations.map((gen) => (
              <Link key={gen.id} href={`/generate/${gen.id}`}>
                <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold truncate">{gen.skillName}</h3>
                        <StatusBadge status={gen.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {gen.domain} · {new Date(gen.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    {gen.status === "running" && (
                      <span className="text-xs text-muted-foreground">
                        Step {gen.currentStep}/7
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
