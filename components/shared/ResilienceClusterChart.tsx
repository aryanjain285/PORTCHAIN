import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ResilienceClusterChart = ({ data }) => {
  const clusterCounts = data.reduce((acc, port) => {
    const cluster = port.resilience_cluster !== undefined ? Math.floor(port.resilience_cluster) : 'Undefined';
    acc[cluster] = (acc[cluster] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(clusterCounts).map(([cluster, count]) => ({
    name: `Cluster ${cluster}`,
    value: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

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

export default ResilienceClusterChart;