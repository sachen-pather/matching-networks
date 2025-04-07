"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const ImpedanceGraph = ({ data }) => {
  // Check for invalid or empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  // Calculate maximum absolute values for scaling
  const maxReal = Math.max(...data.map((item) => Math.abs(item.real)));
  const maxImag = Math.max(...data.map((item) => Math.abs(item.imag)));
  const maxSWR = Math.max(...data.map((item) => item.swr));

  // Define Y-axis domain to include negative and positive values
  const yDomain = [
    -Math.max(maxReal, maxImag) * 1.1,
    Math.max(maxReal, maxImag, maxSWR) * 1.1,
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="frequency"
          label={{
            value: "Frequency (MHz)",
            position: "insideBottomRight",
            offset: -10,
          }}
        />
        <YAxis
          domain={yDomain}
          label={{
            value: "Impedance (Ω) / SWR",
            angle: -90,
            position: "insideLeft",
          }}
        />
        <Tooltip formatter={(value, name) => [value.toFixed(2), name]} />
        <Legend />
        <Line
          type="monotone"
          dataKey="real"
          name="Real"
          stroke="#8884d8"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="imag"
          name="Imaginary"
          stroke="#82ca9d"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="swr"
          name="SWR"
          stroke="#ff7300"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
