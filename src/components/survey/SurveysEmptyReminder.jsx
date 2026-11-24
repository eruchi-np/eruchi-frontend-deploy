import React, { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { sepSurveyAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  SURVEYS_EMPTY_FALLBACK_COPY,
  formatNextSurveyAvailableCopy,
} from "../../utils/nextSurveyCopy";
import {
  iosPushPromptAvailable,
  isIosDevice,
  isPushOptedIn,
  loginPushUser,
  requestPushSubscription,
} from "../../utils/pushClient";
import { reportPushOptIn } from "../../utils/pushOptIn";
import SurveyAvailableReminderDialog from "./SurveyAvailableReminderDialog";

/**
 * Empty-catalog countdown + Remind me. Shared by survey list and complete pages.
 * Remind me turns on notifications when this browser can show the prompt.
 * On iOS, if that click cannot show a prompt, it saves the email reminder instead.
 * The button is omitted once the email is saved or notifications are already on.
 */
export default function SurveysEmptyReminder({ copyClassName = "" }) {
  const { user } = useAuth();
  const [nextAvailableAt, setNextAvailableAt] = useState(null);
  const [reminderRequested, setReminderRequested] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const surveyTask = sepSurveyAPI
        .getNextAvailable({ skipErrorToast: true })
        .then((res) => {
          if (cancelled) return;
          const data = res.data?.data || {};
          setNextAvailableAt(data.nextAvailableAt || null);
          setReminderRequested(Boolean(data.reminderRequested));
        })
        .catch(() => {
          if (cancelled) return;
          setNextAvailableAt(null);
        });

      const pushTask = isPushOptedIn().then((optedIn) => {
        if (cancelled) return;
        setPushOn(optedIn);
        if (optedIn) reportPushOptIn(true);
      });

      const pushDeadline = new Promise((resolve) => {
        window.setTimeout(resolve, 5000);
      });

      await Promise.all([surveyTask, Promise.race([pushTask, pushDeadline])]);
      if (!cancelled) setLoading(false);
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
  const showButton = !loading && !reminderRequested && !pushOn;

  const saveEmailReminder = useCallback(async () => {
    await sepSurveyAPI.remindWhenAvailable({ skipErrorToast: true });
    setReminderRequested(true);
    setDialogOpen(true);
  }, []);

  const handleRemind = useCallback(async () => {
    if (busy || reminderRequested || pushOn) return;
    setBusy(true);
    setError("");
    try {
      if (isIosDevice()) {
        const canPrompt = await iosPushPromptAvailable();
        if (!canPrompt) {
          await saveEmailReminder();
          return;
        }
      }

      const externalId = String(user?.id || user?._id || "");
      if (externalId) await loginPushUser(externalId);

      const result = await requestPushSubscription();
      if (result.ok) {
        setPushOn(true);
        await reportPushOptIn(true);
        return;
      }

      if (result.reason === "denied") {
        setError("Notifications are blocked in this browser.");
        return;
      }
      if (result.reason === "declined") return;

      const iosMissedPrompt =
        isIosDevice() &&
        (result.reason === "ios_needs_homescreen" ||
          result.reason === "unsupported" ||
          result.reason === "not_configured");
      if (iosMissedPrompt) {
        await saveEmailReminder();
        return;
      }

      if (result.reason === "unsupported" || result.reason === "not_configured") {
        setError("Notifications are not available in this browser.");
        return;
      }
      setError("Could not enable notifications. Please try again.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save the reminder. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }, [busy, pushOn, reminderRequested, saveEmailReminder, user]);

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

      {showButton ? (
        <div className="mt-5">
          <button
            type="button"
            className="home-pill home-pill-sm home-pill-navy inline-flex items-center justify-center gap-2 disabled:opacity-65"
            disabled={busy}
            onClick={handleRemind}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Working…
              </>
            ) : (
              "Remind me"
            )}
          </button>
        </div>
      ) : null}

      <SurveyAvailableReminderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
