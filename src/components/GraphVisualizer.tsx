import { useRef, useEffect, useState, useCallback } from "react";
import { Maximize, Minimize } from "lucide-react";
import { type Graph, type GraphNode } from "@/lib/graph";

interface GraphVisualizerProps {
  graph: Graph;
  edges: { from: string; to: string; weight: number }[];
  pathNodes?: string[];
  fullscreenControls?: React.ReactNode;
}

const GraphVisualizer = ({ graph, edges, pathNodes = [], fullscreenControls }: GraphVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const nodeMap = new Map<string, GraphNode>();
  for (const n of graph.nodes) nodeMap.set(n.id, n);

  const pathEdgeSet = new Set<string>();
  for (let i = 0; i < pathNodes.length - 1; i++) {
    pathEdgeSet.add(`${pathNodes[i]}->${pathNodes[i + 1]}`);
  }
  const pathNodeSet = new Set(pathNodes);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 820;
    const h = 700;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    // Draw edges
    for (const edge of edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;

      const isOnPath = pathEdgeSet.has(`${edge.from}->${edge.to}`);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = isOnPath ? "hsl(200, 85%, 55%)" : "hsl(220, 15%, 22%)";
      ctx.lineWidth = isOnPath ? 3 : 1;
      ctx.stroke();

      // Arrow
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const len = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
      const arrowDist = 22;
      const ax = to.x - Math.cos(angle) * arrowDist;
      const ay = to.y - Math.sin(angle) * arrowDist;
      const arrowSize = 6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(
        ax - arrowSize * Math.cos(angle - Math.PI / 6),
        ay - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ax - arrowSize * Math.cos(angle + Math.PI / 6),
        ay - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = isOnPath ? "hsl(200, 85%, 55%)" : "hsl(220, 15%, 30%)";
      ctx.fill();

      // Weight label
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      ctx.font = "10px 'JetBrains Mono'";
      ctx.fillStyle = isOnPath ? "hsl(200, 85%, 65%)" : "hsl(220, 15%, 40%)";
      ctx.textAlign = "center";
      ctx.fillText(String(edge.weight), mx + 8, my - 4);
    }

    // Draw nodes
    for (const node of graph.nodes) {
      const isOnPath = pathNodeSet.has(node.id);
      const isEndpoint =
        pathNodes.length > 0 &&
        (node.id === pathNodes[0] || node.id === pathNodes[pathNodes.length - 1]);

      ctx.beginPath();
      ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);

      if (isEndpoint) {
        ctx.fillStyle = "hsl(160, 80%, 45%)";
        ctx.shadowColor = "hsl(160, 80%, 45%)";
        ctx.shadowBlur = 15;
      } else if (isOnPath) {
        ctx.fillStyle = "hsl(200, 85%, 55%)";
        ctx.shadowColor = "hsl(200, 85%, 55%)";
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = "hsl(220, 18%, 12%)";
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
      ctx.strokeStyle = isOnPath
        ? isEndpoint
          ? "hsl(160, 80%, 55%)"
          : "hsl(200, 85%, 65%)"
        : "hsl(160, 80%, 35%)";
      ctx.lineWidth = isOnPath ? 2 : 1;
      ctx.stroke();

      // Label
      ctx.font = "bold 11px 'JetBrains Mono'";
      ctx.fillStyle = isEndpoint
        ? "hsl(220, 20%, 7%)"
        : isOnPath
          ? "hsl(220, 20%, 7%)"
          : "hsl(160, 80%, 45%)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.id, node.x, node.y);

      // Name below
      ctx.font = "9px 'Space Grotesk'";
      ctx.fillStyle = "hsl(215, 15%, 50%)";
      ctx.fillText(node.label, node.x, node.y + 28);
    }
  }, [graph, edges, pathNodes]);

  return (
    <div ref={containerRef} className="relative overflow-auto rounded-lg border border-border bg-card/50 p-2">
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-10 rounded-md border border-border bg-secondary/80 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
      {isFullscreen && fullscreenControls && (
        <div className="absolute top-3 left-3 z-10">
          {fullscreenControls}
        </div>
      )}
      <canvas ref={canvasRef} className="mx-auto block" />
    </div>
  );
};

export default GraphVisualizer;
