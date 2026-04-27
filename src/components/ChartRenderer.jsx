import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function ChartRenderer({ chartData }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartData || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);

    try {
      const option = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;
      chartInstance.current.setOption(option);
    } catch (error) {
      console.error('Failed to parse chart data:', error);
    }

    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, [chartData]);

  if (!chartData) {
    return null;
  }

  return (
    <div className="w-full h-64">
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}
