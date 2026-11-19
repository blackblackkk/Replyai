import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { draftReply, saveFeedback } from "@/lib/reply/api";
import { useWorkspace } from "@/lib/reply/use-workspace";
import type { ReplyResult } from "@/lib/reply/types";
import { Area, Button, Card, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/playground")({ component: PlaygroundPage });

function PlaygroundPage() {
  const { data, error, pending } = useWorkspace();
  const [inbound, setInbound] = useState("");
  const [thread, setThread] = useState("");
  const [result, setResult] = useState<ReplyResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(3);

  if (pending) return <p className="text-muted">Загрузка…</p>;
  if (error || !data) return <p className="text-accent">{error || "Нет данных"}</p>;

  async function run(nextInbound = inbound) {
    setBusy(true);
    try {
      setResult(await draftReply({ data: { inbound: nextInbound, thread } }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle
        kicker="Проверка"
        title="Ответ до автоматизации"
        text="Сообщение не сохраняется. С ключом Grok здесь ответ модели. Без ключа это шаблон из базы, не Grok."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Area label="Входящее" value={inbound} onChange={(e) => setInbound(e.target.value)} />
          <div className="mt-3">
            <Area label="Контекст теста, если нужен" value={thread} onChange={(e) => setThread(e.target.value)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void run()}>
              {busy ? "Собираем…" : "Собрать ответ"}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void run(`${inbound}\n\nКороче.`)}>
              Короче
            </Button>
            <Button type="button" variant="quiet" disabled={busy} onClick={() => void run(`${inbound}\n\nПодробнее, без новых фактов.`)}>
              Подробнее
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted">
            Лимит REPLY ответы не обрывает: их оплачивает xAI. Суточный потолок автоответов задаётся в «Автоответах».
          </p>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Результат</h2>
          {!result ? <p className="mt-3 text-sm text-muted">Здесь появится черновик или передача вам.</p> : null}
          {result ? (
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-muted">
                {result.provider === "grok" ? "Grok" : result.provider === "local" ? "Локальный черновик" : "Правила"} ·{" "}
                {result.action === "reply" ? "можно ответить" : "передать человеку"} · {result.reason}
              </p>
              <p className="whitespace-pre-wrap rounded-xl bg-bg p-3">{result.text || "Текста нет. Вопрос остаётся вам."}</p>
              <label className="block text-muted">
                Оценка 1–5
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="ml-2 w-16 rounded-lg border border-line bg-bg px-2 py-1 text-fg"
                />
              </label>
              <Area label="Замечание без цитаты переписки" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button
                type="button"
                variant="ghost"
                onClick={() => void saveFeedback({ data: { rating, note } }).then(() => setNote(""))}
              >
                Отправить оценку
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
