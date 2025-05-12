import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const LeadsChart = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        // Destroy existing chart
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
        
        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [
              {
                label: 'One-time Leads',
                data: [12, 19, 10, 15, 22, 18, 15],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
              },
              {
                label: 'Monthly Leads',
                data: [8, 12, 6, 9, 13, 11, 10],
                borderColor: '#0D9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  boxWidth: 6
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            }
          }
        });
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <canvas ref={chartRef} height="300"></canvas>
  );
};

export default LeadsChart;