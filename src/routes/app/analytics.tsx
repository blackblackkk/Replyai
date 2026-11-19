import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";
import { useWorkspace } from "@/lib/reply/use-workspace";
import { Card, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { data, error, pending } = useWorkspace();
  if (pending) return <p className="text-muted">Загрузка…</p>;
  if (error || !data) return <p className="text-accent">{error || "Нет данных"}</p>;
  return (
    <div>
      <PageTitle
        kicker="Аналитика"
        title="Только количества"
        text="Дни, ответы, передачи и кредиты. Содержимое переписок сюда не попадает."
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Входящие</p>
          <p className="mt-2 font-display text-3xl">{data.totals.inbound}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Ответы</p>
          <p className="mt-2 font-display text-3xl">{data.totals.replied}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Людям</p>
          <p className="mt-2 font-display text-3xl">{data.totals.handoff}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Кредиты</p>
          <p className="mt-2 font-display text-3xl">
            {data.creditsUsed}
            <span className="text-base text-muted">/{data.creditLimit}</span>
          </p>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="font-display text-xl">14 дней</h2>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.usage}>
              <XAxis dataKey="day" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Bar dataKey="inbound" fill="var(--color-primary)" radius={4} />
              <Bar dataKey="replied" fill="var(--color-accent)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-sm text-muted">Фиолетовый — входящие, синий — отправленные ответы.</p>
      </Card>
    </div>
  );
}
