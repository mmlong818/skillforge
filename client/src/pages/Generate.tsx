import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, Circle, Loader2, XCircle, FileCode, Download,
  ChevronDown, ChevronRight, ArrowLeft, Copy, Check, FolderTree,
  RefreshCw, AlertTriangle, Square, Trash2
} from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const STEP_LABELS = [
  "", "需求深度挖掘", "架构决策引擎", "元数据精炼",
  "SKILL.md 主体生成", "质量审计与优化", "配套资源生成", "最终组装与交付"
];

function StepIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "running") return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground/40" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 gap-1 text-[11px] px-1.5">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "已复制" : "复制"}
    </Button>
  );
}

function FilePreview({ file }: { file: { path: string; content: string } }) {
  const [expanded, setExpanded] = useState(false);
  const isSkillMd = file.path === "SKILL.md";

  return (
    <div className="border border-border/60 rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <FileCode className={`h-3.5 w-3.5 ${isSkillMd ? "text-emerald-500" : "text-primary"}`} />
          <span className="font-mono text-xs font-medium">{file.path}</span>
          {isSkillMd && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">核心文件</span>}
        </div>
        <div className="flex items-center gap-1">
          <CopyButton text={file.content} />
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </button>
      {expanded && (
        <div className="max-h-[500px] overflow-auto bg-muted/10">
          {isSkillMd ? (
            <div className="p-4 prose prose-sm max-w-none dark:prose-invert text-sm">
              <Streamdown>{file.content}</Streamdown>
            </div>
          ) : (
            <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
              <code>{file.content}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function Generate() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const genId = Number(params.id);
  const utils = trpc.useUtils();

  const { data: gen, isLoading } = trpc.skill.getStatus.useQuery(
    { id: genId },
    {
      refetchInterval: (query) => {
        const d = query.state.data;
        if (!d) return 2000;
        if (d.status === "completed" || d.status === "failed" || d.status === "cancelled") return false;
        return 2000;
      },
    }
  );

  const resumeMutation = trpc.skill.resume.useMutation({
    onSuccess: () => {
      toast.success("已重新启动生成流程");
      utils.skill.getStatus.invalidate({ id: genId });
    },
    onError: (err) => {
      toast.error("重试失败: " + err.message);
    },
  });

  const cancelMutation = trpc.skill.cancel.useMutation({
    onSuccess: () => {
      toast.success("已取消生成");
      utils.skill.getStatus.invalidate({ id: genId });
    },
    onError: (err) => {
      toast.error("取消失败: " + err.message);
    },
  });

  const deleteMutation = trpc.skill.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除生成记录");
      navigate("/");
    },
    onError: (err) => {
      toast.error("删除失败: " + err.message);
    },
  });

  const handleCancel = () => {
    if (window.confirm("确定要取消当前生成任务吗？")) {
      cancelMutation.mutate({ id: genId });
    }
  };

  const handleDelete = () => {
    if (window.confirm("确定要删除此生成记录吗？此操作不可恢复。")) {
      deleteMutation.mutate({ id: genId });
    }
  };

  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    if (gen?.steps) {
      const running = gen.steps.find((s) => s.status === "running");
      if (running) setExpandedStep(running.stepNumber);
    }
  }, [gen?.steps]);

  const completedCount = gen?.steps?.filter((s) => s.status === "completed").length || 0;
  const progress = gen?.steps ? Math.round((completedCount / 7) * 100) : 0;

  const resultFiles = useMemo(() => {
    if (!gen?.result) return [];
    const r = gen.result as any;
    return r?.files || [];
  }, [gen?.result]);

  const isPartial = useMemo(() => {
    if (!gen?.result) return false;
    return (gen.result as any)?.partial === true;
  }, [gen?.result]);

  const hasFailedSteps = useMemo(() => {
    return gen?.steps?.some((s) => s.status === "failed") || false;
  }, [gen?.steps]);

  const handleDownloadZip = async () => {
    if (!resultFiles.length) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const folderName = gen?.skillName || "skill";
    const folder = zip.folder(folderName)!;
    for (const file of resultFiles) {
      folder.file(file.path, file.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("下载成功");
  };

  const handleResume = () => {
    resumeMutation.mutate({ id: genId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!gen) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-sm text-muted-foreground">未找到该生成记录</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container py-4 flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-1 -ml-2 gap-1 h-7 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> 返回
            </Button>
            <h1 className="text-xl font-bold">{gen.skillName}</h1>
            <p className="text-xs text-muted-foreground">{gen.domain}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Cancel button for running generations */}
            {(gen.status === "running" || gen.status === "pending") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
                取消生成
              </Button>
            )}
            {/* Resume button for failed or partial generations */}
            {(gen.status === "failed" || gen.status === "cancelled" || (gen.status === "completed" && hasFailedSteps)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                disabled={resumeMutation.isPending}
                className="gap-1.5"
              >
                {resumeMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                重试失败步骤
              </Button>
            )}
            {gen.status === "completed" && resultFiles.length > 0 && (
              <Button size="sm" onClick={handleDownloadZip} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                下载 ZIP
              </Button>
            )}
            {/* Delete button for all non-running states */}
            {(gen.status === "completed" || gen.status === "failed" || gen.status === "cancelled") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                删除
              </Button>
            )}
          </div>
        </div>

        {/* Partial completion warning */}
        {isPartial && gen.status === "completed" && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">部分完成</p>
              <p className="text-xs text-amber-700 mt-0.5">
                部分步骤未能成功执行，已从已完成的步骤中组装可用结果。您可以点击"重试失败步骤"来补全缺失的内容。
              </p>
              {gen.errorMessage && (
                <p className="text-xs text-amber-600 mt-1">{gen.errorMessage}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Progress Timeline */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  生成进度
                  <span className="text-xs font-normal text-muted-foreground">{progress}%</span>
                </CardTitle>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isPartial ? "bg-amber-500" : "bg-primary"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-0.5 px-3 pb-3">
                {gen.steps?.map((step) => (
                  <button
                    key={step.stepNumber}
                    onClick={() => setExpandedStep(expandedStep === step.stepNumber ? null : step.stepNumber)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                      expandedStep === step.stepNumber
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <StepIcon status={step.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {step.stepNumber}. {STEP_LABELS[step.stepNumber]}
                      </p>
                      {step.summary && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {step.summary}
                        </p>
                      )}
                    </div>
                  </button>
                ))}

                {gen.status === "failed" && gen.errorMessage && (
                  <div className="mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-destructive font-medium">生成失败</p>
                    <p className="text-[11px] text-destructive/80 mt-0.5">{gen.errorMessage}</p>
                  </div>
                )}

                {gen.status === "cancelled" && (
                  <div className="mt-2 p-2 rounded-md bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium">已取消</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">此生成任务已被用户取消</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Step Output / Result Preview */}
          <div className="lg:col-span-2 space-y-4">
            {expandedStep && gen.steps && (
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm">
                    Step {expandedStep}: {STEP_LABELS[expandedStep]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {(() => {
                    const step = gen.steps?.find((s) => s.stepNumber === expandedStep);
                    if (!step) return null;
                    if (step.status === "pending") {
                      return <p className="text-xs text-muted-foreground">等待执行...</p>;
                    }
                    if (step.status === "running") {
                      return (
                        <div className="flex items-center gap-2 py-6 justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">AI 正在思考中...</span>
                        </div>
                      );
                    }
                    if (step.status === "failed") {
                      return (
                        <div className="p-3 rounded-md bg-destructive/10">
                          <p className="text-xs text-destructive">{step.errorMessage || "执行失败"}</p>
                        </div>
                      );
                    }
                    return (
                      <div className="prose prose-sm max-w-none dark:prose-invert text-sm max-h-[600px] overflow-auto">
                        <Streamdown>{step.output || ""}</Streamdown>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {gen.status === "completed" && resultFiles.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <FolderTree className="h-3.5 w-3.5 text-primary" />
                    生成结果 ({resultFiles.length} 个文件)
                    {isPartial && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">部分完成</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4 pb-4">
                  {(gen.result as any)?.directory_tree && (
                    <div className="p-2 rounded-md bg-muted/30 border border-border/50">
                      <pre className="text-[11px] font-mono whitespace-pre text-muted-foreground">
                        {(gen.result as any).directory_tree}
                      </pre>
                    </div>
                  )}
                  {resultFiles.map((file: any) => (
                    <FilePreview key={file.path} file={file} />
                  ))}

                  {(gen.result as any)?.usage && (
                    <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/10">
                      <h4 className="font-semibold text-xs mb-1.5">使用说明</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert text-xs">
                        <Streamdown>{
                          typeof (gen.result as any).usage === "string"
                            ? (gen.result as any).usage
                            : `**安装方式**: ${(gen.result as any).usage.installation || ""}\n\n**触发示例**:\n${((gen.result as any).usage.trigger_examples || []).map((e: string) => `- ${e}`).join("\n")}\n\n**迭代建议**: ${(gen.result as any).usage.iteration_suggestions || ""}`
                        }</Streamdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!expandedStep && gen.status !== "completed" && gen.status !== "failed" && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">点击左侧步骤查看详细输出</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
