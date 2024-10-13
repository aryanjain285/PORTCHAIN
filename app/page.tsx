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
import { Button } from "@/components/ui/button";
import { X } from "lucide-react"; // Import the X icon from lucide-react
import ChartWrapper from "@/components/shared/ChartWrapper";


const Map = dynamic(() => import("../components/shared/Map"), { ssr: false });

interface Port {
  portid: string;
  portname: string;
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
  if (resilienceIndex === undefined) return "#808080";
  if (resilienceIndex > 8) return "#008000";
  if (resilienceIndex > 6) return "#9ACD32";
  if (resilienceIndex > 4) return "#FFFF00";
  if (resilienceIndex > 2) return "#FFA500";
  return "#FF0000";
};

const Dashboard: React.FC = () => {
  const [portsData, setPortsData] = useState<Port[]>([]);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadPortData();
      if (data.length === 0) {
        throw new Error("No valid port data found");
      }
      setPortsData(data);
    } catch (err) {
      console.error("Error loading port data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortClick = (port: Port) => {
    setSelectedPort(port);
  };

  const handleClosePortDetails = () => {
    setSelectedPort(null);
  };

  // Function to handle the update button click
  const handleUpdateClick = async () => {
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await fetch('/api/update', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: "2024-10-01",
          end_date: "2024-10-05",
        }),
      });
  
      console.log("Request sent");
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
      }
  
      const result = await response.json();
      console.log("Response from API route:", result);
  
      if (result.message === 'Update successful') {
        // Reload the page to reflect the updated CSV
        window.location.reload(); // This will refresh the page
      }
  
    } catch (err) {
      console.error("Error during update:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  
  

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">PortChain Dashboard</h1>
        <div className="flex space-x-2">
          <Button onClick={fetchData}>Refresh Data</Button>
          <Button onClick={handleUpdateClick}>Update Ports</Button>
        </div>
      </div>
      <div className="flex flex-1 space-x-4 overflow-hidden">
        <div className="w-3/5 h-full bg-gray-800 rounded-lg p-4 overflow-hidden">
          <Map
            portsData={portsData}
            handlePortClick={handlePortClick}
            getColor={getColor}
          />
        </div>
        <div className="w-2/5 flex flex-col space-y-4 overflow-hidden">
        <div className="flex-shrink-0 max-h-[40%] overflow-y-auto">
          <Card className="">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Port Details</CardTitle>
                {selectedPort && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClosePortDetails}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedPort ? (
                <div className="space-y-2">
                  <p><strong>Port ID:</strong> {selectedPort.portid}</p>
                  <p><strong>Port Name:</strong> {selectedPort.portname}</p>
                  <p><strong>Country:</strong> {selectedPort.ISO3}</p>
                  <p><strong>Continent:</strong> {selectedPort.continent}</p>
                  <p><strong>Total Vessels:</strong> {selectedPort.vessel_count_total}</p>
                  <p><strong>Container Vessels:</strong> {selectedPort.vessel_count_container}</p>
                  <p><strong>Dry Bulk Vessels:</strong> {selectedPort.vessel_count_dry_bulk}</p>
                  <p><strong>General Cargo Vessels:</strong> {selectedPort.vessel_count_general_cargo}</p>
                  <p><strong>RoRo Vessels:</strong> {selectedPort.vessel_count_RoRo}</p>
                  <p><strong>Import (Tanker):</strong> {selectedPort.import_tanker.toFixed(2)}</p>
                  <p><strong>Import (Cargo):</strong> {selectedPort.import_cargo.toFixed(2)}</p>
                  <p><strong>Total Import:</strong> {selectedPort.import.toFixed(2)}</p>
                  <p><strong>Export (Container):</strong> {selectedPort.export_container.toFixed(2)}</p>
                  <p><strong>Export (Dry Bulk):</strong> {selectedPort.export_dry_bulk.toFixed(2)}</p>
                  <p><strong>Export (General Cargo):</strong> {selectedPort.export_general_cargo.toFixed(2)}</p>
                  <p><strong>Export (RoRo):</strong> {selectedPort.export_roro.toFixed(2)}</p>
                  <p><strong>Export (Tanker):</strong> {selectedPort.export_tanker.toFixed(2)}</p>
                  <p><strong>Export (Cargo):</strong> {selectedPort.export_cargo.toFixed(2)}</p>
                  <p><strong>Total Export:</strong> {selectedPort.export.toFixed(2)}</p>
                  <p><strong>Resilience Index:</strong> {
                    selectedPort.resilience_cluster !== undefined
                      ? selectedPort.resilience_cluster.toFixed(2)
                      : "N/A"
                  }</p>
                </div>
              ) : (
                <p>Select a port on the map for details</p>
              )}
            </CardContent>
          </Card>
          </div>
          <div className="h-full ">
          
          <ChartWrapper portsData={portsData} />
          </div>
          
          {/* <Card>
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
                  <XAxis dataKey="portname" interval={0} angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="vessel_count_total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
