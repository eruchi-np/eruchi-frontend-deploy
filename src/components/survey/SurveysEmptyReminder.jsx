import React, { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { sepSurveyAPI } from "../../services/api";
import {
  SURVEYS_EMPTY_FALLBACK_COPY,
  formatNextSurveyAvailableCopy,
} from "../../utils/nextSurveyCopy";
import SurveyAvailableReminderDialog from "./SurveyAvailableReminderDialog";

/**
 * Empty-catalog countdown + Remind me. Shared by survey list and complete pages.
 */
export default function SurveysEmptyReminder({ copyClassName = "" }) {
  const [nextAvailableAt, setNextAvailableAt] = useState(null);
  const [reminderRequested, setReminderRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await sepSurveyAPI.getNextAvailable({ skipErrorToast: true });
        if (cancelled) return;
        const data = res.data?.data || {};
        setNextAvailableAt(data.nextAvailableAt || null);
        setReminderRequested(Boolean(data.reminderRequested));
      } catch {
        if (cancelled) return;
        setNextAvailableAt(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!nextAvailableAt) return undefined;
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [nextAvailableAt]);

  const countdown = formatNextSurveyAvailableCopy(
    nextAvailableAt,
    new Date(nowTick)
  );
  const copy = countdown || SURVEYS_EMPTY_FALLBACK_COPY;

  const handleRemind = useCallback(async () => {
    if (busy || reminderRequested) return;
    setBusy(true);
    setError("");
    try {
      await sepSurveyAPI.remindWhenAvailable({ skipErrorToast: true });
      setReminderRequested(true);
      setDialogOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save the reminder. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }, [busy, reminderRequested]);

  return (
    <>
      {!loading ? (
        <p className={copyClassName}>{copy}</p>
      ) : (
        <p className={copyClassName} aria-hidden="true">
          &nbsp;
        </p>
      )}

      {error ? (
        <p className="mt-3 text-sm text-[#be123c]">{error}</p>
      ) : null}

      <div className="mt-5">
        <button
          type="button"
          className="home-pill home-pill-sm home-pill-navy inline-flex items-center justify-center gap-2 disabled:opacity-65"
          disabled={busy || reminderRequested}
          onClick={handleRemind}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving…
            </>
          ) : reminderRequested ? (
            "Reminder set"
          ) : (
            "Remind me"
          )}
        </button>
      </div>

      <SurveyAvailableReminderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
