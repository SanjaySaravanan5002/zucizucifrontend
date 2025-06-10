import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface WasherData {
  name: string;
  washes: number;
}

const PerformanceChart = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/washer-performance');
        const data: WasherData[] = await response.json();

        if (!isSubscribed || !chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const colors = [
          'rgba(59, 130, 246, 0.8)',  // primary blue
          'rgba(13, 148, 136, 0.8)',   // teal
          'rgba(249, 115, 22, 0.8)',   // orange
          'rgba(139, 92, 246, 0.8)',   // purple
          'rgba(236, 72, 153, 0.8)',   // pink
        ];

        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.map(washer => washer.name),
            datasets: [
              {
                label: 'Washes Completed',
                data: data.map(washer => washer.washes),
                backgroundColor: colors.slice(0, data.length),
                borderRadius: 4,
                borderWidth: 0,
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems) {
                    return `Washer: ${tooltipItems[0].label}`;
                  },
                  label: function(context) {
                    return `Completed: ${context.raw} washes`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Washes Completed',
                  font: {
                    size: 12,
                    weight: 500,
                  },
                  color: '#64748B',
                },
                ticks: {
                  precision: 0,
                  font: {
                    size: 11,
                  },
                  color: '#64748B',
                },
                grid: {
                  color: 'rgba(148, 163, 184, 0.1)',
                  display: true,
                },
                border: {
                  dash: [4, 4],
                },
              },
              x: {
                title: {
                  display: true,
                  text: 'Washer Names',
                  font: {
                    size: 12,
                    weight: 500,
                  },
                  color: '#64748B',
                },
                ticks: {
                  font: {
                    size: 11,
                  },
                  color: '#64748B',
                },
                grid: {
                  display: false,
                },
                border: {
                  dash: [4, 4],
                },
              }
            },
            animation: {
              duration: 1000,
            },
          }
        });
      } catch (error) {
        console.error('Error fetching washer performance data:', error);
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <canvas ref={chartRef} height="300"></canvas>
  );
};

export default PerformanceChart;