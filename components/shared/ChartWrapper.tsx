import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResilienceClusterChart from './ResilienceClusterChart';
import CargoRedistributionChart from './CargoRedistributionChart';
import PortCapacityUtilizationChart from './PortCapacityUtilizationChart';

const ChartWrapper = ({ portsData }) => {
  const [selectedChart, setSelectedChart] = useState('cargoRedistribution');

  const charts = {
    resilienceCluster: { component: ResilienceClusterChart, title: 'Resilience Cluster Distribution' },
    cargoRedistribution: { component: CargoRedistributionChart, title: 'Cargo Redistribution' },
    capacityUtilization: { component: PortCapacityUtilizationChart, title: 'Port Capacity Utilization' },
  };

  const SelectedChart = charts[selectedChart].component;

  return (
    <Card className='h-full'>
      <CardHeader>
        <div className="flex justify-between items-center ">
          <CardTitle>{charts[selectedChart].title}</CardTitle>
          <Select onValueChange={setSelectedChart} value={selectedChart}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select chart" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resilienceCluster">Resilience Clusters</SelectItem>
              <SelectItem value="cargoRedistribution">Cargo Redistribution</SelectItem>
              <SelectItem value="capacityUtilization">Capacity Utilization</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <SelectedChart data={portsData} />
      </CardContent>
    </Card>
  );
};

export default ChartWrapper;