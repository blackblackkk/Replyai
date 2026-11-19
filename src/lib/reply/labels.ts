export const EVENT_LABELS: Record<string, string> = {
  account_linked: "Аккаунт Telegram привязан",
  connection_updated: "Business-подключение обновлено",
  connection_disabled: "Business-подключение выключено",
  inbound_observed: "Входящее принято, автоответ выключен",
  inbound_owner: "Сообщение владельца, ответ не нужен",
  inbound_non_text: "Не текстовое сообщение, без автоответа",
  reply_sent: "Ответ отправлен",
  reply_suggested: "Черновик отправлен владельцу в бот",
  handoff: "Диалог передан человеку",
  reply_skipped_cap: "Лимит ответов исчерпан",
  reply_skipped_rights: "Нет права can_reply",
  reply_skipped_window: "Чат вне 24-часового окна",
  reply_skipped_hours: "Вне рабочих часов",
  reply_skipped_chat: "Чат исключён в REPLY",
  reply_failed: "Telegram не принял отправку",
  message_edited: "Сообщение изменено",
  messages_deleted: "Сообщения удалены",
  plan_changed: "Тарифный профиль изменён",
  style_saved: "Профиль стиля сохранён",
  knowledge_saved: "База знаний обновлена",
  platform_bot_set: "Задан бот для автоматизации чатов",
  automation_changed: "Настройки автоответа изменены",
};

export const PERSONALITY_LABELS: Record<string, string> = {
  friendly: "Дружелюбный",
  business: "Деловой",
  informal: "Неформальный",
  confident: "Уверенный",
  brief: "Краткий",
  detailed: "Подробный",
  selling: "Продающий",
};

export const MODE_LABELS: Record<string, string> = {
  suggest: "Только черновик",
  auto: "Автоответ",
  hybrid: "Гибрид",
};
