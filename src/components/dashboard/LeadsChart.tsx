import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface LeadData {
  date: string;
  monthlyCount: number;
  oneTimeCount: number;
}

const LeadsChart = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('https://zuci-backend-my3h.onrender.com/api/dashboard/lead-acquisition', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data: LeadData[] = await response.json();

        if (!isSubscribed || !chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Format dates to be more readable
        const labels = data.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        });

        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'One-time Leads',
                data: data.map((item) => item.oneTimeCount),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#3B82F6',
              },
              {
                label: 'Monthly Leads',
                data: data.map((item) => item.monthlyCount),
                borderColor: '#0D9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0D9488',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#0D9488',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
                labels: {
                  usePointStyle: true,
                  boxWidth: 6,
                  font: {
                    size: 12,
                    weight: 500,
                  },
                  padding: 20,
                },
              },
              tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleFont: {
                  size: 13,
                  weight: 600,
                },
                bodyFont: {
                  size: 12,
                },
                padding: 12,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                displayColors: true,
                boxWidth: 8,
                boxHeight: 8,
                usePointStyle: true,
                callbacks: {
                  title: (context: any) => {
                    return context[0].label;
                  },
                  label: (context: any) => {
                    return ` ${context.dataset.label}: ${context.parsed.y} leads`;
                  },
                },
              },
            },
            scales: {
              y: {
                min: 0,
                max: 5,
                grid: {
                  color: 'rgba(148, 163, 184, 0.1)',
                  display: true,
                },
                ticks: {
                  precision: 0,
                  font: {
                    size: 11,
                  },
                  color: '#64748B',
                },
                border: {
                  dash: [4, 4],
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  font: {
                    size: 11,
                  },
                  color: '#64748B',
                },
                border: {
                  dash: [4, 4],
                },
              },
            },
            interaction: {
              mode: 'nearest' as const,
              axis: 'x' as const,
              intersect: false,
            },
            animation: {
              duration: 1000,
            },
          },
        });
  
      } catch (error) {
        console.error('Error fetching lead acquisition data:', error);
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


  return <canvas ref={chartRef} height="300"></canvas>;
};

export default LeadsChart;