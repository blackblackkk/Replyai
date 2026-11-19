import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createTelegramLink, refreshTelegram, saveAutomation, setChatPolicy, setPlatformBot } from "@/lib/reply/api";
import { useWorkspace } from "@/lib/reply/use-workspace";
import { Button, Card, Field, PageTitle, Status } from "@/components/reply/ui";

export const Route = createFileRoute("/app/telegram")({ component: TelegramPage });

function TelegramPage() {
  const { data, error, pending, setData } = useWorkspace();
  const [link, setLink] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [xaiKey, setXaiKey] = useState("");
  const [savingBot, setSavingBot] = useState(false);

  if (pending) return <p className="text-muted">Загрузка…</p>;
  if (error || !data) return <p className="text-accent">{error || "Нет данных"}</p>;

  const bot = data.telegram.botUsername;

  async function connect() {
    setNotice("");
    const result = await createTelegramLink();
    if (!result.ok) {
      setNotice("Сначала администратор сохраняет токен Bot API. Без него ссылка не создаётся.");
      setLink(null);
      return;
    }
    setLink(result.url);
  }

  async function refresh() {
    setNotice("");
    const result = await refreshTelegram();
    if (!result.ok) {
      setNotice(
        result.reason === "no_connection"
          ? "Telegram ещё не прислал подключение из «Автоматизация чатов»."
          : result.reason === "bot_not_configured"
            ? "Нет токена Bot API. Его задаёт администратор."
            : "Не удалось спросить Telegram. Статус не изменён.",
      );
      return;
    }
    setData(result.workspace);
  }

  async function pause(next: boolean) {
    const ws = await saveAutomation({
      data: { ...data!.automation, paused: next },
    });
    setData(ws);
  }

  async function saveBot() {
    setSavingBot(true);
    setNotice("");
    try {
      setData(await setPlatformBot({ data: { username, token, xaiKey } }));
      setUsername("");
      setToken("");
      setXaiKey("");
      setNotice("API сохранён. Токен больше не показывается. Webhook включается на публичном https-адресе.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Имя бота не сохранилось");
    } finally {
      setSavingBot(false);
    }
  }

  return (
    <div>
      <PageTitle
        kicker="Telegram"
        title="Бот для автоматизации чатов"
        text="Один бот REPLY на всю платформу. Его добавляют в Настройки → Автоматизация чатов. Свой бот в BotFather создавать не нужно."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Status ok={Boolean(bot)}>{bot ? `@${bot}` : "Бот не указан"}</Status>
        <Status ok={data.telegram.apiConfigured}>{data.telegram.apiConfigured ? "Bot API подключён" : "Bot API нет"}</Status>
        <Status ok={data.telegram.aiConfigured}>{data.telegram.aiConfigured ? "Grok API" : "Без Grok"}</Status>
        <Status ok={data.telegram.linked}>{data.telegram.linked ? "Аккаунт привязан" : "Аккаунт не привязан"}</Status>
        <Status ok={data.telegram.connected}>{data.telegram.connected ? "Подключено" : "Не подключено"}</Status>
        <Status ok={data.telegram.canReply}>{data.telegram.canReply ? "Может отвечать" : "Права ответа нет"}</Status>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="font-display text-xl">{bot ? `@${bot}` : "Укажите бота"}</h2>
          <p className="mt-2 text-sm text-muted">
            Этот username вставляется в автоматизацию чатов. Подключение считается настоящим только после события Telegram.
          </p>
          {bot ? (
            <a
              className="mt-4 inline-flex min-h-11 items-center text-sm text-accent"
              href={`https://t.me/${bot}`}
              target="_blank"
              rel="noreferrer"
            >
              Открыть @{bot}
            </a>
          ) : null}
          <ol className="mt-4 space-y-3 text-sm text-muted">
            <li>
              <span className="text-fg">1. </span>
              Откройте ссылку привязки и нажмите Start. Так REPLY узнает, чей это Telegram.
            </li>
            <li>
              <span className="text-fg">2. </span>
              В Telegram: Настройки → Автоматизация чатов.
            </li>
            <li>
              <span className="text-fg">3. </span>
              Вставьте {bot ? `@${bot}` : "username бота"} и нажмите «Добавить».
            </li>
            <li>
              <span className="text-fg">4. </span>
              Выберите чаты: все личные, кроме исключений, или только выбранные. Включите право отвечать.
            </li>
            <li>
              <span className="text-fg">5. </span>
              Вернитесь сюда и обновите статус.
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void connect()} disabled={!bot || !data.telegram.apiConfigured}>
              Ссылка для привязки
            </Button>
            <Button type="button" variant="ghost" onClick={() => void refresh()}>
              Обновить статус из Telegram
            </Button>
            <Button type="button" variant="quiet" onClick={() => void pause(!data.automation.paused)}>
              {data.automation.paused ? "Снять паузу AI" : "Поставить AI на паузу"}
            </Button>
          </div>
          {notice ? <p className="mt-4 text-sm text-accent">{notice}</p> : null}
          {link ? (
            <p className="mt-4 break-all text-sm">
              <a className="text-accent" href={link} target="_blank" rel="noreferrer">
                {link}
              </a>
            </p>
          ) : null}
          {data.telegram.isAdmin ? (
            <ApiForm
              title="Админка"
              text="Токен Bot API и ключ Grok видите только вы. Другие аккаунты подключают этого бота и не задают свой."
              username={username}
              token={token}
              xaiKey={xaiKey}
              saving={savingBot}
              requireToken={false}
              submit="Сохранить API"
              onUsername={setUsername}
              onToken={setToken}
              onXai={setXaiKey}
              onSave={() => void saveBot()}
            />
          ) : null}
          {!data.telegram.adminClaimed ? (
            <ApiForm
              title="Стать администратором"
              text="Вставьте токен из BotFather. Этот аккаунт получит админку. Остальные смогут только подключить бота в автоматизации чатов. Ключ xAI нужен, только если ответы пишет Grok. Без него остаётся локальный режим."
              username={username}
              token={token}
              xaiKey={xaiKey}
              saving={savingBot}
              requireToken={false}
              submit="Сохранить API"
              onUsername={setUsername}
              onToken={setToken}
              onXai={setXaiKey}
              onSave={() => void saveBot()}
            />
          ) : null}
          {data.telegram.adminClaimed && !data.telegram.isAdmin ? (
            <p className="mt-4 text-sm text-muted">Своего бота здесь завести нельзя. Подключается только бот администратора.</p>
          ) : null}
          <p className="mt-3 text-sm text-muted">
            У бота в BotFather должен быть включён Business Mode. Токен проверяется через Telegram и на сайте больше не показывается.
            {data.telegram.apiConfigured && !data.telegram.webhookReady
              ? " Webhook включится после публикации на https."
              : ""}
          </p>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Права и чаты</h2>
          <p className="mt-2 text-sm text-muted">
            Список чатов и исключений задаётся в автоматизации чатов. Здесь только то, что Telegram уже прислал, без текстов.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.keys(data.telegram.rights).length === 0 ? (
              <li className="text-muted">Права появятся вместе с подключением.</li>
            ) : (
              Object.entries(data.telegram.rights).map(([key, value]) => (
                <li key={key} className="flex justify-between gap-3 border-t border-line pt-2">
                  <span>{key}</span>
                  <span className="text-muted">{value ? "да" : "нет"}</span>
                </li>
              ))
            )}
          </ul>
          <h3 className="mt-6 text-sm text-muted">Чаты, которые бот уже видел</h3>
          <ul className="mt-3 space-y-2">
            {data.chats.length === 0 ? <li className="text-sm text-muted">Пока ни одного.</li> : null}
            {data.chats.map((chat) => (
              <li key={chat.chatId} className="flex items-center justify-between gap-3 text-sm">
                <span>{chat.titleHint || chat.chatId}</span>
                <button
                  type="button"
                  className="text-accent"
                  onClick={() =>
                    void setChatPolicy({ data: { chatId: chat.chatId, allowAuto: !chat.allowAuto } }).then(setData)
                  }
                >
                  {chat.allowAuto ? "Автоответ разрешён" : "Исключён"}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ApiForm({
  title,
  text,
  username,
  token,
  xaiKey,
  saving,
  requireToken,
  submit,
  onUsername,
  onToken,
  onXai,
  onSave,
}: {
  title: string;
  text: string;
  username: string;
  token: string;
  xaiKey: string;
  saving: boolean;
  requireToken: boolean;
  submit: string;
  onUsername: (value: string) => void;
  onToken: (value: string) => void;
  onXai: (value: string) => void;
  onSave: () => void;
}) {
  const ready = (!requireToken || token.trim().length > 0) && (token.trim() || xaiKey.trim() || username.trim());
  return (
    <div className="mt-5 rounded-xl border border-line bg-bg p-4">
      <h3 className="font-display text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
      <div className="mt-3 grid gap-3">
        <Field label="Токен Bot API" type="password" autoComplete="off" placeholder="123456:AA..." value={token} onChange={(event) => onToken(event.target.value)} />
        <Field label="Username, если хотите сверить" placeholder="reply_ai_bot" value={username} onChange={(event) => onUsername(event.target.value)} />
        <Field label="Ключ xAI, необязательно" type="password" autoComplete="off" placeholder="xai-..." value={xaiKey} onChange={(event) => onXai(event.target.value)} />
        <Button type="button" variant="quiet" disabled={saving || !ready} onClick={onSave}>
          {saving ? "Проверяем…" : submit}
        </Button>
      </div>
    </div>
  );
}
