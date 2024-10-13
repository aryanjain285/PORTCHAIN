import React from "react";
import { MapContainer, TileLayer, Tooltip, Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.css";
import "react-leaflet-cluster/lib/assets/MarkerCluster.Default.css";

type MarkerCluster = any;

interface Port {
  portid: string;
  ISO3: string;
  continent: string;
  lat: number | string;
  lon: number | string;
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

interface MapProps {
  portsData: Port[];
  handlePortClick: (port: Port) => void;
  getColor: (resilienceIndex: number | undefined) => string;
}

const Map: React.FC<MapProps> = ({ portsData, handlePortClick, getColor }) => {
  const createClusterCustomIcon = function (cluster: MarkerCluster) {
    return L.divIcon({
      html: `<span>${cluster.getChildCount()}</span>`,
      className: "custom-marker-cluster",
      iconSize: L.point(40, 40, true),
    });
  };

  const validPorts = portsData.filter(
    (port) =>
      typeof port.lat === "number" &&
      typeof port.lon === "number" &&
      !isNaN(Number(port.lat)) &&
      !isNaN(Number(port.lon))
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
      >
        {validPorts.map((port) => (
          <PortMarker
            key={port.portid}
            port={port}
            getColor={getColor}
            handlePortClick={handlePortClick}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

const PortMarker: React.FC<{
  port: Port;
  getColor: (resilienceIndex: number | undefined) => string;
  handlePortClick: (port: Port) => void;
}> = ({ port, getColor, handlePortClick }) => {
  const markerIcon = L.divIcon({
    className: "custom-div-icon",
    html: `<div style='background-color:${getColor(
      port.resilience_cluster
    )};'></div>`,
    iconSize: [30, 30],
  });

  return (
    <Marker
      position={[Number(port.lat), Number(port.lon)]}
      icon={markerIcon}
      eventHandlers={{
        click: () => handlePortClick(port),
      }}
    >
      <Tooltip>
        {port.portid} - Resilience Index:{" "}
        {typeof port.resilience_cluster === "number"
          ? port.resilience_cluster.toFixed(2)
          : "N/A"}
      </Tooltip>
    </Marker>
  );
};

export default Map;
