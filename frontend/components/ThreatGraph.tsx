"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  Node,
  Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

type ThreatGraphData = {
  nodes?: any[];
  edges?: any[];
};

export default function ThreatGraph({
  graph,
}: {
  graph: ThreatGraphData;
}) {

  const rawNodes = graph?.nodes || [];
  const rawEdges = graph?.edges || [];

  /*
   * Convert backend graph nodes into React Flow nodes.
   */

  const nodes: Node[] = rawNodes.map(
    (node, index) => {

      const type = node.type || "unknown";

      let background = "#0f172a";
      let border = "#475569";

      if (type === "email") {
        background = "#172554";
        border = "#3b82f6";
      }

      if (type === "domain") {
        background = "#3f1d3f";
        border = "#a855f7";
      }

      if (type === "url") {
        background = "#422006";
        border = "#f59e0b";
      }

      if (type === "ip") {
        background = "#052e2b";
        border = "#14b8a6";
      }

      return {
        id: node.id || `node-${index}`,

        position: {
          x: (index % 3) * 300,
          y: Math.floor(index / 3) * 180,
        },

        data: {
          label: (
            <div className="min-w-[170px]">

              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                {type}
              </div>

              <div className="mt-1 break-all text-sm font-semibold text-white">
                {node.label || "Unknown"}
              </div>

            </div>
          ),
        },

        style: {
          background,
          border: `1px solid ${border}`,
          borderRadius: "12px",
          padding: "12px",
          color: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        },
      };
    }
  );


  /*
   * Convert backend edges into React Flow edges.
   */

  const edges: Edge[] = rawEdges.map(
    (edge, index) => {

      return {
        id: `edge-${index}`,

        source: edge.source,

        target: edge.target,

        label: edge.relationship
          ? edge.relationship.replaceAll("-", " ")
          : "",

        animated: true,

        style: {
          stroke: "#64748b",
        },

        labelStyle: {
          fill: "#94a3b8",
          fontSize: 10,
        },

        labelBgStyle: {
          fill: "#020617",
        },

      };
    }
  );


  return (

    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">

      <div className="h-[650px]">

        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          attributionPosition="bottom-left"
        >

          <Background />

          <Controls />

          <MiniMap />

        </ReactFlow>

      </div>

    </div>

  );
}