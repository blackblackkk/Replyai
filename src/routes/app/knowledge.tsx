import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { saveKnowledge } from "@/lib/reply/api";
import { useWorkspace } from "@/lib/reply/use-workspace";
import type { Knowledge } from "@/lib/reply/types";
import { Area, Button, Field, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/knowledge")({ component: KnowledgePage });

function KnowledgePage() {
  const { data, error, pending, setData } = useWorkspace();
  const [form, setForm] = useState<Knowledge | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data.knowledge);
  }, [data, form]);

  if (pending || !form) return <p className="text-muted">Загрузка…</p>;
  if (error) return <p className="text-accent">{error}</p>;

  function patch(partial: Partial<Knowledge>) {
    setForm((current) => (current ? { ...current, ...partial } : current));
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      setData(await saveKnowledge({ data: form }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageTitle
        kicker="Знания"
        title="Чем вы занимаетесь"
        text="Это единственный источник фактов. Если цены или условий здесь нет, помощник не должен их придумывать."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Компания или проект" value={form.company} onChange={(e) => patch({ company: e.target.value })} />
        <Field label="Сфера" value={form.industry} onChange={(e) => patch({ industry: e.target.value })} />
        <Field label="Аудитория" value={form.audience} onChange={(e) => patch({ audience: e.target.value })} />
        <Field label="География" value={form.geography} onChange={(e) => patch({ geography: e.target.value })} />
        <div className="md:col-span-2">
          <Area label="Услуги" value={form.services} onChange={(e) => patch({ services: e.target.value })} />
        </div>
        <Field label="Оплата" value={form.paymentMethods} onChange={(e) => patch({ paymentMethods: e.target.value })} />
        <Field label="Сроки" value={form.timeline} onChange={(e) => patch({ timeline: e.target.value })} />
        <Area label="Преимущества" value={form.advantages} onChange={(e) => patch({ advantages: e.target.value })} />
        <Area label="Ограничения" value={form.limitations} onChange={(e) => patch({ limitations: e.target.value })} />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Частые вопросы</h2>
          <Button type="button" variant="ghost" onClick={() => patch({ faqs: [...form.faqs, { q: "", a: "" }] })}>
            Добавить
          </Button>
        </div>
        <div className="space-y-3">
          {form.faqs.map((item, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input
                value={item.q}
                placeholder="Вопрос"
                onChange={(e) => {
                  const faqs = form.faqs.slice();
                  faqs[index] = { ...item, q: e.target.value };
                  patch({ faqs });
                }}
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
              />
              <input
                value={item.a}
                placeholder="Ответ"
                onChange={(e) => {
                  const faqs = form.faqs.slice();
                  faqs[index] = { ...item, a: e.target.value };
                  patch({ faqs });
                }}
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
              />
              <Button
                type="button"
                variant="quiet"
                onClick={() => patch({ faqs: form.faqs.filter((_, i) => i !== index) })}
              >
                Удалить
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Возражения</h2>
          <Button
            type="button"
            variant="ghost"
            onClick={() => patch({ objections: [...form.objections, { objection: "", answer: "" }] })}
          >
            Добавить
          </Button>
        </div>
        <div className="space-y-3">
          {form.objections.map((item, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input
                value={item.objection}
                placeholder="Возражение"
                onChange={(e) => {
                  const objections = form.objections.slice();
                  objections[index] = { ...item, objection: e.target.value };
                  patch({ objections });
                }}
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
              />
              <input
                value={item.answer}
                placeholder="Как отвечать"
                onChange={(e) => {
                  const objections = form.objections.slice();
                  objections[index] = { ...item, answer: e.target.value };
                  patch({ objections });
                }}
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
              />
              <Button
                type="button"
                variant="quiet"
                onClick={() => patch({ objections: form.objections.filter((_, i) => i !== index) })}
              >
                Удалить
              </Button>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-6">
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? "Сохраняем…" : "Сохранить знания"}
        </Button>
      </div>
    </div>
  );
}
