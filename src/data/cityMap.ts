import { type GraphNode, buildGraph } from "@/lib/graph";

// 25 real locations in Yerevan, Armenia — positioned for visualization
const nodes: GraphNode[] = [
  { id: "A", label: "Republic Sq", x: 400, y: 280 },
  { id: "B", label: "Opera House", x: 380, y: 180 },
  { id: "C", label: "Cascade", x: 320, y: 130 },
  { id: "D", label: "Northern Ave", x: 450, y: 230 },
  { id: "E", label: "Vernissage", x: 480, y: 310 },
  { id: "F", label: "Blue Mosque", x: 430, y: 380 },
  { id: "G", label: "Hrazdan Gorge", x: 200, y: 250 },
  { id: "H", label: "Victory Park", x: 260, y: 80 },
  { id: "I", label: "Matenadaran", x: 440, y: 130 },
  { id: "J", label: "GUM Market", x: 520, y: 260 },
  { id: "K", label: "Tsitsernakaberd", x: 140, y: 180 },
  { id: "L", label: "Dalma Garden", x: 620, y: 200 },
  { id: "M", label: "Yerevan Mall", x: 680, y: 320 },
  { id: "N", label: "Central Stn", x: 350, y: 400 },
  { id: "O", label: "Erebuni Museum", x: 550, y: 450 },
  { id: "P", label: "Hrazdan Stadium", x: 180, y: 340 },
  { id: "Q", label: "Zvart. Airport", x: 100, y: 60 },
  { id: "R", label: "Nor Nork", x: 650, y: 110 },
  { id: "S", label: "Avan", x: 560, y: 80 },
  { id: "T", label: "Malatia", x: 300, y: 480 },
  { id: "U", label: "Shengavit", x: 420, y: 480 },
  { id: "V", label: "Arabkir", x: 220, y: 150 },
  { id: "W", label: "Davtashen", x: 120, y: 100 },
  { id: "X", label: "Kanaker", x: 500, y: 50 },
  { id: "Y", label: "Nubarashen", x: 620, y: 430 },
];

// 50 directed edges — roads in Yerevan (weights = approximate travel time in minutes)
const edges = [
  // Central ring
  { from: "A", to: "B", weight: 3 },
  { from: "B", to: "A", weight: 3 },
  { from: "A", to: "D", weight: 2 },
  { from: "D", to: "A", weight: 2 },
  { from: "A", to: "E", weight: 2 },
  { from: "E", to: "A", weight: 3 },
  { from: "A", to: "F", weight: 4 },
  { from: "B", to: "C", weight: 3 },
  { from: "C", to: "B", weight: 3 },
  { from: "B", to: "I", weight: 4 },
  { from: "I", to: "B", weight: 4 },
  { from: "D", to: "J", weight: 3 },
  { from: "J", to: "D", weight: 3 },
  // Cascade / Victory Park area
  { from: "C", to: "H", weight: 5 },
  { from: "H", to: "C", weight: 4 },
  { from: "C", to: "V", weight: 3 },
  { from: "V", to: "C", weight: 3 },
  { from: "V", to: "G", weight: 4 },
  { from: "G", to: "V", weight: 4 },
  { from: "V", to: "K", weight: 5 },
  { from: "K", to: "V", weight: 5 },
  // Western districts
  { from: "K", to: "W", weight: 4 },
  { from: "W", to: "Q", weight: 8 },
  { from: "Q", to: "W", weight: 8 },
  { from: "G", to: "P", weight: 4 },
  { from: "P", to: "G", weight: 4 },
  { from: "P", to: "N", weight: 5 },
  { from: "N", to: "P", weight: 5 },
  { from: "N", to: "T", weight: 4 },
  { from: "N", to: "F", weight: 3 },
  { from: "F", to: "N", weight: 3 },
  // Eastern districts
  { from: "J", to: "L", weight: 5 },
  { from: "L", to: "M", weight: 4 },
  { from: "M", to: "J", weight: 5 },
  { from: "L", to: "R", weight: 5 },
  { from: "R", to: "S", weight: 4 },
  { from: "S", to: "X", weight: 3 },
  { from: "X", to: "I", weight: 5 },
  { from: "I", to: "S", weight: 5 },
  // Southern districts
  { from: "E", to: "F", weight: 3 },
  { from: "F", to: "U", weight: 4 },
  { from: "U", to: "T", weight: 4 },
  { from: "T", to: "P", weight: 6 },
  { from: "U", to: "O", weight: 3 },
  { from: "O", to: "Y", weight: 4 },
  { from: "Y", to: "M", weight: 5 },
  { from: "M", to: "O", weight: 6 },
  // Cross links
  { from: "E", to: "J", weight: 3 },
  { from: "H", to: "W", weight: 6 },
  { from: "Q", to: "K", weight: 6 },
];

export const cityGraph = buildGraph(nodes, edges);
export const cityNodes = nodes;
export const cityEdges = edges;
