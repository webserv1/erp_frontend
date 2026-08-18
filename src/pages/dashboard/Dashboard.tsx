import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Package,
  Receipt,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  HighestCard,
  InfoCard,
  KpiCard,
} from "../../components/dashboard/DashboardCards";
import { useToast } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import { dashboardApi, type DashboardData } from "../../services/dashboard.api";
import { expenseApi } from "../../services/expense.api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const welcomed = useRef(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role.name === "ADMIN";
  const isSqarsGarments =
    user?.company?.name.replace(/\s+/g, "").toLocaleLowerCase() ===
    "sqarsgarments";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [dashboardResult, expenseResult] = await Promise.allSettled([
        dashboardApi.get(),
        isAdmin ? expenseApi.getSummary() : Promise.resolve(null),
      ]);

      if (cancelled) return;

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value);
      } else {
        toast({
          title: "Failed to load dashboard",
          description: (dashboardResult.reason as Error).message,
          variant: "error",
        });
      }

      if (expenseResult.status === "fulfilled" && expenseResult.value) {
        setExpenses(expenseResult.value.thisMonthTotal);
      }

      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, toast]);

  useEffect(() => {
    if (!user || welcomed.current) return;
    welcomed.current = true;
    toast({
      title: `Welcome, ${user.name.split(" ")[0]}.`,
      description: "Your workspace is ready.",
      variant: "info",
    });
  }, [toast, user]);

  const { highestParty, highestSupplier } = dashboard?.balances ?? {
    highestParty: null,
    highestSupplier: null,
  };
  const value = (amount: number | string) => (loading ? "..." : amount);
  const kpis = [
    {
      label: "Products",
      icon: Package,
      value: value(dashboard?.totalProducts ?? 0),
      accent: "primary" as const,
    },
    {
      label: "Suppliers",
      icon: Store,
      value: value(dashboard?.totalSuppliers ?? 0),
      accent: "primaryDark" as const,
    },
    {
      label: "Total Parties",
      icon: Users,
      value: value(dashboard?.totalParties ?? 0),
      accent: "secondary" as const,
    },
    {
      label: "Total Sales",
      icon: ShoppingCart,
      value: value(dashboard?.totalSales ?? 0),
      accent: "primaryDark" as const,
      adminOnly: true,
    },
    {
      label: "This Month Expenses",
      icon: Wallet,
      value: value(currency.format(expenses)),
      accent: "secondary" as const,
      adminOnly: true,
    },
    {
      label: "Today's Purchase",
      icon: Receipt,
      value: value(dashboard?.today.purchaseCount ?? 0),
      accent: "primaryDark" as const,
    },
    {
      label: "Today's Sales",
      icon: TrendingUp,
      value: value(dashboard?.today.saleCount ?? 0),
      accent: "primary" as const,
    },
    {
      label: "Low Stock Alert",
      icon: AlertTriangle,
      value: value(dashboard?.lowStockAlerts.length ?? 0),
      accent: "secondary" as const,
    },
    {
      label: "Today's Profit",
      icon: TrendingUp,
      value: value(currency.format(dashboard?.today.salesProfit ?? 0)),
      accent: "primary" as const,
      adminOnly: true,
    },
    {
      label: "Total Sales Profit",
      icon: TrendingUp,
      value: value(currency.format(dashboard?.totalSalesProfit ?? 0)),
      breakdown:
        isSqarsGarments && !loading
          ? [
              {
                initials: "SQ",
                percentage: 60,
                amount: currency.format(
                  (dashboard?.totalSalesProfit ?? 0) * 0.6,
                ),
              },
              {
                initials: "ARS",
                percentage: 40,
                amount: currency.format(
                  (dashboard?.totalSalesProfit ?? 0) * 0.4,
                ),
              },
            ]
          : undefined,
      accent: "secondary" as const,
      adminOnly: true,
    },
  ];

  return (
    <div className="relative isolate min-h-full">
      {isSqarsGarments && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/sqars-dashboard-bg.jpg.jpeg')" }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8">
          <h2 className="inline-block rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-3xl font-bold text-secondary shadow-sm">
            Good to see you, {user?.name.split(" ")[0]}.
          </h2>
        </div>

        <section aria-labelledby="business-at-a-glance">
          <h3
            id="business-at-a-glance"
            className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-extrabold tracking-wider text-secondary shadow-sm"
          >
            BUSINESS AT A GLANCE
          </h3>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {kpis
              .filter((kpi) => !kpi.adminOnly || isAdmin)
              .map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
          </div>
        </section>

        <section className="mt-6" aria-labelledby="highest-balances">
          <h3
            id="highest-balances"
            className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-extrabold tracking-wider text-secondary shadow-sm"
          >
            HIGHEST BALANCES
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <HighestCard
              label="Highest Party Pending"
              name={highestParty?.name ?? "No pending party balance"}
              amount={highestParty?.amount}
              formatCurrency={currency.format}
              accent="primary"
            />
            <HighestCard
              label="Highest Supplier Payable"
              name={highestSupplier?.name ?? "No supplier payable balance"}
              amount={highestSupplier?.amount}
              formatCurrency={currency.format}
              accent="secondary"
            />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard
            icon={BellRing}
            title="30-Day Payment Reminders"
            subtitle="Parties with unpaid amounts older than 30 days"
          >
            {loading ? (
              <p className="text-sm text-text-secondary">
                Loading reminders...
              </p>
            ) : dashboard?.overduePartyReminders.length ? (
              <div className="space-y-2">
                {dashboard.overduePartyReminders.map((party) => (
                  <div
                    key={`${party.id}-${party.name}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border-gold p-2.5"
                  >
                    <div>
                      <p className="font-bold text-secondary">{party.name}</p>
                      <p className="text-xs text-text-secondary">
                        Pending since{" "}
                        {new Date(party.overdueSince).toLocaleDateString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                    <p className="font-extrabold text-primary-dark">
                      {currency.format(party.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="text-primary-dark" size={20} />
                <p>No overdue party payments.</p>
              </div>
            )}
          </InfoCard>

          <InfoCard
            icon={Receipt}
            title="Latest Party Purchase"
            subtitle="Most recent party sale"
          >
            {loading ? (
              <p className="text-sm text-text-secondary">
                Loading latest sale...
              </p>
            ) : dashboard?.lastPartyPurchase ? (
              <div>
                <p className="text-lg font-extrabold text-secondary">
                  {dashboard.lastPartyPurchase.partyName}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {dashboard.lastPartyPurchase.productName} (
                  {dashboard.lastPartyPurchase.productCode})
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-xs text-text-secondary">
                    {new Date(
                      dashboard.lastPartyPurchase.createdAt,
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xl font-extrabold text-primary-dark">
                    {currency.format(dashboard.lastPartyPurchase.salePrice)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                No party purchases yet.
              </p>
            )}
          </InfoCard>
        </section>
      </div>
    </div>
  );
};
