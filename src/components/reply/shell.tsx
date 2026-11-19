import { Link, Outlet } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Mark } from "./ui";

const NAV = [
  { to: "/app", label: "Обзор", exact: true },
  { to: "/app/telegram", label: "Telegram" },
  { to: "/app/knowledge", label: "Знания" },
  { to: "/app/products", label: "Услуги" },
  { to: "/app/personality", label: "Стиль" },
  { to: "/app/rules", label: "Правила" },
  { to: "/app/playground", label: "Проверка" },
  { to: "/app/automation", label: "Автоответы" },
  { to: "/app/analytics", label: "Аналитика" },
  { to: "/app/billing", label: "Тариф" },
  { to: "/app/privacy", label: "Данные" },
] as const;

export function AppShell() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="min-h-screen bg-bg" />;
  }
  if (!user) return <RedirectToSignIn />;
  return (
    <div className="min-h-screen bg-bg text-fg md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line md:sticky md:top-0 md:h-screen md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link to="/" className="inline-flex">
            <Mark compact />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible md:px-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: "exact" in item ? item.exact : false }}
              className="block shrink-0 rounded-xl px-3 py-2 text-sm text-muted hover:bg-raised hover:text-fg"
              activeProps={{ className: "block shrink-0 rounded-xl bg-raised px-3 py-2 text-sm text-fg" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-end border-b border-line px-4 py-3 md:px-8">
          <UserButton />
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
