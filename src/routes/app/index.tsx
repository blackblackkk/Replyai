import { createFileRoute, Link } from "@tanstack/react-router";
import { EVENT_LABELS, MODE_LABELS } from "@/lib/reply/labels";
import { useWorkspace } from "@/lib/reply/use-workspace";
import { Card, PageTitle, Status } from "@/components/reply/ui";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const { data, error, pending } = useWorkspace();
  if (pending) return <p className="text-muted">Загрузка кабинета…</p>;
  if (error || !data) return <p className="text-accent">{error || "Нет данных"}</p>;
  const aiOn = data.automation.enabled && !data.automation.paused;
  return (
    <div>
      <PageTitle
        kicker="Кабинет"
        title="Состояние помощника"
        text="Счётчики без текстов переписок. Подключение Telegram считается настоящим только после события от Telegram."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Telegram</p>
          <div className="mt-3">
            <Status ok={data.telegram.connected}>{data.telegram.connected ? "Подключено" : "Не подключено"}</Status>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Автоответ</p>
          <div className="mt-3">
            <Status ok={aiOn}>{aiOn ? MODE_LABELS[data.automation.mode] : "Выключен"}</Status>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Входящие</p>
          <p className="mt-2 font-display text-3xl">{data.totals.inbound}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Ответы / передачи</p>
          <p className="mt-2 font-display text-3xl">
            {data.totals.replied}
            <span className="text-muted"> / {data.totals.handoff}</span>
          </p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="font-display text-xl">События</h2>
          <ul className="mt-4 divide-y divide-line">
            {data.events.length === 0 ? <li className="py-3 text-sm text-muted">Пока пусто. Это нормально.</li> : null}
            {data.events.map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <span>{EVENT_LABELS[event.kind] ?? event.kind}</span>
                <span className="shrink-0 text-muted">{event.detail}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Дальше</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link to="/app/knowledge" className="text-accent">
                Заполнить знания
              </Link>
              <p className="text-muted">Без этого помощник не должен выдумывать условия.</p>
            </li>
            <li>
              <Link to="/app/telegram" className="text-accent">
                Подключить Telegram
              </Link>
              <p className="text-muted">Ссылка на общего бота и права can_reply.</p>
            </li>
            <li>
              <Link to="/app/playground" className="text-accent">
                Проверить ответ
              </Link>
              <p className="text-muted">До включения автоматизации.</p>
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            Кредиты: {data.creditsUsed} из {data.creditLimit}. Стиль {data.styleConfirmed ? "подтверждён" : "не задан"}.
          </p>
        </Card>
      </div>
    </div>
  );
}
