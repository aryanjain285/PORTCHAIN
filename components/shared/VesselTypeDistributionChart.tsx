import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const VesselTypeDistributionChart = ({ data }) => {
  const vesselTypes = [
    { name: 'Container', key: 'vessel_count_container' },
    { name: 'Dry Bulk', key: 'vessel_count_dry_bulk' },
    { name: 'General Cargo', key: 'vessel_count_general_cargo' },
    { name: 'RoRo', key: 'vessel_count_RoRo' },
    { name: 'Tanker', key: 'vessel_count_tanker' },
  ];

  const chartData = vesselTypes.map(type => ({
    name: type.name,
    value: data.reduce((sum, port) => sum + (port[type.key] || 0), 0),
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default VesselTypeDistributionChart;