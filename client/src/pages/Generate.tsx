import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, Circle, Loader2, XCircle, FileCode, Download,
  ChevronDown, ChevronRight, ArrowLeft, Copy, Check, FolderTree
} from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const STEP_LABELS = [
  "", "需求深度挖掘", "架构决策引擎", "元数据精炼",
  "SKILL.md 主体生成", "质量审计与优化", "配套资源生成", "最终组装与交付"
];

function StepIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "running") return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
  if (status === "failed") return <XCircle className="h-5 w-5 text-destructive" />;
  return <Circle className="h-5 w-5 text-muted-foreground/40" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1 text-xs">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "已复制" : "复制"}
    </Button>
  );
}

function FilePreview({ file }: { file: { path: string; content: string } }) {
  const [expanded, setExpanded] = useState(false);
  const ext = file.path.split(".").pop() || "";
  const lang = ext === "md" ? "markdown" : ext === "py" ? "python" : ext === "ts" ? "typescript" : ext;

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm font-medium">{file.path}</span>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={file.content} />
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {expanded && (
        <div className="max-h-96 overflow-auto bg-muted/10">
          <pre className="p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
            <code>{file.content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default function Generate() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const genId = Number(params.id);

  const { data: gen, isLoading } = trpc.skill.getStatus.useQuery(
    { id: genId },
    {
      refetchInterval: (query) => {
        const d = query.state.data;
        if (!d) return 2000;
        if (d.status === "completed" || d.status === "failed") return false;
        return 2000;
      },
    }
  );

  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Auto-expand the currently running step
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

  const handleDownloadZip = async () => {
    if (!resultFiles.length) return;
    // Dynamic import JSZip
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!gen) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground">未找到该生成记录</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container py-6 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2 -ml-2 gap-1">
              <ArrowLeft className="h-4 w-4" /> 返回
            </Button>
            <h1 className="text-2xl font-bold">{gen.skillName}</h1>
            <p className="text-sm text-muted-foreground">{gen.domain}</p>
          </div>
          {gen.status === "completed" && resultFiles.length > 0 && (
            <Button onClick={handleDownloadZip} className="gap-2">
              <Download className="h-4 w-4" />
              下载 ZIP
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Progress Timeline */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  生成进度
                  <span className="text-sm font-normal text-muted-foreground">{progress}%</span>
                </CardTitle>
                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {gen.steps?.map((step) => (
                  <button
                    key={step.stepNumber}
                    onClick={() => setExpandedStep(expandedStep === step.stepNumber ? null : step.stepNumber)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      expandedStep === step.stepNumber
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <StepIcon status={step.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Step {step.stepNumber}: {STEP_LABELS[step.stepNumber]}
                      </p>
                      {step.summary && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {step.summary}
                        </p>
                      )}
                    </div>
                  </button>
                ))}

                {gen.status === "failed" && gen.errorMessage && (
                  <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-medium">生成失败</p>
                    <p className="text-xs text-destructive/80 mt-1">{gen.errorMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Step Output / Result Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step detail view */}
            {expandedStep && gen.steps && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Step {expandedStep}: {STEP_LABELS[expandedStep]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const step = gen.steps?.find((s) => s.stepNumber === expandedStep);
                    if (!step) return null;
                    if (step.status === "pending") {
                      return <p className="text-sm text-muted-foreground">等待执行...</p>;
                    }
                    if (step.status === "running") {
                      return (
                        <div className="flex items-center gap-3 py-8 justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">AI 正在思考中...</span>
                        </div>
                      );
                    }
                    if (step.status === "failed") {
                      return (
                        <div className="p-4 rounded-lg bg-destructive/10">
                          <p className="text-sm text-destructive">{step.errorMessage || "执行失败"}</p>
                        </div>
                      );
                    }
                    return (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>{step.output || ""}</Streamdown>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Final result */}
            {gen.status === "completed" && resultFiles.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-primary" />
                    生成结果 ({resultFiles.length} 个文件)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Directory tree */}
                  {(gen.result as any)?.directory_tree && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <pre className="text-xs font-mono whitespace-pre text-muted-foreground">
                        {(gen.result as any).directory_tree}
                      </pre>
                    </div>
                  )}
                  {/* File list */}
                  {resultFiles.map((file: any) => (
                    <FilePreview key={file.path} file={file} />
                  ))}

                  {/* Usage info */}
                  {(gen.result as any)?.usage && (
                    <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="font-semibold text-sm mb-2">使用说明</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
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

            {/* Empty state when no step selected and not completed */}
            {!expandedStep && gen.status !== "completed" && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">点击左侧步骤查看详细输出</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
