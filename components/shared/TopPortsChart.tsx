import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TopPortsChart = ({ data }) => {
  const chartData = data
    .sort((a, b) => b.vessel_count_total - a.vessel_count_total)
    .slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="portname" interval={0} angle={-45} textAnchor="end" height={70} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="vessel_count_total" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopPortsChart;