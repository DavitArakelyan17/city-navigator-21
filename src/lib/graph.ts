// ============================================================
// City Graph Data Structures & Algorithms
// ============================================================

export interface Edge {
  to: string;
  weight: number;
}

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface Graph {
  nodes: GraphNode[];
  adjacencyList: Map<string, Edge[]>;
}

export interface PathResult {
  path: string[];
  cost: number;
  found: boolean;
}

export interface AlgorithmResult {
  result: PathResult;
  executionTimeMs: number;
  algorithm: string;
}

// ============================================================
// Graph Construction
// ============================================================

export function buildGraph(
  nodes: GraphNode[],
  edges: { from: string; to: string; weight: number }[]
): Graph {
  const adjacencyList = new Map<string, Edge[]>();
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of edges) {
    adjacencyList.get(edge.from)?.push({ to: edge.to, weight: edge.weight });
  }
  return { nodes, adjacencyList };
}

// ============================================================
// Dijkstra's Algorithm  —  O((V + E) log V)  with binary heap
// Space: O(V) for dist/prev arrays + O(V + E) for adjacency list
// ============================================================

export function dijkstra(graph: Graph, source: string, target: string): PathResult {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  // Binary min-heap for O(log V) insert/extract
  const heap: { node: string; cost: number }[] = [];

  const heapPush = (entry: { node: string; cost: number }) => {
    heap.push(entry);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent].cost <= heap[i].cost) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };

  const heapPop = (): { node: string; cost: number } => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      const n = heap.length;
      while (true) {
        let smallest = i;
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && heap[l].cost < heap[smallest].cost) smallest = l;
        if (r < n && heap[r].cost < heap[smallest].cost) smallest = r;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  };

  for (const node of graph.nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }

  if (!dist.has(source) || !dist.has(target)) {
    return { path: [], cost: Infinity, found: false };
  }

  if (source === target) {
    return { path: [source], cost: 0, found: true };
  }

  dist.set(source, 0);
  heapPush({ node: source, cost: 0 });

  while (heap.length > 0) {
    const current = heapPop();

    if (visited.has(current.node)) continue;
    visited.add(current.node);

    if (current.node === target) break;

    const neighbors = graph.adjacencyList.get(current.node);
    if (!neighbors) continue;
    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;
      const newDist = current.cost + edge.weight;
      if (newDist < dist.get(edge.to)!) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, current.node);
        heapPush({ node: edge.to, cost: newDist });
      }
    }
  }

  return reconstructPath(prev, source, target, dist.get(target)!);
}

// ============================================================
// Bellman-Ford Algorithm  —  O(V * E)
// Space: O(V) for dist/prev arrays
// ============================================================

export function bellmanFord(graph: Graph, source: string, target: string): PathResult {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();

  for (const node of graph.nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }

  if (!dist.has(source) || !dist.has(target)) {
    return { path: [], cost: Infinity, found: false };
  }

  if (source === target) {
    return { path: [source], cost: 0, found: true };
  }

  dist.set(source, 0);

  const V = graph.nodes.length;

  // Collect all edges
  const allEdges: { from: string; to: string; weight: number }[] = [];
  for (const [from, edges] of graph.adjacencyList.entries()) {
    for (const edge of edges) {
      allEdges.push({ from, to: edge.to, weight: edge.weight });
    }
  }

  // Relax V-1 times
  for (let i = 0; i < V - 1; i++) {
    let updated = false;
    for (const edge of allEdges) {
      const du = dist.get(edge.from)!;
      if (du === Infinity) continue;
      const newDist = du + edge.weight;
      if (newDist < dist.get(edge.to)!) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, edge.from);
        updated = true;
      }
    }
    if (!updated) break; // Early termination
  }

  return reconstructPath(prev, source, target, dist.get(target)!);
}

// ============================================================
// K-Shortest Paths (Yen's Algorithm)
// ============================================================

export function kShortestPaths(
  graph: Graph,
  source: string,
  target: string,
  k: number
): PathResult[] {
  const results: PathResult[] = [];
  const firstPath = dijkstra(graph, source, target);
  if (!firstPath.found) return [];
  results.push(firstPath);

  const candidates: PathResult[] = [];

  for (let ki = 1; ki < k; ki++) {
    const prevPath = results[ki - 1];

    for (let i = 0; i < prevPath.path.length - 1; i++) {
      const spurNode = prevPath.path[i];
      const rootPath = prevPath.path.slice(0, i + 1);

      // Build modified graph removing edges
      const removedEdges: { from: string; to: string; weight: number }[] = [];
      for (const p of results) {
        if (arraysEqual(p.path.slice(0, i + 1), rootPath)) {
          const from = p.path[i];
          const to = p.path[i + 1];
          const neighbors = graph.adjacencyList.get(from);
          if (neighbors) {
            const idx = neighbors.findIndex((e) => e.to === to);
            if (idx !== -1) {
              removedEdges.push({ from, to, weight: neighbors[idx].weight });
              neighbors.splice(idx, 1);
            }
          }
        }
      }

      const spurPath = dijkstra(graph, spurNode, target);

      // Restore edges
      for (const re of removedEdges) {
        graph.adjacencyList.get(re.from)?.push({ to: re.to, weight: re.weight });
      }

      if (spurPath.found) {
        const totalPath = [...rootPath.slice(0, -1), ...spurPath.path];
        const totalCost = computePathCost(graph, totalPath);
        if (totalCost < Infinity) {
          const candidate: PathResult = { path: totalPath, cost: totalCost, found: true };
          if (!candidates.some((c) => arraysEqual(c.path, totalPath))) {
            candidates.push(candidate);
          }
        }
      }
    }

    if (candidates.length === 0) break;
    candidates.sort((a, b) => a.cost - b.cost);
    results.push(candidates.shift()!);
  }

  return results;
}

function computePathCost(graph: Graph, path: string[]): number {
  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const neighbors = graph.adjacencyList.get(path[i]);
    const edge = neighbors?.find((e) => e.to === path[i + 1]);
    if (!edge) return Infinity;
    cost += edge.weight;
  }
  return cost;
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function reconstructPath(
  prev: Map<string, string | null>,
  source: string,
  target: string,
  cost: number
): PathResult {
  if (cost === Infinity) return { path: [], cost: Infinity, found: false };

  const path: string[] = [];
  let current: string | null = target;
  while (current !== null) {
    path.unshift(current);
    current = prev.get(current) ?? null;
    if (current === source) {
      path.unshift(source);
      break;
    }
  }

  if (path[0] !== source) return { path: [], cost: Infinity, found: false };
  return { path, cost, found: true };
}

// ============================================================
// Run algorithm with timing
// ============================================================

export function runAlgorithm(
  graph: Graph,
  source: string,
  target: string,
  algorithm: "dijkstra" | "bellman-ford"
): AlgorithmResult {
  const start = performance.now();
  const result =
    algorithm === "dijkstra"
      ? dijkstra(graph, source, target)
      : bellmanFord(graph, source, target);
  const end = performance.now();

  return {
    result,
    executionTimeMs: end - start,
    algorithm: algorithm === "dijkstra" ? "Dijkstra" : "Bellman-Ford",
  };
}
