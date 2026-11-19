import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { saveAutomation } from "@/lib/reply/api";
import { MODE_LABELS } from "@/lib/reply/labels";
import { useWorkspace } from "@/lib/reply/use-workspace";
import { AUTOMATION_MODES, type AutomationMode } from "@/lib/reply/types";
import { Area, Button, Card, Field, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/automation")({ component: AutomationPage });

function AutomationPage() {
  const { data, error, pending, setData } = useWorkspace();
  const [mode, setMode] = useState<AutomationMode>("suggest");
  const [enabled, setEnabled] = useState(false);
  const [dailyCap, setDailyCap] = useState(200);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [handoffNote, setHandoffNote] = useState("");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!data) return;
    setMode(data.automation.mode);
    setEnabled(data.automation.enabled);
    setDailyCap(data.automation.dailyCap);
    setQuietStart(data.automation.quietStart);
    setQuietEnd(data.automation.quietEnd);
    setHandoffNote(data.automation.handoffNote);
    setPaused(data.automation.paused);
  }, [data]);

  if (pending) return <p className="text-muted">Загрузка…</p>;
  if (error || !data) return <p className="text-accent">{error || "Нет данных"}</p>;

  return (
    <div>
      <PageTitle
        kicker="Автоответы"
        title="Когда писать самому"
        text="По умолчанию выключено. Даже включённый автоответ молчит без can_reply, вне 24 часов и на сообщениях владельца."
      />
      <Card>
        <label className="flex min-h-11 items-center justify-between gap-4 text-sm">
          <span>Разрешить обработку входящих</span>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          {AUTOMATION_MODES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`min-h-11 rounded-full border px-4 text-sm ${mode === item ? "border-primary bg-primary text-primary-fg" : "border-line text-muted"}`}
            >
              {MODE_LABELS[item]}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          Черновик приходит вам в чат с ботом и не пишется в базу. Автоответ уходит собеседнику от вашего имени через
          business_connection_id. Гибрид сам отвечает только на простые вопросы. Пустые часы значат «круглые сутки». Если указать интервал, вне него Grok не вызывается.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Лимит ответов в сутки" type="number" min={1} max={500} value={dailyCap} onChange={(e) => setDailyCap(Number(e.target.value))} />
          <Field label="Отвечать с, UTC" placeholder="09:00" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} />
          <Field label="Отвечать до, UTC" placeholder="18:00" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} />
        </div>
        <div className="mt-3">
          <Area label="Когда передавать человеку" value={handoffNote} onChange={(e) => setHandoffNote(e.target.value)} />
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
          Пауза, подключение Telegram не рвём
        </label>
        <Button
          className="mt-4"
          type="button"
          onClick={() =>
            void saveAutomation({
              data: { mode, enabled, dailyCap, quietStart, quietEnd, handoffNote, paused },
            }).then(setData)
          }
        >
          Сохранить режим
        </Button>
      </Card>
    </div>
  );
}
