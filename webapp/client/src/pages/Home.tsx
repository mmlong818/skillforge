import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Sparkles, Zap, FileCode, Download, Shield, ArrowRight, Loader2, Wrench, Upload, FileText, X } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "7 步自动生成", desc: "需求分析到交付，全流程自动化" },
  { icon: FileCode, title: "完整 Skill 包", desc: "SKILL.md + scripts/ + references/" },
  { icon: Shield, title: "质量审计内置", desc: "10 维度评分 + 自动修复" },
  { icon: Download, title: "一键下载", desc: "ZIP 打包，即装即用" },
];

type TabMode = "create" | "fix";

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabMode>("create");

  // Create mode fields
  const [skillName, setSkillName] = useState("");
  const [domain, setDomain] = useState("");
  const [features, setFeatures] = useState("");
  const [scenarios, setScenarios] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  // Fix mode fields
  const [fixSkillName, setFixSkillName] = useState("");
  const [fixDomain, setFixDomain] = useState("");
  const [fixFeatures, setFixFeatures] = useState("");
  const [fixScenarios, setFixScenarios] = useState("");
  const [fixExtraNotes, setFixExtraNotes] = useState("");
  const [originalSkillMd, setOriginalSkillMd] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = trpc.skill.generate.useMutation({
    onSuccess: (data) => {
      navigate(`/generate/${data.id}`);
    },
  });

  const fixMutation = trpc.skill.fix.useMutation({
    onSuccess: (data) => {
      navigate(`/generate/${data.id}`);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
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

  const handleFixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixSkillName.trim() || !fixDomain.trim() || !fixFeatures.trim() || !originalSkillMd.trim()) return;
    fixMutation.mutate({
      skillName: fixSkillName.trim(),
      domain: fixDomain.trim(),
      features: fixFeatures.trim(),
      scenarios: fixScenarios.trim() || undefined,
      extraNotes: fixExtraNotes.trim() || undefined,
      originalSkillMd: originalSkillMd.trim(),
    });
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setOriginalSkillMd(text);
      setUploadedFileName(file.name);

      // Try to auto-extract skill name from YAML frontmatter
      const nameMatch = text.match(/^name:\s*(.+)$/m);
      if (nameMatch && !fixSkillName) {
        setFixSkillName(nameMatch[1].trim());
      }
      const descMatch = text.match(/^description:\s*(.+)$/m);
      if (descMatch && !fixDomain) {
        // Use first 50 chars of description as domain hint
        setFixDomain(descMatch[1].trim().slice(0, 100));
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }, [fixSkillName, fixDomain]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setOriginalSkillMd(text);
      setUploadedFileName(file.name);
      const nameMatch = text.match(/^name:\s*(.+)$/m);
      if (nameMatch && !fixSkillName) {
        setFixSkillName(nameMatch[1].trim());
      }
      const descMatch = text.match(/^description:\s*(.+)$/m);
      if (descMatch && !fixDomain) {
        setFixDomain(descMatch[1].trim().slice(0, 100));
      }
    };
    reader.readAsText(file);
  }, [fixSkillName, fixDomain]);

  const clearUpload = () => {
    setOriginalSkillMd("");
    setUploadedFileName("");
  };

  const isCreatePending = generateMutation.isPending;
  const isFixPending = fixMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero + Features */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="container relative py-8 md:py-12">
          <div className="mx-auto max-w-3xl text-center mb-6">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              基于 100+ 优秀 Skills 深度分析
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Perfect Skill
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"> Generator</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              输入需求，AI 自动执行 7 步流程，生成符合最佳实践的生产级 Agent Skill 包
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center p-3 rounded-lg border border-border/40 bg-card/80 backdrop-blur-sm">
                <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-xs">{f.title}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Form with Tabs */}
      <section className="container py-6 pb-12">
        <Card className="mx-auto max-w-2xl shadow-md border-border/60">
          {/* Tab Switcher */}
          <div className="flex border-b border-border/60">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "create"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              创建新 Skill
              {activeTab === "create" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("fix")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "fix"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wrench className="h-4 w-4" />
              修正已有 Skill
              {activeTab === "fix" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          </div>

          {/* Create Tab */}
          {activeTab === "create" && (
            <>
              <CardHeader className="text-center pb-1 pt-5 px-5">
                <CardTitle className="text-xl">创建新 Skill</CardTitle>
                <CardDescription className="text-xs">
                  描述你想创建的 Agent Skill，系统将自动完成全部 7 个步骤
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {!isAuthenticated && !authLoading ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-3 text-sm">请先登录后再创建 Skill</p>
                    <Button asChild>
                      <a href={getLoginUrl()}>登录开始使用</a>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="skillName" className="text-xs">技能名称 *</Label>
                        <Input
                          id="skillName"
                          placeholder="例如：code-reviewer"
                          value={skillName}
                          onChange={(e) => setSkillName(e.target.value)}
                          className="h-9 text-sm"
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">hyphen-case 格式</p>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="domain" className="text-xs">目标领域 *</Label>
                        <Input
                          id="domain"
                          placeholder="例如：代码质量与审查"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          className="h-9 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="features" className="text-xs">核心功能 *</Label>
                      <Textarea
                        id="features"
                        placeholder="描述核心功能，例如：&#10;- 自动审查代码质量&#10;- 检测安全漏洞&#10;- 提供重构建议"
                        value={features}
                        onChange={(e) => setFeatures(e.target.value)}
                        rows={3}
                        className="text-sm resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="scenarios" className="text-xs">使用场景（可选）</Label>
                        <Textarea
                          id="scenarios"
                          placeholder="描述典型使用场景"
                          value={scenarios}
                          onChange={(e) => setScenarios(e.target.value)}
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="extraNotes" className="text-xs">补充说明（可选）</Label>
                        <Textarea
                          id="extraNotes"
                          placeholder="技术栈偏好、平台要求等"
                          value={extraNotes}
                          onChange={(e) => setExtraNotes(e.target.value)}
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isCreatePending || !skillName.trim() || !domain.trim() || !features.trim()}
                    >
                      {isCreatePending ? (
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
            </>
          )}

          {/* Fix Tab */}
          {activeTab === "fix" && (
            <>
              <CardHeader className="text-center pb-1 pt-5 px-5">
                <CardTitle className="text-xl">修正已有 Skill</CardTitle>
                <CardDescription className="text-xs">
                  上传你的 SKILL.md，系统将诊断问题并按最佳实践重新输出优化版本
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {!isAuthenticated && !authLoading ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-3 text-sm">请先登录后再修正 Skill</p>
                    <Button asChild>
                      <a href={getLoginUrl()}>登录开始使用</a>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleFixSubmit} className="space-y-3.5">
                    {/* Upload Area */}
                    <div className="space-y-1">
                      <Label className="text-xs">原始 SKILL.md 内容 *</Label>
                      {!originalSkillMd ? (
                        <div
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            拖拽 SKILL.md 文件到此处，或
                            <span className="text-primary font-medium"> 点击上传</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            支持 .md 文件，或直接在下方粘贴内容
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".md,.txt,.markdown"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          {uploadedFileName && (
                            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-medium text-primary flex-1">{uploadedFileName}</span>
                              <button
                                type="button"
                                onClick={clearUpload}
                                className="p-0.5 rounded hover:bg-primary/10 transition-colors"
                              >
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          )}
                          <Textarea
                            value={originalSkillMd}
                            onChange={(e) => {
                              setOriginalSkillMd(e.target.value);
                              if (!uploadedFileName) return;
                            }}
                            rows={8}
                            className="text-xs font-mono resize-y"
                            placeholder="粘贴 SKILL.md 的完整内容..."
                          />
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-[11px] text-muted-foreground">
                              {originalSkillMd.length.toLocaleString()} 字符
                            </p>
                            {!uploadedFileName && (
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[11px] text-primary hover:underline"
                              >
                                或上传文件
                              </button>
                            )}
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".md,.txt,.markdown"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>

                    {/* Skill info fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="fixSkillName" className="text-xs">技能名称 *</Label>
                        <Input
                          id="fixSkillName"
                          placeholder="例如：code-reviewer"
                          value={fixSkillName}
                          onChange={(e) => setFixSkillName(e.target.value)}
                          className="h-9 text-sm"
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">将从上传文件中自动提取</p>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="fixDomain" className="text-xs">目标领域 *</Label>
                        <Input
                          id="fixDomain"
                          placeholder="例如：代码质量与审查"
                          value={fixDomain}
                          onChange={(e) => setFixDomain(e.target.value)}
                          className="h-9 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="fixFeatures" className="text-xs">期望的核心功能 *</Label>
                      <Textarea
                        id="fixFeatures"
                        placeholder="描述这个 Skill 应该具备的核心功能，系统会据此评估原始版本的缺失和不足"
                        value={fixFeatures}
                        onChange={(e) => setFixFeatures(e.target.value)}
                        rows={3}
                        className="text-sm resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="fixScenarios" className="text-xs">使用场景（可选）</Label>
                        <Textarea
                          id="fixScenarios"
                          placeholder="描述典型使用场景"
                          value={fixScenarios}
                          onChange={(e) => setFixScenarios(e.target.value)}
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="fixExtraNotes" className="text-xs">修正重点（可选）</Label>
                        <Textarea
                          id="fixExtraNotes"
                          placeholder="特别需要修正的方面，如结构、格式、内容深度等"
                          value={fixExtraNotes}
                          onChange={(e) => setFixExtraNotes(e.target.value)}
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isFixPending || !fixSkillName.trim() || !fixDomain.trim() || !fixFeatures.trim() || !originalSkillMd.trim()}
                    >
                      {isFixPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          正在提交...
                        </>
                      ) : (
                        <>
                          <Wrench className="h-4 w-4" />
                          开始修正 Skill
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}
