import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { analyzeReference, clearStyle, confirmStyle, savePersonality } from "@/lib/reply/api";
import { PERSONALITY_LABELS } from "@/lib/reply/labels";
import { useWorkspace } from "@/lib/reply/use-workspace";
import { PERSONALITIES, type Personality, type StyleProfile } from "@/lib/reply/types";
import { Area, Button, Card, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/personality")({ component: PersonalityPage });

function PersonalityPage() {
  const { data, error, pending, setData } = useWorkspace();
  const [personality, setPersonality] = useState<Personality>("business");
  const [instructions, setInstructions] = useState("");
  const [sample, setSample] = useState("");
  const [draft, setDraft] = useState<StyleProfile | null>(null);
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setPersonality(data.personality);
    setInstructions(data.customInstructions);
  }, [data]);

  if (pending) return <p className="text-muted">Загрузка…</p>;
  if (error || !data) return <p className="text-accent">{error || "Нет данных"}</p>;

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setSample(text.slice(0, 20000));
  }

  return (
    <div>
      <PageTitle
        kicker="Стиль"
        title="Как звучите вы"
        text="Референс уходит в разбор и не записывается. Сохраняется только короткая карточка стиля после вашего подтверждения."
      />
      <Card>
        <div className="flex flex-wrap gap-2">
          {PERSONALITIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPersonality(item)}
              className={`min-h-11 rounded-full border px-4 text-sm ${personality === item ? "border-primary bg-primary text-primary-fg" : "border-line text-muted"}`}
            >
              {PERSONALITY_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Area label="Свои инструкции" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </div>
        <Button
          className="mt-4"
          type="button"
          onClick={() => void savePersonality({ data: { personality, customInstructions: instructions } }).then(setData)}
        >
          Сохранить поведение
        </Button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-xl">Пример переписки</h2>
        <p className="mt-2 text-sm text-muted">
          Вставьте текст или загрузите .txt. Экспорт Telegram целиком не разбирается как история чатов: бот её не
          видит, а сырой файл мы не храним.
        </p>
        <div className="mt-4">
          <Area label="Фрагмент" value={sample} onChange={(e) => setSample(e.target.value)} />
        </div>
        <input
          type="file"
          accept=".txt,text/plain"
          className="mt-3 block text-sm text-muted"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button
          className="mt-4"
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            analyzeReference({ data: sample })
              .then((result) => {
                setDraft(result.profile);
                setProvider(result.provider);
                setSample("");
              })
              .catch((reason: unknown) => {
                window.alert(reason instanceof Error ? reason.message : "Разбор не вышел");
              })
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Разбираем…" : "Разобрать и стереть исходник"}
        </Button>
        {draft ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-muted">Источник: {provider === "grok" ? "Grok, один проход" : "локальные эвристики, без внешней модели"}.</p>
            {(Object.keys(draft) as (keyof StyleProfile)[]).map((key) => (
              <label key={key} className="block">
                <span className="text-muted">{key}</span>
                <input
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2"
                />
              </label>
            ))}
            <Button type="button" onClick={() => void confirmStyle({ data: draft }).then(setData)}>
              Подтвердить и сохранить профиль
            </Button>
          </div>
        ) : null}
        {data.styleConfirmed && data.style ? (
          <p className="mt-4 text-sm text-muted">
            Сохранённый стиль: {data.style.length}, {data.style.lexicon}.{" "}
            <button type="button" className="text-accent" onClick={() => void clearStyle().then(setData)}>
              Удалить профиль
            </button>
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">Подтверждённого профиля нет.</p>
        )}
      </Card>
    </div>
  );
}
