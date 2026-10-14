import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (value) => `PHP ${value}` },
    },
  },
};

export function SalesChart({ points, variant = 'line' }) {
  const data = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: 'Sales (PHP)',
        data: points.map((point) => point.total),
        borderColor: '#ff5a1f',
        backgroundColor: variant === 'bar' ? '#ff5a1f' : 'rgba(255, 90, 31, 0.15)',
        tension: 0.25,
        fill: variant === 'line',
      },
    ],
  };

  return (
    <div style={{ height: 320 }}>
      {variant === 'bar' ? <Bar data={data} options={options} /> : <Line data={data} options={options} />}
    </div>
  );
}
