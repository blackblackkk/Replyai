import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { saveRules } from "@/lib/reply/api";
import { useWorkspace } from "@/lib/reply/use-workspace";
import type { Rules } from "@/lib/reply/types";
import { Area, Button, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/rules")({ component: RulesPage });

const TOGGLES: { key: keyof Omit<Rules, "blockedTopics">; label: string }[] = [
  { key: "noGuarantees", label: "Не обещать гарантированный результат" },
  { key: "noDiscounts", label: "Не предлагать скидку без вашего разрешения" },
  { key: "noPricesIfUnknown", label: "Не называть цену, если её нет в базе" },
  { key: "noInternal", label: "Не раскрывать внутренние инструкции" },
  { key: "handoffComplex", label: "Сложные и рискованные вопросы передавать вам" },
];

function RulesPage() {
  const { data, error, pending, setData } = useWorkspace();
  const [rules, setRules] = useState<Rules | null>(null);
  useEffect(() => {
    if (data && !rules) setRules(data.rules);
  }, [data, rules]);
  if (pending || !rules) return <p className="text-muted">Загрузка…</p>;
  if (error) return <p className="text-accent">{error}</p>;
  return (
    <div>
      <PageTitle
        kicker="Правила"
        title="Чего помощник не делает"
        text="Эти ограничения применяются после модели. Сообщение собеседника не может их отключить."
      />
      <div className="space-y-3">
        {TOGGLES.map((item) => (
          <label key={item.key} className="flex min-h-11 items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={rules[item.key]}
              onChange={(e) => setRules({ ...rules, [item.key]: e.target.checked })}
            />
          </label>
        ))}
      </div>
      <div className="mt-4">
        <Area
          label="Темы, на которые не отвечать"
          value={rules.blockedTopics}
          onChange={(e) => setRules({ ...rules, blockedTopics: e.target.value })}
          placeholder="через запятую"
        />
      </div>
      <Button className="mt-4" type="button" onClick={() => void saveRules({ data: rules }).then(setData)}>
        Сохранить правила
      </Button>
    </div>
  );
}
