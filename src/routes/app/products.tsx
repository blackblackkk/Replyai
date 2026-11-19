import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { deleteProduct, saveProduct } from "@/lib/reply/api";
import { useWorkspace } from "@/lib/reply/use-workspace";
import type { Product } from "@/lib/reply/types";
import { Area, Button, Card, Field, PageTitle } from "@/components/reply/ui";

export const Route = createFileRoute("/app/products")({ component: ProductsPage });

const BLANK: Product = {
  id: "",
  name: "",
  description: "",
  price: "",
  currency: "USD",
  terms: "",
  timeline: "",
  constraints: "",
  options: "",
  faqs: "",
};

function ProductsPage() {
  const { data, error, pending, setData } = useWorkspace();
  const [draft, setDraft] = useState<Product>(BLANK);
  const [saving, setSaving] = useState(false);

  if (pending) return <p className="text-muted">Загрузка…</p>;
  if (error || !data) return <p className="text-accent">{error || "Нет данных"}</p>;

  function edit(product: Product) {
    setDraft(product);
  }

  async function save() {
    setSaving(true);
    try {
      setData(await saveProduct({ data: draft }));
      setDraft(BLANK);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Не сохранилось");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageTitle
        kicker="Услуги"
        title="Продукты и условия"
        text="Пустая цена значит, что цены нет. Помощник не подставит свою."
      />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {data.products.length === 0 ? <p className="text-sm text-muted">Пока ни одной позиции.</p> : null}
          {data.products.map((product) => (
            <Card key={product.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{product.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {product.price ? `${product.price} ${product.currency}` : "Цена не указана"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-sm text-accent" onClick={() => edit(product)}>
                    Править
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted"
                    onClick={() => void deleteProduct({ data: product.id }).then(setData)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="font-display text-xl">{draft.id ? "Редактирование" : "Новая позиция"}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Название" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Field label="Цена" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            <Field label="Валюта" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} />
            <Field label="Срок" value={draft.timeline} onChange={(e) => setDraft({ ...draft, timeline: e.target.value })} />
            <div className="md:col-span-2">
              <Area label="Описание" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <Area label="Условия" value={draft.terms} onChange={(e) => setDraft({ ...draft, terms: e.target.value })} />
            <Area label="Ограничения" value={draft.constraints} onChange={(e) => setDraft({ ...draft, constraints: e.target.value })} />
            <Area label="Опции" value={draft.options} onChange={(e) => setDraft({ ...draft, options: e.target.value })} />
            <Area label="Вопросы по этой позиции" value={draft.faqs} onChange={(e) => setDraft({ ...draft, faqs: e.target.value })} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "Сохраняем…" : "Сохранить"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(BLANK)}>
              Сбросить
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
