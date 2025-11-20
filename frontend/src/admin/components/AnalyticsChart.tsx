import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type PieDatum = {
  name: string;
  value: number;
};

const COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
];

// Simple pie chart component for analytics
export function AnalyticsPieChart({ data }: { data: PieDatum[] }) {
  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            paddingAngle={2}

          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          {/* Tooltip shows value on hover */}
          <Tooltip />
          {/* Legend shows value names and colors, but not the values themselves by default */}
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}