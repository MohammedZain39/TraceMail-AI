"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type NodeType =
  | "email"
  | "domain"
  | "ip"
  | "url"
  | "geo"
  | "unknown";

type GraphNode = {
  id: string;
  label: string;
  type: NodeType;
  detail?: string;
};

type GraphEdge = {
  source: string;
  target: string;
  relation?: string;
};

type CaseItem = {
  case_id?: string;
  filename?: string;
  created_at?: string;

  email?: {
    sender?: string;
    recipient?: string;
    subject?: string;
  };

  threat_analysis?: {
    risk_score?: number;
    severity?: string;
    classification?: string;
  };

  threat_graph?: {
    nodes?: Array<Record<string, unknown>>;
    edges?: Array<Record<string, unknown> | unknown[]>;
    node_count?: number;
    edge_count?: number;
  };
};

type PositionedNode = GraphNode & {
  x: number;
  y: number;
};

const NODE_STYLES: Record<NodeType, string> = {
  email:
    "border-red-500/70 bg-red-500/10 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.10)]",

  domain:
    "border-purple-500/70 bg-purple-500/10 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.10)]",

  ip:
    "border-orange-500/70 bg-orange-500/10 text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.10)]",

  url:
    "border-yellow-500/70 bg-yellow-500/10 text-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.10)]",

  geo:
    "border-cyan-500/70 bg-cyan-500/10 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.10)]",

  unknown:
    "border-gray-600 bg-gray-800/20 text-gray-400",
};

const NODE_ICONS: Record<NodeType, string> = {
  email: "✉",
  domain: "◈",
  ip: "◉",
  url: "↗",
  geo: "⌖",
  unknown: "◇",
};

function normalizeNodeType(value: unknown): NodeType {
  const type = String(value ?? "").toLowerCase();

  if (type.includes("email")) return "email";
  if (type.includes("domain")) return "domain";
  if (type === "ip" || type.includes("ip")) return "ip";
  if (type.includes("url")) return "url";
  if (type.includes("geo")) return "geo";

  return "unknown";
}

function normalizeNodes(
  rawNodes: Array<Record<string, unknown>> | undefined,
  selectedCase: CaseItem | null
): GraphNode[] {
  const nodes: GraphNode[] = [];

  for (const raw of rawNodes ?? []) {
    const id = String(
      raw.id ??
        raw.node_id ??
        raw.key ??
        raw.label ??
        `node-${nodes.length}`
    );

    const label = String(
      raw.label ??
        raw.name ??
        raw.value ??
        raw.entity ??
        id
    );

    const type = normalizeNodeType(
      raw.type ??
        raw.node_type ??
        raw.entity_type ??
        raw.category
    );

    const detail =
      raw.detail != null
        ? String(raw.detail)
        : raw.description != null
        ? String(raw.description)
        : undefined;

    nodes.push({
      id,
      label,
      type,
      detail,
    });
  }

  /*
   * If the backend graph is empty, create only the
   * investigation email node from the real case.
   *
   * No fake infrastructure is generated here.
   */
  if (nodes.length === 0 && selectedCase) {
    const subject =
      selectedCase.email?.subject ||
      selectedCase.filename ||
      "Analyzed Email";

    nodes.push({
      id: "case-email",
      label: subject,
      type: "email",
      detail: selectedCase.case_id,
    });
  }

  return nodes;
}

function normalizeEdges(
  rawEdges:
    | Array<Record<string, unknown> | unknown[]>
    | undefined
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const raw of rawEdges ?? []) {
    if (Array.isArray(raw)) {
      if (raw.length >= 2) {
        edges.push({
          source: String(raw[0]),
          target: String(raw[1]),
          relation:
            raw.length >= 3
              ? String(raw[2])
              : undefined,
        });
      }

      continue;
    }

    const source =
      raw.source ??
      raw.from ??
      raw.source_id ??
      raw.from_id;

    const target =
      raw.target ??
      raw.to ??
      raw.target_id ??
      raw.to_id;

    if (source == null || target == null) {
      continue;
    }

    edges.push({
      source: String(source),
      target: String(target),
      relation:
        raw.relation != null
          ? String(raw.relation)
          : raw.label != null
          ? String(raw.label)
          : raw.type != null
          ? String(raw.type)
          : undefined,
    });
  }

  return edges;
}

function createPositions(
  nodes: GraphNode[]
): PositionedNode[] {
  if (nodes.length === 0) {
    return [];
  }

  /*
   * The graph is deliberately laid out in a stable
   * forensic-flow pattern rather than randomly.
   *
   * Email → Domain / URL / IP → Geo
   */

  const emailNodes = nodes.filter(
    (node) => node.type === "email"
  );

  const domainNodes = nodes.filter(
    (node) => node.type === "domain"
  );

  const urlNodes = nodes.filter(
    (node) => node.type === "url"
  );

  const ipNodes = nodes.filter(
    (node) => node.type === "ip"
  );

  const geoNodes = nodes.filter(
    (node) => node.type === "geo"
  );

  const unknownNodes = nodes.filter(
    (node) => node.type === "unknown"
  );

  const positioned: PositionedNode[] = [];

  const placeColumn = (
    column: GraphNode[],
    x: number
  ) => {
    if (column.length === 0) return;

    const usableTop = 20;
    const usableBottom = 80;

    const step =
      column.length === 1
        ? 0
        : (usableBottom - usableTop) /
          (column.length - 1);

    column.forEach((node, index) => {
      positioned.push({
        ...node,
        x,
        y:
          column.length === 1
            ? 50
            : usableTop + step * index,
      });
    });
  };

  placeColumn(emailNodes, 16);
  placeColumn(domainNodes, 42);
  placeColumn(urlNodes, 42);
  placeColumn(ipNodes, 68);
  placeColumn(geoNodes, 88);
  placeColumn(unknownNodes, 58);

  /*
   * Avoid collisions between different node types
   * occupying the same column.
   */
  const seen = new Map<string, number>();

  return positioned.map((node) => {
    const key = `${node.x}-${node.y}`;
    const count = seen.get(key) ?? 0;

    seen.set(key, count + 1);

    return {
      ...node,
      y: Math.min(
        88,
        Math.max(12, node.y + count * 8)
      ),
    };
  });
}

export default function ThreatGraphPage() {
  const router = useRouter();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] =
    useState("");

  const [selectedCase, setSelectedCase] =
    useState<CaseItem | null>(null);

  const [loadingCases, setLoadingCases] =
    useState(true);

  const [loadingGraph, setLoadingGraph] =
    useState(false);

  const [error, setError] = useState("");

  const [selectedNodeId, setSelectedNodeId] =
    useState<string | null>(null);

  const [zoom, setZoom] = useState(1);

  /*
   * =====================================================
   * LOAD CASE LIST
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadCases = async () => {
      try {
        setLoadingCases(true);
        setError("");

        const response = await apiFetch(
          "/cases",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load investigations (${response.status})`
          );
        }

        const data = await response.json();

        const loadedCases: CaseItem[] =
          Array.isArray(data?.cases)
            ? data.cases
            : [];

        if (cancelled) return;

        setCases(loadedCases);

        /*
         * Preserve the last investigation selected
         * elsewhere in the application.
         */
        let preferredCaseId = "";

        try {
          preferredCaseId =
            sessionStorage.getItem(
              "tracemail_case_id"
            ) || "";
        } catch {
          preferredCaseId = "";
        }

        const preferredExists =
          preferredCaseId &&
          loadedCases.some(
            (item) =>
              item.case_id === preferredCaseId
          );

        const firstCaseId =
          loadedCases[0]?.case_id || "";

        const nextCaseId =
          preferredExists
            ? preferredCaseId
            : firstCaseId;

        setSelectedCaseId(nextCaseId);
      } catch (err) {
        console.error(
          "Failed to load threat graph cases:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load investigations."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCases(false);
        }
      }
    };

    loadCases();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =====================================================
   * LOAD SELECTED CASE
   * =====================================================
   */

  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedCase(null);
      return;
    }

    let cancelled = false;

    const loadCase = async () => {
      try {
        setLoadingGraph(true);
        setError("");
        setSelectedNodeId(null);

        const response = await apiFetch(
          `/cases/${encodeURIComponent(
            selectedCaseId
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load investigation (${response.status})`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setSelectedCase(
            data?.case || null
          );

          try {
            sessionStorage.setItem(
              "tracemail_case_id",
              selectedCaseId
            );
          } catch {
            // Ignore sessionStorage failures.
          }
        }
      } catch (err) {
        console.error(
          "Failed to load threat graph:",
          err
        );

        if (!cancelled) {
          setSelectedCase(null);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load threat graph."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingGraph(false);
        }
      }
    };

    loadCase();

    return () => {
      cancelled = true;
    };
  }, [selectedCaseId]);

  /*
   * =====================================================
   * GRAPH DATA
   * =====================================================
   */

  const graphNodes = useMemo(() => {
    return normalizeNodes(
      selectedCase?.threat_graph?.nodes,
      selectedCase
    );
  }, [selectedCase]);

  const graphEdges = useMemo(() => {
    return normalizeEdges(
      selectedCase?.threat_graph?.edges
    );
  }, [selectedCase]);

  const positionedNodes = useMemo(() => {
    return createPositions(graphNodes);
  }, [graphNodes]);

  const selectedNode = useMemo(() => {
    return positionedNodes.find(
      (node) =>
        node.id === selectedNodeId
    );
  }, [
    positionedNodes,
    selectedNodeId,
  ]);

  const nodeMap = useMemo(() => {
    const map = new Map<
      string,
      PositionedNode
    >();

    positionedNodes.forEach((node) => {
      map.set(node.id, node);
    });

    return map;
  }, [positionedNodes]);

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

  const subject =
    selectedCase?.email?.subject ||
    selectedCase?.filename ||
    "Analyzed Email";

  const sender =
    selectedCase?.email?.sender ||
    "Unknown sender";

  const risk =
    Number(
      selectedCase?.threat_analysis
        ?.risk_score ?? 0
    );

  const severity =
    selectedCase?.threat_analysis
      ?.severity || "UNKNOWN";

  const classification =
    selectedCase?.threat_analysis
      ?.classification ||
    "Unclassified";

  const nodeCount =
    selectedCase?.threat_graph
      ?.node_count ??
    graphNodes.length;

  const edgeCount =
    selectedCase?.threat_graph
      ?.edge_count ??
    graphEdges.length;

  const goToInvestigation = () => {
    if (!selectedCaseId) return;

    router.push(
      `/investigations/${encodeURIComponent(
        selectedCaseId
      )}`
    );
  };

  const exportGraph = () => {
    /*
     * Lightweight export for the prototype.
     * Produces a JSON artifact containing the
     * actual graph returned by the backend.
     */
    const payload = {
      case_id: selectedCaseId,
      subject,
      sender,
      risk_score: risk,
      severity,
      classification,
      nodes: graphNodes,
      relationships: graphEdges,
      exported_at:
        new Date().toISOString(),
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = `${selectedCaseId || "tracemail"}-threat-graph.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <main className="min-h-full w-full bg-[#071019] text-white">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        {/* =================================================
            PAGE HEADER
           ================================================= */}

        <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-6 w-1.5 rounded-full bg-cyan-400" />

              <p className="text-[11px] font-medium tracking-[0.28em] text-cyan-400">
                INFRASTRUCTURE CORRELATION
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Threat Graph
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Visualize relationships between email
              artifacts and observed infrastructure.
            </p>
          </div>

          {/* CASE SELECTOR */}

          <div className="w-full xl:w-[480px]">
            <label
              htmlFor="threat-graph-case"
              className="mb-2 block text-[11px] tracking-[0.22em] text-gray-600"
            >
              SELECT INVESTIGATION CASE
            </label>

            <select
              id="threat-graph-case"
              value={selectedCaseId}
              onChange={(event) =>
                setSelectedCaseId(
                  event.target.value
                )
              }
              disabled={
                loadingCases ||
                cases.length === 0
              }
              className="w-full appearance-none rounded-xl border border-gray-800 bg-[#0b1621] px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cases.length === 0 ? (
                <option value="">
                  No investigation cases available
                </option>
              ) : (
                <>
                  <option value="">
                    Select an investigation
                  </option>

                  {cases.map((item) => (
                    <option
                      key={item.case_id}
                      value={item.case_id || ""}
                    >
                      {item.case_id} ·{" "}
                      {item.email?.subject ||
                        item.filename ||
                        "Analyzed Email"}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loadingGraph && (
          <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-400">
            Loading investigation graph...
          </div>
        )}

        {/* =================================================
            EMPTY STATE
           ================================================= */}

        {!selectedCase && !loadingGraph && (
          <div className="flex min-h-[600px] items-center justify-center rounded-2xl border border-gray-800 bg-[#0b1621]">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/5 text-2xl text-cyan-400">
                ◇
              </div>

              <p className="text-sm font-semibold tracking-wide text-cyan-400">
                SELECT AN INVESTIGATION
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Choose a case above to visualize its
                extracted infrastructure relationships.
              </p>
            </div>
          </div>
        )}

        {selectedCase && (
          <>
            {/* =================================================
                SUMMARY CARDS
               ================================================= */}

            <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <InfoCard
                label="CASE"
                value={
                  selectedCase.case_id ||
                  selectedCaseId
                }
              />

              <InfoCard
                label="NODES"
                value={String(nodeCount)}
              />

              <InfoCard
                label="RELATIONSHIPS"
                value={String(edgeCount)}
              />

              <InfoCard
                label="RISK"
                value={`${risk} / 100`}
                danger={risk >= 60}
              />
            </div>

            {/* =================================================
                ANALYZED ARTIFACT
               ================================================= */}

            <section className="mb-6 rounded-2xl border border-gray-800 bg-[#0b1621]">
              <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="mb-2 text-[10px] tracking-[0.2em] text-gray-600">
                    ANALYZED ARTIFACT
                  </p>

                  <p className="truncate text-base font-medium text-gray-200">
                    {subject}
                  </p>

                  <p className="mt-1 truncate text-sm text-gray-600">
                    {sender}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-[10px] tracking-widest text-gray-600">
                      CLASSIFICATION
                    </p>

                    <p className="mt-1 max-w-[320px] text-sm text-gray-300">
                      {classification}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] tracking-widest text-gray-600">
                      SEVERITY
                    </p>

                    <p
                      className={`mt-1 text-sm font-semibold ${
                        severity === "CRITICAL" ||
                        severity === "HIGH"
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      {severity}
                    </p>
                  </div>

                  <button
                    onClick={goToInvestigation}
                    className="rounded-lg border border-gray-700 px-4 py-2 text-xs text-gray-400 transition hover:border-cyan-500/40 hover:text-cyan-400"
                  >
                    OPEN CASE →
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================
                GRAPH + INSPECTOR
               ================================================= */}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
              {/* GRAPH */}

              <section className="overflow-hidden rounded-2xl border border-gray-800 bg-[#0b1621]">
                <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">
                      Infrastructure Relationship Map
                    </h2>

                    <p className="mt-1 text-xs text-gray-600">
                      Relationships extracted from the
                      selected investigation.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Legend
                      color="bg-red-400"
                      label="EMAIL"
                    />

                    <Legend
                      color="bg-purple-400"
                      label="DOMAIN"
                    />

                    <Legend
                      color="bg-yellow-400"
                      label="URL"
                    />

                    <Legend
                      color="bg-orange-400"
                      label="IP"
                    />

                    <Legend
                      color="bg-cyan-400"
                      label="GEO"
                    />
                  </div>
                </div>

                <div className="relative h-[620px] overflow-hidden bg-[#071019]">
                  {/* GRID */}

                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)",
                      backgroundSize:
                        "40px 40px",
                    }}
                  />

                  {/* GRAPH CONTENT */}

                  <div
                    className="absolute inset-0 origin-center transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom})`,
                    }}
                  >
                    {/* EDGES */}

                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <marker
                          id="arrow"
                          viewBox="0 0 10 10"
                          refX="9"
                          refY="5"
                          markerWidth="5"
                          markerHeight="5"
                          orient="auto-start-reverse"
                        >
                          <path
                            d="M 0 0 L 10 5 L 0 10 z"
                            fill="#475569"
                          />
                        </marker>
                      </defs>

                      {graphEdges.map(
                        (
                          edge,
                          index
                        ) => {
                          const source =
                            nodeMap.get(
                              edge.source
                            );

                          const target =
                            nodeMap.get(
                              edge.target
                            );

                          if (
                            !source ||
                            !target
                          ) {
                            return null;
                          }

                          return (
                            <g
                              key={`${edge.source}-${edge.target}-${index}`}
                            >
                              <line
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke="#334155"
                                strokeWidth="0.28"
                                strokeDasharray="1.3 1"
                                markerEnd="url(#arrow)"
                              />
                            </g>
                          );
                        }
                      )}
                    </svg>

                    {/* NODES */}

                    {positionedNodes.map(
                      (node) => {
                        const isSelected =
                          selectedNodeId ===
                          node.id;

                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() =>
                              setSelectedNodeId(
                                node.id
                              )
                            }
                            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center outline-none"
                            style={{
                              left: `${node.x}%`,
                              top: `${node.y}%`,
                            }}
                          >
                            <div
                              className={`flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full border transition-all duration-200 ${NODE_STYLES[node.type]} ${
                                isSelected
                                  ? "scale-110 ring-2 ring-cyan-400/40 ring-offset-4 ring-offset-[#071019]"
                                  : "hover:scale-105"
                              }`}
                            >
                              <span className="mb-2 text-xl">
                                {
                                  NODE_ICONS[
                                    node.type
                                  ]
                                }
                              </span>

                              <span className="line-clamp-4 max-w-[90px] break-words px-2 text-[9px] font-semibold leading-3">
                                {node.label}
                              </span>
                            </div>

                            <div className="mt-3 max-w-[180px] whitespace-normal">
                              <p className="text-[9px] tracking-[0.16em] text-gray-600">
                                {node.detail ||
                                  node.type.toUpperCase()}
                              </p>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* GRAPH CONTROLS */}

                  <div className="absolute bottom-5 left-5 flex overflow-hidden rounded-lg border border-gray-800 bg-[#0b1621]">
                    <button
                      type="button"
                      onClick={() =>
                        setZoom(
                          Math.min(
                            1.35,
                            Number(
                              (
                                zoom +
                                0.1
                              ).toFixed(2)
                            )
                          )
                        )
                      }
                      className="h-10 w-10 border-r border-gray-800 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setZoom(
                          Math.max(
                            0.75,
                            Number(
                              (
                                zoom -
                                0.1
                              ).toFixed(2)
                            )
                          )
                        )
                      }
                      className="h-10 w-10 border-r border-gray-800 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                    >
                      −
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setZoom(1)
                      }
                      className="px-3 text-[10px] text-gray-500 transition hover:bg-gray-800 hover:text-white"
                    >
                      {Math.round(
                        zoom * 100
                      )}
                      %
                    </button>
                  </div>

                  {/* ENGINE */}

                  <div className="absolute bottom-5 right-5 rounded-lg border border-gray-800 bg-[#0b1621] px-4 py-2">
                    <span className="text-[9px] tracking-widest text-gray-600">
                      GRAPH ENGINE
                    </span>

                    <span className="ml-2 text-[9px] text-cyan-400">
                      ONLINE
                    </span>
                  </div>
                </div>
              </section>

              {/* NODE INSPECTOR */}

              <aside className="rounded-2xl border border-gray-800 bg-[#0b1621]">
                <div className="border-b border-gray-800 px-5 py-5">
                  <p className="text-[10px] tracking-[0.2em] text-cyan-400">
                    ENTITY INSPECTOR
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Selected graph entity
                  </p>
                </div>

                {selectedNode ? (
                  <div className="p-5">
                    <div
                      className={`mb-5 flex h-16 w-16 items-center justify-center rounded-xl border ${NODE_STYLES[selectedNode.type]}`}
                    >
                      <span className="text-2xl">
                        {
                          NODE_ICONS[
                            selectedNode.type
                          ]
                        }
                      </span>
                    </div>

                    <p className="mb-2 text-[9px] tracking-[0.2em] text-gray-600">
                      ENTITY TYPE
                    </p>

                    <p className="text-xs font-semibold uppercase text-gray-300">
                      {selectedNode.type}
                    </p>

                    <div className="mt-6">
                      <p className="mb-2 text-[9px] tracking-[0.2em] text-gray-600">
                        VALUE
                      </p>

                      <p className="break-all rounded-lg border border-gray-800 bg-[#071019] p-3 font-mono text-xs leading-5 text-cyan-400">
                        {selectedNode.label}
                      </p>
                    </div>

                    {selectedNode.detail && (
                      <div className="mt-5">
                        <p className="mb-2 text-[9px] tracking-[0.2em] text-gray-600">
                          CONTEXT
                        </p>

                        <p className="text-xs leading-5 text-gray-500">
                          {selectedNode.detail}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 border-t border-gray-800 pt-5">
                      <p className="mb-3 text-[9px] tracking-[0.2em] text-gray-600">
                        CONNECTED RELATIONSHIPS
                      </p>

                      <div className="space-y-2">
                        {graphEdges
                          .filter(
                            (edge) =>
                              edge.source ===
                                selectedNode.id ||
                              edge.target ===
                                selectedNode.id
                          )
                          .map(
                            (
                              edge,
                              index
                            ) => {
                              const connectedId =
                                edge.source ===
                                selectedNode.id
                                  ? edge.target
                                  : edge.source;

                              const connected =
                                nodeMap.get(
                                  connectedId
                                );

                              if (
                                !connected
                              ) {
                                return null;
                              }

                              return (
                                <div
                                  key={`${connectedId}-${index}`}
                                  className="rounded-lg border border-gray-800 bg-[#071019] p-3"
                                >
                                  <p className="text-xs text-gray-300">
                                    {
                                      connected.label
                                    }
                                  </p>

                                  {edge.relation && (
                                    <p className="mt-1 text-[9px] tracking-widest text-cyan-400">
                                      {edge.relation}
                                    </p>
                                  )}
                                </div>
                              );
                            }
                          )}

                        {graphEdges.filter(
                          (edge) =>
                            edge.source ===
                              selectedNode.id ||
                            edge.target ===
                              selectedNode.id
                        ).length === 0 && (
                          <p className="text-xs text-gray-600">
                            No connected relationships
                            available.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[520px] flex-col items-center justify-center px-8 text-center">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gray-800 text-gray-600">
                      ◇
                    </div>

                    <p className="text-sm text-gray-400">
                      Select a graph node
                    </p>

                    <p className="mt-2 text-xs leading-5 text-gray-600">
                      Inspect domains, URLs, IP
                      infrastructure and other extracted
                      entities.
                    </p>
                  </div>
                )}
              </aside>
            </div>

            {/* =================================================
                RELATIONSHIP TABLE
               ================================================= */}

            <section className="mt-6 rounded-2xl border border-gray-800 bg-[#0b1621]">
              <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-cyan-400">
                    OBSERVED RELATIONSHIPS
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Direct relationships extracted from
                    the investigation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={exportGraph}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-black transition hover:bg-cyan-400"
                >
                  EXPORT GRAPH
                </button>
              </div>

              {graphEdges.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {graphEdges.map(
                    (edge, index) => {
                      const source =
                        nodeMap.get(
                          edge.source
                        );

                      const target =
                        nodeMap.get(
                          edge.target
                        );

                      return (
                        <div
                          key={`${edge.source}-${edge.target}-${index}`}
                          className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-gray-300">
                              {source?.label ||
                                edge.source}
                            </p>

                            <p className="mt-1 truncate text-xs text-gray-600">
                              {target?.label ||
                                edge.target}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-gray-700">
                              →
                            </span>

                            <span className="rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 text-[9px] tracking-wider text-cyan-400">
                              {edge.relation ||
                                "RELATED"}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="px-6 py-10 text-center text-xs text-gray-600">
                  No infrastructure relationships were
                  returned for this investigation.
                </div>
              )}
            </section>

            {/* =================================================
                FINDINGS
               ================================================= */}

            <section className="mt-6 rounded-2xl border border-gray-800 bg-[#0b1621]">
              <div className="border-b border-gray-800 px-6 py-5">
                <p className="text-[10px] tracking-[0.2em] text-cyan-400">
                  GRAPH CONTEXT
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  How this graph should be interpreted.
                </p>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-3">
                <ContextCard
                  title="INFRASTRUCTURE"
                  text="Entities represent infrastructure and artifacts observed during email analysis."
                />

                <ContextCard
                  title="CORRELATION"
                  text="Edges represent relationships extracted from the analyzed email and its metadata."
                />

                <ContextCard
                  title="GEOLOCATION"
                  text="IP geolocation represents observed infrastructure context and does not establish the attacker's physical location."
                />
              </div>
            </section>

            {/* FOOTER DISCLAIMER */}

            <div className="mt-6 rounded-xl border border-gray-800 bg-[#09131d] px-5 py-4">
              <p className="text-xs leading-5 text-gray-600">
                Threat Graph relationships are derived from
                the selected investigation. Infrastructure
                geolocation should not be interpreted as the
                exact physical location or identity of an
                attacker.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/*
 * =========================================================
 * COMPONENTS
 * =========================================================
 */

function InfoCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#0b1621] p-5">
      <p className="text-[10px] tracking-[0.18em] text-gray-600">
        {label}
      </p>

      <p
        className={`mt-3 truncate text-xl font-semibold ${
          danger
            ? "text-red-400"
            : "text-white"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${color}`}
      />

      <span className="text-[9px] tracking-wider text-gray-600">
        {label}
      </span>
    </div>
  );
}

function ContextCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#071019] p-5">
      <p className="text-[10px] tracking-[0.18em] text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-xs leading-5 text-gray-600">
        {text}
      </p>
    </div>
  );
}