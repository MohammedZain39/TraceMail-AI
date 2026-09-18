"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

export interface MapNode {
  ip: string;
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  hosting?: boolean;
  vpn?: boolean;
  tor?: boolean;
  risk?: string;
  role?: string;
}

interface ThreatMapProps {
  nodes: MapNode[];
}

function FitBounds({ nodes }: { nodes: MapNode[] }) {
  const map = useMap();

  useEffect(() => {
    if (!nodes.length) return;

    if (nodes.length === 1) {
      map.setView(
        [nodes[0].latitude, nodes[0].longitude],
        5
      );
      return;
    }

    const bounds = nodes.map(
      (node) =>
        [node.latitude, node.longitude] as [
          number,
          number
        ]
    );

    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 6,
    });
  }, [nodes, map]);

  return null;
}

function getRiskColor(risk?: string) {
  switch ((risk || "").toLowerCase()) {
    case "critical":
      return "#ff1744";

    case "high":
      return "#ff5252";

    case "medium":
      return "#ffab00";

    case "low":
      return "#00e676";

    default:
      return "#00b8ff";
  }
}

export default function ThreatMap({
  nodes,
}: ThreatMapProps) {
  const validNodes = nodes.filter(
    (node) =>
      Number.isFinite(node.latitude) &&
      Number.isFinite(node.longitude)
  );

  const relayCoordinates = validNodes.map(
    (node) =>
      [node.latitude, node.longitude] as [
        number,
        number
      ]
  );

  return (
    <div
      style={{
        width: "100%",
        height: "620px",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
          background: "#07111f",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds nodes={validNodes} />

        {relayCoordinates.length > 1 && (
          <Polyline
            positions={relayCoordinates}
            pathOptions={{
              color: "#00b8ff",
              weight: 3,
              opacity: 0.8,
              dashArray: "8 8",
            }}
          />
        )}

        {validNodes.map((node, index) => {
          const color = getRiskColor(node.risk);

          return (
            <CircleMarker
              key={`${node.ip}-${index}`}
              center={[
                node.latitude,
                node.longitude,
              ]}
              radius={10}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 3,
              }}
            >
              <Tooltip direction="top">
                <strong>{node.ip}</strong>
              </Tooltip>

              <Popup>
                <div
                  style={{
                    minWidth: "220px",
                    fontFamily:
                      "Arial, sans-serif",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "16px",
                    }}
                  >
                    {node.ip}
                  </strong>

                  <hr />

                  <div>
                    <b>Role:</b>{" "}
                    {node.role || "Observed Node"}
                  </div>

                  <div>
                    <b>Location:</b>{" "}
                    {[
                      node.city,
                      node.region,
                      node.country,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                      "Unknown"}
                  </div>

                  <div>
                    <b>ISP:</b>{" "}
                    {node.isp ||
                      node.organization ||
                      "Unknown"}
                  </div>

                  {node.asn && (
                    <div>
                      <b>ASN:</b> {node.asn}
                    </div>
                  )}

                  <div>
                    <b>Risk:</b>{" "}
                    {node.risk || "Unknown"}
                  </div>

                  <div>
                    <b>Hosting:</b>{" "}
                    {node.hosting ? "Yes" : "No"}
                  </div>

                  <div>
                    <b>VPN:</b>{" "}
                    {node.vpn ? "Detected" : "No"}
                  </div>

                  <div>
                    <b>TOR:</b>{" "}
                    {node.tor ? "Detected" : "No"}
                  </div>

                  <hr />

                  <small>
                    This represents observed
                    infrastructure geolocation,
                    not confirmed attacker location.
                  </small>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}