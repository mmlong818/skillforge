import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Zap, FileCode, Download, History, Shield, ArrowRight, Loader2 } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "7 步自动生成", desc: "从需求分析到最终交付，全流程自动化" },
  { icon: FileCode, title: "完整 Skill 包", desc: "SKILL.md + scripts/ + references/ + templates/" },
  { icon: Shield, title: "质量审计内置", desc: "10 维度评分 + 自动修复 + 最佳实践验证" },
  { icon: Download, title: "一键 ZIP 下载", desc: "生成完成后打包下载，即装即用" },
];

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [skillName, setSkillName] = useState("");
  const [domain, setDomain] = useState("");
  const [features, setFeatures] = useState("");
  const [scenarios, setScenarios] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const generateMutation = trpc.skill.generate.useMutation({
    onSuccess: (data) => {
      navigate(`/generate/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim() || !domain.trim() || !features.trim()) return;
    generateMutation.mutate({
      skillName: skillName.trim(),
      domain: domain.trim(),
      features: features.trim(),
      scenarios: scenarios.trim() || undefined,
      extraNotes: extraNotes.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              基于 100+ 优秀 Skills 深度分析
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Perfect Skill
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"> Generator</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              输入你的需求，AI 自动执行 7 步流程，生成符合 Anthropic 最佳实践的生产级 Agent Skill 包
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center p-4 rounded-xl border border-border/50 bg-card">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Form */}
      <section className="container pb-20">
        <Card className="mx-auto max-w-2xl shadow-lg border-border/60">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">创建新 Skill</CardTitle>
            <CardDescription>
              描述你想创建的 Agent Skill，系统将自动完成全部 7 个步骤
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isAuthenticated && !authLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">请先登录后再创建 Skill</p>
                <Button asChild size="lg">
                  <a href={getLoginUrl()}>登录开始使用</a>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skillName">技能名称 *</Label>
                    <Input
                      id="skillName"
                      placeholder="例如：code-reviewer"
                      value={skillName}
                      onChange={(e) => setSkillName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">hyphen-case 格式</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">目标领域 *</Label>
                    <Input
                      id="domain"
                      placeholder="例如：代码质量与审查"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">核心功能 *</Label>
                  <Textarea
                    id="features"
                    placeholder="描述这个 Skill 的核心功能，例如：&#10;- 自动审查代码质量&#10;- 检测常见的安全漏洞&#10;- 提供重构建议"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scenarios">使用场景</Label>
                  <Textarea
                    id="scenarios"
                    placeholder="描述典型的使用场景（可选）"
                    value={scenarios}
                    onChange={(e) => setScenarios(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraNotes">补充说明</Label>
                  <Textarea
                    id="extraNotes"
                    placeholder="其他需要说明的信息，如技术栈偏好、平台要求等（可选）"
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={generateMutation.isPending || !skillName.trim() || !domain.trim() || !features.trim()}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在创建...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      开始生成 Skill
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
