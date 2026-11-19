import { createFileRoute, Link } from "@tanstack/react-router";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { Mark } from "@/components/reply/ui";

export const Route = createFileRoute("/")({ component: Home });

const POINTS = [
  {
    title: "Один бот на всю платформу",
    text: "Вы подключаете одного бота REPLY в «Настройки → Автоматизация чатов» и сами выбираете чаты. Отдельный бот через BotFather не нужен.",
  },
  {
    title: "Знает ваш бизнес, не архив",
    text: "Услуги, цены, условия и подтверждённый стиль. Текст переписки не складывается в базу.",
  },
  {
    title: "Сначала безопасный режим",
    text: "По умолчанию AI не пишет клиенту сам. Автоответ включается только явно и только при праве can_reply.",
  },
];

const STEPS = [
  { n: "01", title: "Описать дело", text: "Компания, услуги, цены, оплата, сроки, возражения." },
  { n: "02", title: "Подтвердить стиль", text: "Фрагмент переписки разбирается один раз. Исходник не сохраняется." },
  { n: "03", title: "Проверить черновик", text: "Песочница показывает, ответит модель или передаст вопрос вам." },
  { n: "04", title: "Автоматизация чатов", text: "Тот же бот добавляется в настройках Telegram. «Подключено» — только после подтверждения Telegram." },
];

const PLANS = [
  { name: "Free", price: "0", note: "Проверка продукта и небольшой запас кредитов." },
  { name: "Starter", price: "—", note: "Личный помощник с рабочей базой знаний." },
  { name: "Pro", price: "—", note: "Больше кредитов и несколько сценариев поведения." },
  { name: "Team", price: "—", note: "Общая база для команды. Оплата пока не подключена." },
];

const FAQ = [
  {
    q: "Бот читает всю старую историю?",
    a: "Нет. Telegram Business Bot не отдаёт архив чатов. Для стиля вы сами вставляете пример.",
  },
  {
    q: "Где лежат тексты диалогов?",
    a: "Нигде постоянно. Входящий текст живёт в памяти на время ответа. В аналитике только счётчики.",
  },
  {
    q: "Это полностью анонимно?",
    a: "Нет. Чтобы составить ответ, текст уходит выбранной модели. REPLY не обещает абсолютную анонимность и не пишет переписку в рекламные системы.",
  },
  {
    q: "Можно отвечать в любой чат?",
    a: "Нет. Список чатов задаёте вы в Telegram. Отправка возможна только с правом can_reply и в личном чате, где было входящее за последние 24 часа.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Mark />
        <nav className="flex items-center gap-2">
          <a href="#pricing" className="hidden px-3 py-2 text-sm text-muted sm:inline">
            Тарифы
          </a>
          <SignedOut>
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-fg">
              Войти
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-fg"
            >
              Создать аккаунт
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              to="/app"
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-fg"
            >
              Открыть кабинет
            </Link>
          </SignedIn>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="grid items-end gap-10 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="text-sm text-accent">Telegram Business · один бот платформы</p>
            <h1 className="mt-3 max-w-xl font-display text-5xl font-semibold leading-tight text-fg">
              Your conversations. Your style. Your AI.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              REPLY ведёт личные переписки в вашем тоне и по вашим условиям, пока вы заняты делом. Не архив
              чужих диалогов и не отдельный бот на каждого пользователя.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SignedOut>
                <Link
                  to="/signup"
                  className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-fg"
                >
                  Начать
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/app"
                  className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-fg"
                >
                  В кабинет
                </Link>
              </SignedIn>
              <a
                href="#how"
                className="inline-flex min-h-11 items-center rounded-xl border border-line px-5 text-sm text-fg"
              >
                Как это устроено
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Пример решения, не живой чат</p>
            <p className="mt-4 text-sm text-muted">Входящее</p>
            <p className="mt-1 rounded-xl bg-bg px-3 py-3 text-sm">Пришлите прайс на аудит и скидку, если оплатим сегодня.</p>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-4 border-t border-line pt-3">
                <span className="text-muted">Цена в базе</span>
                <span>нет</span>
              </li>
              <li className="flex justify-between gap-4 border-t border-line pt-3">
                <span className="text-muted">Правило скидок</span>
                <span>не предлагать</span>
              </li>
              <li className="flex justify-between gap-4 border-t border-line pt-3">
                <span className="text-muted">Решение</span>
                <span className="text-accent">передать вам</span>
              </li>
            </ol>
            <p className="mt-4 text-sm text-muted">
              Модель не дописывает сумму, которой вы не задавали. Сложный вопрос остаётся у человека.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {POINTS.map((item) => (
            <article key={item.title} className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="font-display text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.text}</p>
            </article>
          ))}
        </section>

        <section id="how" className="mt-16">
          <h2 className="font-display text-3xl font-semibold">От знаний к ответу</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {STEPS.map((step) => (
              <article key={step.n} className="rounded-2xl border border-line p-4">
                <p className="font-display text-accent">{step.n}</p>
                <h3 className="mt-2 font-display text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 rounded-2xl border border-line bg-surface p-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">Your conversations stay yours.</h2>
            <p className="mt-3 text-muted">
              Мы не строим архив личных переписок, не показываем диалоги сотрудникам платформы и не кормим ими
              общую модель. Для ответа текст всё же уходит провайдеру модели — это сказано прямо, без обещания
              абсолютной анонимности.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="border-t border-line pt-3">Входящий текст не пишется в таблицы и логи.</li>
            <li className="border-t border-line pt-3">Референс удаляется после извлечения стиля.</li>
            <li className="border-t border-line pt-3">Аналитика хранит количества, не содержание.</li>
            <li className="border-t border-line pt-3">Кабинет изолирован по вашему аккаунту.</li>
          </ul>
        </section>

        <section id="pricing" className="mt-16">
          <h2 className="font-display text-3xl font-semibold">Тарифы</h2>
          <p className="mt-2 max-w-xl text-muted">Оплата не подключена. В кабинете можно выбрать профиль лимитов, это не покупка.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {PLANS.map((plan) => (
              <article key={plan.name} className="rounded-2xl border border-line p-4">
                <h3 className="font-display text-xl">{plan.name}</h3>
                <p className="mt-3 font-display text-3xl">{plan.price}</p>
                <p className="mt-3 text-sm text-muted">{plan.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl font-semibold">Вопросы</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <article key={item.q} className="grid gap-2 py-4 md:grid-cols-[1fr_1.4fr]">
                <h3 className="font-medium">{item.q}</h3>
                <p className="text-sm text-muted">{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
