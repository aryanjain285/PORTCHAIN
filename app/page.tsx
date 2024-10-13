"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPortData } from "../lib/actions/load";

const Map = dynamic(() => import("../components/shared/Map"), { ssr: false });

interface Port {
  portid: string;
  ISO3: string;
  continent: string;
  lat: number;
  lon: number;
  vessel_count_total: number;
  vessel_count_container: number;
  vessel_count_dry_bulk: number;
  vessel_count_general_cargo: number;
  vessel_count_RoRo: number;
  import_tanker: number;
  import_cargo: number;
  import: number;
  export_container: number;
  export_dry_bulk: number;
  export_general_cargo: number;
  export_roro: number;
  export_tanker: number;
  export_cargo: number;
  export: number;
  resilience_cluster?: number;
}

const getColor = (resilienceIndex: number | undefined): string => {
  if (resilienceIndex === undefined) return "#808080"; // Gray for undefined
  if (resilienceIndex > 0.8) return "#008000"; // Green
  if (resilienceIndex > 0.6) return "#9ACD32"; // Yellow Green
  if (resilienceIndex > 0.4) return "#FFFF00"; // Yellow
  if (resilienceIndex > 0.2) return "#FFA500"; // Orange
  return "#FF0000"; // Red
};

const Dashboard: React.FC = () => {
  const [portsData, setPortsData] = useState<Port[]>([]);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadPortData();
        setPortsData(data);
      } catch (err) {
        console.error("Error loading port data:", err);
        setError("Failed to load port data. Please try again later.");
      }
    };
    fetchData();
  }, []);

  const handlePortClick = (port: Port) => {
    setSelectedPort(port);
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">PORTCHAIN Dashboard</h1>
      <div className="flex flex-1 space-x-4">
        <div className="w-2/3 bg-gray-800 rounded-lg p-4">
          <Map
            portsData={portsData}
            handlePortClick={handlePortClick}
            getColor={getColor}
          />
        </div>
        <div className="w-1/3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Port Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPort ? (
                <div className="space-y-2">
                  <p>
                    <strong>Port ID:</strong> {selectedPort.portid}
                  </p>
                  <p>
                    <strong>Country:</strong> {selectedPort.ISO3}
                  </p>
                  <p>
                    <strong>Continent:</strong> {selectedPort.continent}
                  </p>
                  <p>
                    <strong>Total Vessels:</strong>{" "}
                    {selectedPort.vessel_count_total}
                  </p>
                  <p>
                    <strong>Container Vessels:</strong>{" "}
                    {selectedPort.vessel_count_container}
                  </p>
                  <p>
                    <strong>Dry Bulk Vessels:</strong>{" "}
                    {selectedPort.vessel_count_dry_bulk}
                  </p>
                  <p>
                    <strong>General Cargo Vessels:</strong>{" "}
                    {selectedPort.vessel_count_general_cargo}
                  </p>
                  <p>
                    <strong>RoRo Vessels:</strong>{" "}
                    {selectedPort.vessel_count_RoRo}
                  </p>
                  <p>
                    <strong>Import (Tanker):</strong>{" "}
                    {selectedPort.import_tanker.toFixed(2)}
                  </p>
                  <p>
                    <strong>Import (Cargo):</strong>{" "}
                    {selectedPort.import_cargo.toFixed(2)}
                  </p>
                  <p>
                    <strong>Total Import:</strong>{" "}
                    {selectedPort.import.toFixed(2)}
                  </p>
                  <p>
                    <strong>Export (Container):</strong>{" "}
                    {selectedPort.export_container.toFixed(2)}
                  </p>
                  <p>
                    <strong>Export (Dry Bulk):</strong>{" "}
                    {selectedPort.export_dry_bulk.toFixed(2)}
                  </p>
                  <p>
                    <strong>Export (General Cargo):</strong>{" "}
                    {selectedPort.export_general_cargo.toFixed(2)}
                  </p>
                  <p>
                    <strong>Export (RoRo):</strong>{" "}
                    {selectedPort.export_roro.toFixed(2)}
                  </p>
                  <p>
                    <strong>Export (Tanker):</strong>{" "}
                    {selectedPort.export_tanker.toFixed(2)}
                  </p>
                  <p>
                    <strong>Export (Cargo):</strong>{" "}
                    {selectedPort.export_cargo.toFixed(2)}
                  </p>
                  <p>
                    <strong>Total Export:</strong>{" "}
                    {selectedPort.export.toFixed(2)}
                  </p>
                  <p>
                    <strong>Resilience Index:</strong>{" "}
                    {typeof selectedPort.resilience_cluster === "number"
                      ? selectedPort.resilience_cluster.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
              ) : (
                <p>Select a port on the map for details</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Ports by Vessel Count</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={portsData
                    .sort((a, b) => b.vessel_count_total - a.vessel_count_total)
                    .slice(0, 10)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="portid"
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="vessel_count_total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
