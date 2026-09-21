import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "./supabaseClient";
import { api, type Me } from "./api";

/** Redirects to /login if there's no session, then to /onboarding if the
 * profile isn't complete (no display name / consent not yet given), else
 * fetches /me. Shared by every authenticated page so both checks live in
 * exactly one place. */
export function useAuthedUser() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      try {
        const result = await api.me();
        setMe(result);
        const profileIncomplete = !result.display_name || !result.consent_accepted_at;
        if (profileIncomplete && pathname !== "/onboarding") {
          router.replace("/onboarding");
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { me, loading, error };
}
