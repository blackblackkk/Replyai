import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Mark } from "@/components/reply/ui";

export const Route = createFileRoute("/recover")({ component: Recover });

function Recover() {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4 py-10 text-fg">
      <div className="w-full max-w-md space-y-5">
        <Link to="/" className="inline-flex">
          <Mark />
        </Link>
        <h1 className="font-display text-3xl font-semibold">Вернуть доступ</h1>
        <p className="text-sm text-muted">
          Письма со ссылкой для сброса пароля не отправляются: у платформы нет почтового провайдера, и мы не
          делаем вид, что письмо ушло. Если входили через Google или X, откройте тот же способ. Пароль почты
          восстановить здесь нельзя — создайте доступ через провайдера или войдите с текущим паролем.
        </p>
        {authEnabled
          ? GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                onClick={() => void signIn(provider.providerId, { callbackURL: "/app" })}
                className="flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface text-sm hover:border-accent"
              >
                Войти через {provider.label}
              </button>
            ))
          : null}
        <Link to="/login" className="inline-flex text-sm text-fg underline-offset-4 hover:underline">
          Назад ко входу
        </Link>
      </div>
    </main>
  );
}
