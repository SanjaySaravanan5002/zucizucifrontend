import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const PerformanceChart = () => {
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
          type: 'bar',
          data: {
            labels: ['Rahul', 'Suresh', 'Vikram', 'Anand', 'Rajesh'],
            datasets: [
              {
                label: 'Washes Completed',
                data: [65, 59, 80, 81, 56],
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',  // primary blue
                  'rgba(13, 148, 136, 0.8)',  // teal
                  'rgba(249, 115, 22, 0.8)',  // orange
                  'rgba(139, 92, 246, 0.8)',  // purple
                  'rgba(236, 72, 153, 0.8)',  // pink
                ],
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
                  text: 'Washes Completed'
                },
                ticks: {
                  precision: 0
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Washer Names'
                }
              }
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

export default PerformanceChart;