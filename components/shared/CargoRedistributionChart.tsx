import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const truncateString = (str, num) => {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
};

const CustomXAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-45)"
        fontSize={12}
      >
        {truncateString(payload.value, 15)}
      </text>
    </g>
  );
};

const CargoRedistributionChart = ({ data }) => {
  const chartData = data
    .filter(port => port.cargo_redistributed > 0 || port.cargo_received > 0)
    .map(port => ({
      name: port.portname,
      redistributed: port.cargo_redistributed || 0,
      received: port.cargo_received || 0
    }))
    .sort((a, b) => (b.redistributed + b.received) - (a.redistributed + a.received))
    .slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 100
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          interval={0}
          height={80}
          tick={<CustomXAxisTick />}
        />
        <YAxis />
        <Tooltip />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{
            paddingTop: '20px',
            marginBottom: '-65px'
          }}
        />
        <Bar dataKey="redistributed" fill="#8884d8" name="Cargo Redistributed" />
        <Bar dataKey="received" fill="#82ca9d" name="Cargo Received" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CargoRedistributionChart;