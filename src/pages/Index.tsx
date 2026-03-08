import { useState } from "react";
import { cityGraph, cityNodes, cityEdges } from "@/data/cityMap";
import { runAlgorithm, kShortestPaths, type AlgorithmResult, type PathResult } from "@/lib/graph";
import GraphVisualizer from "@/components/GraphVisualizer";
import { Button } from "@/components/ui/button";
import { MapPin, Route, Zap, Clock, BookOpen, BarChart3 } from "lucide-react";

type Algorithm = "dijkstra" | "bellman-ford";

const Index = () => {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("dijkstra");
  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [comparison, setComparison] = useState<{ dijkstra: AlgorithmResult; bellmanFord: AlgorithmResult } | null>(null);
  const [altRoutes, setAltRoutes] = useState<PathResult[]>([]);
  const [activeAltIndex, setActiveAltIndex] = useState(0);
  const [error, setError] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);

  const nodeIds = cityNodes.map((n) => n.id).sort();

  const handleFindPath = () => {
    setError("");
    setComparison(null);
    setAltRoutes([]);
    if (!source || !target) {
      setError("Please select both source and destination.");
      return;
    }
    const res = runAlgorithm(cityGraph, source, target, algorithm);
    setResult(res);
    if (!res.result.found) {
      setError(`No path exists from ${source} to ${target}.`);
    }
  };

  const handleCompare = () => {
    setError("");
    setAltRoutes([]);
    if (!source || !target) {
      setError("Please select both source and destination.");
      return;
    }
    const d = runAlgorithm(cityGraph, source, target, "dijkstra");
    const bf = runAlgorithm(cityGraph, source, target, "bellman-ford");
    setComparison({ dijkstra: d, bellmanFord: bf });
    setResult(d);
  };

  const handleAltRoutes = () => {
    setError("");
    setComparison(null);
    if (!source || !target) {
      setError("Please select both source and destination.");
      return;
    }
    const paths = kShortestPaths(cityGraph, source, target, 3);
    if (paths.length === 0) {
      setError("No paths found.");
      return;
    }
    setAltRoutes(paths);
    setActiveAltIndex(0);
    setResult({ result: paths[0], executionTimeMs: 0, algorithm: "K-Shortest" });
  };

  const labelFor = (id: string) => cityNodes.find((n) => n.id === id)?.label ?? id;

  const displayPath =
    altRoutes.length > 0
      ? altRoutes[activeAltIndex]?.path ?? []
      : result?.result.path ?? [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[var(--font-display)]">
          <span className="text-primary text-glow">Yerevan Route Planner</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground font-mono">
          Graph-based shortest path engine • Yerevan, Armenia • Dijkstra & Bellman-Ford
        </p>
      </header>

      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Control Panel */}
        <div className="space-y-4">
          {/* Source / Target */}
          <div className="panel-glass rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Route Query
            </h2>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-mono">Start Point</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select…</option>
                {nodeIds.map((id) => (
                  <option key={id} value={id}>
                    {id} — {labelFor(id)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-mono">Destination</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select…</option>
                {nodeIds.map((id) => (
                  <option key={id} value={id}>
                    {id} — {labelFor(id)}
                  </option>
                ))}
              </select>
            </div>

            {/* Algorithm selector */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-mono">Algorithm</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAlgorithm("dijkstra")}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-mono transition-colors ${
                    algorithm === "dijkstra"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dijkstra
                </button>
                <button
                  onClick={() => setAlgorithm("bellman-ford")}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-mono transition-colors ${
                    algorithm === "bellman-ford"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bellman-Ford
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive font-mono">{error}</p>
            )}

            <Button onClick={handleFindPath} className="w-full gap-2">
              <Route className="h-4 w-4" /> Find Shortest Path
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCompare} className="flex-1 gap-1 text-xs">
                <BarChart3 className="h-3.5 w-3.5" /> Compare Both
              </Button>
              <Button variant="outline" size="sm" onClick={handleAltRoutes} className="flex-1 gap-1 text-xs">
                <Zap className="h-3.5 w-3.5" /> Top 3 Routes
              </Button>
            </div>
          </div>

          {/* Results */}
          {result && result.result.found && (
            <div className="panel-glass rounded-lg p-4 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Route className="h-3.5 w-3.5 text-accent" /> Result
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">Total Cost</span>
                <span className="text-2xl font-bold text-primary text-glow font-mono">
                  {result.result.cost}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">Algorithm</span>
                <span className="text-xs text-foreground font-mono">{result.algorithm}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Time
                </span>
                <span className="text-xs text-foreground font-mono">
                  {result.executionTimeMs.toFixed(3)} ms
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-mono">Path</span>
                <div className="flex flex-wrap gap-1">
                  {result.result.path.map((id, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-mono text-primary">
                        {id}
                      </span>
                      {i < result.result.path.length - 1 && (
                        <span className="text-muted-foreground text-xs">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comparison */}
          {comparison && (
            <div className="panel-glass rounded-lg p-4 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-warning" /> Performance Comparison
              </h2>
              {[comparison.dijkstra, comparison.bellmanFord].map((r, i) => (
                <div key={i} className="rounded-md border border-border bg-secondary/50 p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs font-mono text-foreground">{r.algorithm}</span>
                    <span className="text-xs font-mono text-primary">{r.executionTimeMs.toFixed(3)} ms</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (r.executionTimeMs /
                            Math.max(comparison.dijkstra.executionTimeMs, comparison.bellmanFord.executionTimeMs)) *
                            100
                        )}%`,
                        background: i === 0 ? "hsl(160, 80%, 45%)" : "hsl(200, 85%, 55%)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Cost: {r.result.found ? r.result.cost : "No path"} • Steps: {r.result.path.length}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Alt routes */}
          {altRoutes.length > 0 && (
            <div className="panel-glass rounded-lg p-4 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Top {altRoutes.length} Routes
              </h2>
              {altRoutes.map((route, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveAltIndex(i);
                    setResult({ result: route, executionTimeMs: 0, algorithm: "K-Shortest" });
                  }}
                  className={`w-full text-left rounded-md border p-2 text-xs font-mono transition-colors ${
                    i === activeAltIndex
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex justify-between">
                    <span>Route {i + 1}</span>
                    <span>Cost: {route.cost}</span>
                  </div>
                  <div className="mt-1 text-[10px]">{route.path.join(" → ")}</div>
                </button>
              ))}
            </div>
          )}

          {/* Complexity Analysis toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full gap-2 text-xs text-muted-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" /> {showAnalysis ? "Hide" : "Show"} Complexity Analysis
          </Button>
        </div>

        {/* Graph + Analysis */}
        <div className="space-y-4">
          <GraphVisualizer graph={cityGraph} edges={cityEdges} pathNodes={displayPath} />

          {showAnalysis && (
            <div className="panel-glass rounded-lg p-6 space-y-4 text-sm font-mono">
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Complexity Analysis
              </h2>

              <div className="space-y-3">
                <div>
                  <h3 className="text-primary font-semibold">Graph Representation: Adjacency List</h3>
                  <p className="text-muted-foreground text-xs mt-1">
                    <strong>Space:</strong> O(V + E) — stores each vertex once and each edge once.
                    <br />
                    More space-efficient than an adjacency matrix O(V²) for sparse graphs.
                  </p>
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="text-primary font-semibold">Dijkstra's Algorithm</h3>
                  <p className="text-muted-foreground text-xs mt-1">
                    <strong>Time:</strong> O((V + E) log V) with a binary heap priority queue.
                    <br />
                    Each vertex is extracted from the PQ once (V extractions × log V each). Each edge is relaxed once.
                    <br />
                    <strong>Space:</strong> O(V) for distance, predecessor arrays, and the priority queue.
                    <br />
                    <strong>Constraint:</strong> Only works with non-negative edge weights.
                  </p>
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="text-primary font-semibold">Bellman-Ford Algorithm</h3>
                  <p className="text-muted-foreground text-xs mt-1">
                    <strong>Time:</strong> O(V × E) — performs V-1 passes over all edges.
                    <br />
                    Slower than Dijkstra but handles negative edge weights and can detect negative cycles.
                    <br />
                    <strong>Space:</strong> O(V) for distance and predecessor arrays.
                    <br />
                    Early termination when no updates occur reduces average-case time.
                  </p>
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="text-primary font-semibold">K-Shortest Paths (Yen's Algorithm)</h3>
                  <p className="text-muted-foreground text-xs mt-1">
                    <strong>Time:</strong> O(K × V × ((V + E) log V)) — runs Dijkstra up to K×V times.
                    <br />
                    <strong>Space:</strong> O(K × V) for storing the K shortest paths.
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <h3 className="text-primary font-semibold">Dataset</h3>
                <p className="text-muted-foreground text-xs mt-1">
                  {cityNodes.length} nodes (locations) • {cityEdges.length} directed edges (roads)
                  <br />
                  Weighted directed graph modelling Yerevan's road network (travel time in minutes).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
