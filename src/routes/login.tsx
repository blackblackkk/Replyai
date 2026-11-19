import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { authClient, authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { Mark } from "@/components/reply/ui";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await authClient.signIn.email({ email, password, callbackURL: "/app" });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Не удалось войти");
      return;
    }
    void navigate({ to: "/app" });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4 py-10 text-fg">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="inline-flex">
          <Mark />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-semibold">Вход</h1>
          <p className="mt-2 text-sm text-muted">Google, X или почта и пароль этого аккаунта.</p>
        </div>
        {authEnabled ? (
          <>
            <div className="space-y-2">
              {GROK_PROVIDERS.map((provider) => (
                <button
                  key={provider.providerId}
                  type="button"
                  onClick={() => void signIn(provider.providerId, { callbackURL: "/app" })}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface text-sm hover:border-accent"
                >
                  Продолжить с {provider.label}
                </button>
              ))}
            </div>
            <form onSubmit={(event) => void onSubmit(event)} className="space-y-3">
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">Почта</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-fg outline-none focus:border-primary"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">Пароль</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-fg outline-none focus:border-primary"
                />
              </label>
              {error ? <p className="text-sm text-accent">{error}</p> : null}
              <button
                type="submit"
                disabled={pending}
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-fg disabled:opacity-50"
              >
                {pending ? "Входим…" : "Войти"}
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-muted">Вход сейчас выключен.</p>
        )}
        <p className="text-sm text-muted">
          Нет аккаунта?{" "}
          <Link to="/signup" className="text-fg underline-offset-4 hover:underline">
            Регистрация
          </Link>
          {" · "}
          <Link to="/recover" className="text-fg underline-offset-4 hover:underline">
            Доступ
          </Link>
        </p>
      </div>
    </main>
  );
}
