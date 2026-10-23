import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { prisma } from "@/lib/prisma";
import {
  dashboardRangeSchema,
  resolveDashboardRange,
} from "@/lib/validations/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RangeControl } from "@/components/dashboard/range-control";
import { LeadsOverTimeChart } from "@/components/dashboard/leads-over-time-chart";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { SourceChart } from "@/components/dashboard/source-chart";

function formatConversion(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function KpiCard({
  title,
  value,
  sublabel,
  href,
}: {
  title: string;
  value: string;
  sublabel: string;
  href?: string;
}) {
  const body = (
    <>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      </CardContent>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        <Card className="transition-colors hover:bg-muted/50">{body}</Card>
      </Link>
    );
  }
  return <Card>{body}</Card>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuth();
  const raw = await searchParams;
  const parsed = dashboardRangeSchema.parse({
    range: typeof raw.range === "string" ? raw.range : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
  });
  const range = resolveDashboardRange(parsed);

  const [organization, data] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true },
    }),
    getDashboardData({
      organizationId: user.organizationId,
      from: range.from,
      to: range.to,
    }),
  ]);

  const { kpis } = data;
  const isEmpty = kpis.totalLeads === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Organization: {organization?.name ?? "Unknown"}
          </p>
        </div>
        <RangeControl
          currentRange={range.rangeParam}
          currentFrom={range.fromParam}
          currentTo={range.toParam}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total leads"
          value={String(kpis.totalLeads)}
          sublabel="All time"
          href="/leads"
        />
        <KpiCard
          title="New leads"
          value={String(kpis.newInRange)}
          sublabel="In range"
        />
        <KpiCard
          title="Won"
          value={String(kpis.wonInRange)}
          sublabel="In range"
        />
        <KpiCard
          title="Conversion rate"
          value={formatConversion(kpis.conversionRate)}
          sublabel="Won / (Won + Lost) — current"
        />
        <KpiCard
          title="Overdue follow-ups"
          value={String(kpis.overdueFollowUps)}
          sublabel="Current"
          href="/follow-ups?tab=overdue"
        />
        <KpiCard
          title="Due today"
          value={String(kpis.dueTodayFollowUps)}
          sublabel="Current"
          href="/follow-ups?tab=today"
        />
      </div>

      {isEmpty ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <CardContent>
            <p className="text-lg font-medium">No leads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first lead to start tracking your pipeline and see
              analytics here.
            </p>
            <Link
              href="/leads"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add your first lead
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads over time</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadsOverTimeChart data={data.leadsOverTime} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <PipelineChart data={data.pipeline} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <SourceChart data={data.sources} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
