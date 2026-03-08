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
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // In fullscreen, use the full screen size; otherwise fixed size
    const isFs = !!document.fullscreenElement;
    const baseW = isFs ? container.clientWidth : 820;
    const baseH = isFs ? container.clientHeight : 700;

    canvas.width = baseW * dpr;
    canvas.height = baseH * dpr;
    canvas.style.width = `${baseW}px`;
    canvas.style.height = `${baseH}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, baseW, baseH);

    // Scale factor to map original coords (820x700) to current size
    const sx = baseW / 820;
    const sy = baseH / 700;

    const scaleX = (x: number) => x * sx;
    const scaleY = (y: number) => y * sy;

    // Draw edges
    for (const edge of edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;

      const fx = scaleX(from.x), fy = scaleY(from.y);
      const tx = scaleX(to.x), ty = scaleY(to.y);
      const isOnPath = pathEdgeSet.has(`${edge.from}->${edge.to}`);

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = isOnPath ? "hsl(200, 85%, 55%)" : "hsl(220, 15%, 22%)";
      ctx.lineWidth = isOnPath ? 3 : 1;
      ctx.stroke();

      // Arrow
      const angle = Math.atan2(ty - fy, tx - fx);
      const arrowDist = 22 * Math.min(sx, sy);
      const ax = tx - Math.cos(angle) * arrowDist;
      const ay = ty - Math.sin(angle) * arrowDist;
      const arrowSize = 6 * Math.min(sx, sy);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - arrowSize * Math.cos(angle - Math.PI / 6), ay - arrowSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(ax - arrowSize * Math.cos(angle + Math.PI / 6), ay - arrowSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = isOnPath ? "hsl(200, 85%, 55%)" : "hsl(220, 15%, 30%)";
      ctx.fill();

      // Weight label
      const mx = (fx + tx) / 2;
      const my = (fy + ty) / 2;
      const fontSize = Math.max(9, 10 * Math.min(sx, sy));
      ctx.font = `${fontSize}px 'JetBrains Mono'`;
      ctx.fillStyle = isOnPath ? "hsl(200, 85%, 65%)" : "hsl(220, 15%, 40%)";
      ctx.textAlign = "center";
      ctx.fillText(String(edge.weight), mx + 8 * sx, my - 4 * sy);
    }

    // Draw nodes
    const nodeRadius = Math.max(14, 18 * Math.min(sx, sy));
    for (const node of graph.nodes) {
      const nx = scaleX(node.x), ny = scaleY(node.y);
      const isOnPath = pathNodeSet.has(node.id);
      const isEndpoint =
        pathNodes.length > 0 &&
        (node.id === pathNodes[0] || node.id === pathNodes[pathNodes.length - 1]);

      ctx.beginPath();
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);

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
      ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isOnPath
        ? isEndpoint ? "hsl(160, 80%, 55%)" : "hsl(200, 85%, 65%)"
        : "hsl(160, 80%, 35%)";
      ctx.lineWidth = isOnPath ? 2 : 1;
      ctx.stroke();

      // Label
      const labelSize = Math.max(9, 11 * Math.min(sx, sy));
      ctx.font = `bold ${labelSize}px 'JetBrains Mono'`;
      ctx.fillStyle = isEndpoint || isOnPath ? "hsl(220, 20%, 7%)" : "hsl(160, 80%, 45%)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.id, nx, ny);

      // Name below
      const nameSize = Math.max(7, 9 * Math.min(sx, sy));
      ctx.font = `${nameSize}px 'Space Grotesk'`;
      ctx.fillStyle = "hsl(215, 15%, 50%)";
      ctx.fillText(node.label, nx, ny + nodeRadius + 10);
    }
  }, [graph, edges, pathNodes, isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg border border-border bg-card/50 ${
        isFullscreen ? "flex items-center justify-center bg-background" : "p-2"
      }`}
    >
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-20 rounded-md border border-border bg-secondary/80 p-1.5 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
      {isFullscreen && fullscreenControls && (
        <div className="absolute top-3 left-3 z-20 max-h-[calc(100vh-24px)] overflow-y-auto">
          {fullscreenControls}
        </div>
      )}
      <canvas ref={canvasRef} className={isFullscreen ? "block" : "mx-auto block"} />
    </div>
  );
};

export default GraphVisualizer;
