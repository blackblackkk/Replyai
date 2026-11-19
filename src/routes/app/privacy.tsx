import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { deleteReplyData } from "@/lib/reply/api";
import { Button, Card, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <PageTitle
        kicker="Данные"
        title="Что остаётся у REPLY"
        text="Аккаунт, база знаний, карточка стиля, права Telegram и счётчики. Не тексты диалогов."
      />
      <Card>
        <ul className="space-y-3 text-sm text-muted">
          <li>Входящее сообщение обрабатывается и забывается. В лог пишется код события, не текст.</li>
          <li>Черновик в режиме подтверждения уходит в ваш чат с ботом и в базу не кладётся.</li>
          <li>Пример переписки после разбора стиля не сохраняется. Нажмите подтверждение, если карточка верная.</li>
          <li>Ответ может уйти в Grok, если ключ модели задан. Это не анонимная обработка.</li>
          <li>Удаление ниже стирает знания, услуги, стиль, подключение и статистику этого аккаунта. Вход в аккаунт остаётся.</li>
        </ul>
        <Button
          className="mt-5"
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            if (!window.confirm("Удалить данные REPLY этого аккаунта?")) return;
            setBusy(true);
            void deleteReplyData()
              .then(() => setDone(true))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Удаляем…" : "Удалить данные REPLY"}
        </Button>
        {done ? <p className="mt-3 text-sm text-accent">Данные продукта удалены.</p> : null}
      </Card>
    </div>
  );
}
