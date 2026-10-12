import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Accent = "primary" | "primaryDark" | "secondary";
const accentClasses: Record<
  Accent,
  { tab: string; badge: string; text: string }
> = {
  primary: {
    tab: "bg-primary",
    badge: "bg-primary/10 text-primary-dark",
    text: "text-primary-dark",
  },
  primaryDark: {
    tab: "bg-primary-dark",
    badge: "bg-primary-dark/10 text-primary-dark",
    text: "text-primary-dark",
  },
  secondary: {
    tab: "bg-secondary",
    badge: "bg-secondary/10 text-secondary",
    text: "text-secondary",
  },
};

export const KpiCard = ({
  label,
  value,
  breakdown,
  icon: Icon,
  accent = "primary",
  onClick,
}: {
  label: string;
  value: string | number;
  breakdown?: { initials: string; percentage: number; amount: string }[];
  icon: LucideIcon;
  accent?: Accent;
  onClick?: () => void;
}) => {
  const colors = accentClasses[accent];
  const cardClassName = breakdown
    ? "premium-card flex h-[208px] w-[196px] max-w-full flex-col items-center justify-start gap-2 px-4 py-3 text-center"
    : "premium-card flex h-[146px] w-[172px] max-w-full flex-col items-center justify-center gap-1.5 px-4 py-4 text-center";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cardClassName} cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
      >
        <span
          className={`grid size-8 place-items-center rounded-lg ${colors.badge}`}
        >
          <Icon size={17} />
        </span>
        {breakdown ? (
          <div className="mt-1 w-full">
            <p className="text-sm font-bold tabular-nums text-text-primary">
              Total {value}
            </p>
            <div className="mt-2 grid w-full grid-cols-2 gap-2 rounded-md bg-slate-50/80 px-2.5 py-2">
              {breakdown.map((part, index) => (
                <div
                  key={part.initials}
                  className={`min-w-0 px-2 ${index > 0 ? "border-l border-border-gold/80" : ""}`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-secondary">
                    {part.initials} {part.percentage}%
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[1rem] font-bold tabular-nums text-text-primary">
                    {part.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
            {value}
          </p>
        )}
        <p className="mt-auto pb-1 text-sm font-medium leading-4 text-text-secondary">
          {label}
        </p>
      </button>
    );
  }

  return (
    <article className={cardClassName}>
      <span
        className={`grid size-8 place-items-center rounded-lg ${colors.badge}`}
      >
        <Icon size={17} />
      </span>
      {breakdown ? (
        <div className="mt-1 w-full">
          <p className="text-sm font-bold tabular-nums text-text-primary">
            Total {value}
          </p>
          <div className="mt-2 grid w-full grid-cols-2 gap-2 rounded-md bg-slate-50/80 px-2.5 py-2">
            {breakdown.map((part, index) => (
              <div
                key={part.initials}
                className={`min-w-0 px-2 ${index > 0 ? "border-l border-border-gold/80" : ""}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-secondary">
                  {part.initials} {part.percentage}%
                </p>
                <p className="mt-1 whitespace-nowrap text-[1rem] font-bold tabular-nums text-text-primary">
                  {part.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
          {value}
        </p>
      )}
      <p className="mt-auto pb-1 text-sm font-medium leading-4 text-text-secondary">
        {label}
      </p>
    </article>
  );
};

export const NetPositionCard = ({
  partyOutstanding,
  supplierPayable,
  formatCurrency,
}: {
  partyOutstanding: number;
  supplierPayable: number;
  formatCurrency: (value: number) => string;
}) => {
  const total = partyOutstanding + supplierPayable;
  const partyShare = total ? (partyOutstanding / total) * 100 : 50;
  const difference = Math.abs(partyOutstanding - supplierPayable);
  const summary =
    partyOutstanding >= supplierPayable
      ? `Receivable exceeds payable by ${formatCurrency(difference)}`
      : `Payable exceeds receivable by ${formatCurrency(difference)}`;
  return (
    <article className="premium-card h-full p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-text-primary">Net position</h3>
        <p className="text-xs text-text-secondary">{summary}</p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-text-secondary">
            <span className="mr-2 inline-block size-2 rounded-full bg-primary" />
            Party Outstanding
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-text-primary">
            {formatCurrency(partyOutstanding)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-text-secondary">
            Supplier Payable
            <span className="ml-2 inline-block size-2 rounded-full bg-secondary" />
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-text-primary">
            {formatCurrency(supplierPayable)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-border-gold">
        <span className="bg-primary" style={{ width: `${partyShare}%` }} />
        <span
          className="bg-secondary"
          style={{ width: `${100 - partyShare}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        Amount receivable from parties vs. amount to be paid to suppliers.
      </p>
    </article>
  );
};

export const HighestCard = ({
  label,
  name,
  amount,
  formatCurrency,
  accent = "primary",
}: {
  label: string;
  name: string;
  amount?: number;
  formatCurrency: (value: number) => string;
  accent?: Accent;
}) => {
  const colors = accentClasses[accent];
  return (
    <article className="premium-card flex h-full min-h-16 items-center justify-between gap-2 p-2.5">
      <div>
        <p
          className={`text-[0.6rem] font-semibold uppercase tracking-wide ${colors.text}`}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs font-bold text-text-primary">{name}</p>
      </div>
      <p className={`text-sm font-bold tabular-nums ${colors.text}`}>
        {amount === undefined ? "-" : formatCurrency(amount)}
      </p>
    </article>
  );
};
export const InfoCard = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <article className="premium-card flex h-full min-h-28 flex-col p-3">
    <div className="flex items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary-dark">
        <Icon size={15} />
      </span>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>
    </div>
    <div className="mt-2 flex-1">{children}</div>
  </article>
);
