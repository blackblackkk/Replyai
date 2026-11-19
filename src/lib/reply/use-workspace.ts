import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getWorkspace } from "./api";
import type { Workspace } from "./types";

export function useWorkspace() {
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    if (!user?.id) return;
    getWorkspace()
      .then((next) => {
        setData(next);
        setError(null);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить данные");
      });
  }, [user?.id]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, reload, setData, pending: isPending || (!data && !error) };
}
