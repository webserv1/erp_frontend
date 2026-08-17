import type { LucideIcon } from "lucide-react";
import { Card } from "../ui";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export const StatCard = ({
  label,
  value,
  icon: Icon,
  description,
}: StatCardProps) => (
  <Card
    hoverable
    className="flex h-[130px] w-full flex-col items-center justify-center p-3 text-center"
  >
    <div className="mb-2 grid size-8 place-items-center rounded-lg bg-primary/15 text-primary-dark">
      <Icon size={16} />
    </div>
    <p className="text-base font-extrabold text-secondary">{value}</p>
    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-tight text-secondary">
      {label}
    </p>
    {description && (
      <p className="mt-1 text-xs text-text-secondary">{description}</p>
    )}
  </Card>
);