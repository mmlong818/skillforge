import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import {
  CheckCircle2, Loader2, XCircle, Clock, ArrowLeft, Plus, Sparkles, Trash2, Ban, Wrench, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
        <CheckCircle2 className="h-2.5 w-2.5" /> 已完成
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> 生成中
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
        <XCircle className="h-2.5 w-2.5" /> 失败
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
        <Ban className="h-2.5 w-2.5" /> 已取消
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
      <Clock className="h-2.5 w-2.5" /> 等待中
    </span>
  );
}

export default function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: generations, isLoading } = trpc.skill.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteMutation = trpc.skill.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除生成记录");
      utils.skill.history.invalidate();
    },
    onError: (err) => {
      toast.error("删除失败: " + err.message);
    },
  });

  const regenerateMutation = trpc.skill.quickRegenerate.useMutation({
    onSuccess: (data) => {
      toast.success("已创建新的生成任务");
      navigate(`/generate/${data.id}`);
    },
    onError: (err) => {
      toast.error("重新生成失败: " + err.message);
    },
  });

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("确定要删除此生成记录吗？此操作不可恢复。")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleRegenerate = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    regenerateMutation.mutate({ id });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container py-4 flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-1 -ml-2 gap-1 h-7 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> 返回
            </Button>
            <h1 className="text-xl font-bold">生成历史</h1>
            <p className="text-xs text-muted-foreground">查看和管理你的 Skill 生成记录</p>
          </div>
          <Button size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            新建 Skill
          </Button>
        </div>

        {!isAuthenticated && !authLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">请先登录查看历史记录</p>
              <Button size="sm" asChild>
                <a href={getLoginUrl()}>登录</a>
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !generations || generations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium mb-0.5">还没有生成记录</p>
              <p className="text-xs text-muted-foreground mb-3">创建你的第一个 Agent Skill</p>
              <Button size="sm" onClick={() => navigate("/")} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                开始创建
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {generations.map((gen) => (
              <Link key={gen.id} href={`/generate/${gen.id}`}>
                <Card className="hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="flex items-center justify-between py-2.5 px-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{gen.skillName}</h3>
                        {(gen as any).mode === "fix" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                            <Wrench className="h-2.5 w-2.5" /> 修正
                          </span>
                        )}
                        <StatusBadge status={gen.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {gen.domain} · {new Date(gen.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {gen.status === "running" && (
                        <span className="text-[11px] text-muted-foreground">
                          Step {gen.currentStep}/{(gen as any).mode === "fix" ? 3 : 7}
                        </span>
                      )}
                      {gen.status === "completed" && (
                        <button
                          onClick={(e) => handleRegenerate(e, gen.id)}
                          className="p-1 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors"
                          title="用相同参数重新生成"
                          disabled={regenerateMutation.isPending}
                        >
                          {regenerateMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, gen.id)}
                        className="p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
