import { createFileRoute } from "@tanstack/react-router";
import { setPlan } from "@/lib/reply/api";
import { useWorkspace } from "@/lib/reply/use-workspace";
import { PLAN_CREDITS, PLANS } from "@/lib/reply/types";
import { Button, Card, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/billing")({ component: BillingPage });

const COPY: Record<string, string> = {
  free: "Проверка продукта и небольшой запас кредитов.",
  starter: "Личный помощник для ежедневных переписок.",
  pro: "Выше лимит и место для более плотной базы.",
  team: "Профиль для общей базы. Командные места появятся отдельно.",
};

function BillingPage() {
  const { data, error, pending, setData } = useWorkspace();
  if (pending) return <p className="text-muted">Загрузка…</p>;
  if (error || !data) return <p className="text-accent">{error || "Нет данных"}</p>;
  return (
    <div>
      <PageTitle
        kicker="Тариф"
        title="Оплата Grok не здесь"
        text="REPLY деньги не списывает. Ответы модели оплачиваются кредитами xAI. Числа ниже только считали бы внутренний потолок, на отправку они больше не влияют."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Card key={plan} className={data.plan === plan ? "border-primary" : ""}>
            <h2 className="font-display text-2xl capitalize">{plan}</h2>
            <p className="mt-2 text-sm text-muted">{COPY[plan]}</p>
            <p className="mt-3 font-display text-3xl">{PLAN_CREDITS[plan]}</p>
            <p className="text-sm text-muted">кредитов на аккаунт</p>
            <Button
              className="mt-4"
              type="button"
              variant={data.plan === plan ? "quiet" : "primary"}
              onClick={() => void setPlan({ data: plan }).then(setData)}
            >
              {data.plan === plan ? "Выбран" : "Поставить этот профиль"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
