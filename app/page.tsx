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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadPortData } from "../lib/actions/load"; // Assume this function is implemented to load CSV data

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import("../components/shared/Map"), { ssr: false });

// Type definitions
interface Port {
  portid: string;
  ISO3: string;
  continent: string;
  lat: number;
  lon: number;
  vessel_count_total: number;
  // Add other fields as needed
}

const getColor = (vesselCount: number): string => {
  if (vesselCount > 2000) return "#8B0000"; // Dark Red
  if (vesselCount > 1500) return "#FF0000"; // Red
  if (vesselCount > 1000) return "#FFA500"; // Orange
  if (vesselCount > 500) return "#FFFF00"; // Yellow
  if (vesselCount > 250) return "#9ACD32"; // Yellow Green
  return "#008000"; // Green
};

const Dashboard: React.FC = () => {
  const [portsData, setPortsData] = useState<Port[]>([]);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [disruptionScenario, setDisruptionScenario] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadPortData();
      setPortsData(data);
    };
    fetchData();
  }, []);

  const handlePortClick = (port: Port) => {
    setSelectedPort(port);
  };

  const runSimulation = () => {
    // Simplified simulation logic
    const updatedPorts = portsData.map((port) => {
      if (port.portid.toLowerCase() === disruptionScenario.toLowerCase()) {
        return {
          ...port,
          vessel_count_total: Math.max(0, port.vessel_count_total - 100),
        };
      }
      return port;
    });

    // Simple load balancing
    const disruptedPort = updatedPorts.find(
      (p) => p.portid.toLowerCase() === disruptionScenario.toLowerCase()
    );
    if (disruptedPort) {
      const vesselToRedistribute = Math.floor(
        disruptedPort.vessel_count_total * 0.3
      );
      disruptedPort.vessel_count_total -= vesselToRedistribute;

      const otherPorts = updatedPorts.filter(
        (p) => p.portid !== disruptedPort.portid
      );
      const totalVessels = otherPorts.reduce(
        (sum, p) => sum + p.vessel_count_total,
        0
      );

      otherPorts.forEach((port) => {
        const share = port.vessel_count_total / totalVessels;
        port.vessel_count_total += Math.floor(vesselToRedistribute * share);
      });
    }

    setPortsData(updatedPorts);
  };

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
                <div>
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
                </div>
              ) : (
                <p>Select a port on the map for details</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Disruption Simulation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="disruptionScenario">Port to Disrupt:</Label>
                <Input
                  id="disruptionScenario"
                  placeholder="Enter port ID"
                  value={disruptionScenario}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDisruptionScenario(e.target.value)
                  }
                />
                <Button onClick={runSimulation}>Run Simulation</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vessel Count Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={portsData.slice(0, 10)}>
                  {" "}
                  // Showing only top 10 ports
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="portid" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
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
