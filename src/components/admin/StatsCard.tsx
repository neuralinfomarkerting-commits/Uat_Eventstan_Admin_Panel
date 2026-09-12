interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "orange" | "blue" | "green" | "purple" | "yellow";
  trend?: string;
}

const colors = {
  orange: "bg-orange-50 text-orange-500",
  blue: "bg-blue-50 text-blue-500",
  green: "bg-green-50 text-green-500",
  purple: "bg-purple-50 text-purple-500",
  yellow: "bg-yellow-50 text-yellow-500",
};

export default function StatsCard({
  title,
  value,
  icon,
  color = "orange",
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
    </div>
  );
}
