import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { secAPI } from '../../services/api';
import ConfirmSame, { valuesMatch } from '../demographics/ConfirmSame';
import {
  confirmSameOffer,
  initialScreenId,
  needsProfessionalSoftCheck,
  nextQuestion,
  pruneAnswers,
  progressFraction,
  questionById,
  questionText,
  screenIdsFor,
  screenList,
  visibleIds,
  visibleOptions,
} from '../../utils/secClient';
import { clearSecDraft, loadSecDraft, saveSecDraft } from '../../utils/secDraft';
import '../onboarding/onboarding.css';

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `sec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function OptionPill({ label, help, selected, onClick }) {
  return (
    <button
      type="button"
      className={`onboard-pill ${selected ? 'is-on' : ''}`}
      onClick={onClick}
      style={{ flexDirection: 'column', alignItems: 'flex-start', height: 'auto', minHeight: 52 }}
    >
      <span>{label}</span>
      {help ? (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginTop: 4 }}>
          {help}
        </span>
      ) : null}
    </button>
  );
}

const NO_ADULT_MSG =
  'Please check this. Someone aged 16 or older should be counted in the household. If you live there, include yourself.';

function questionHeading(id, text) {
  if (id !== 'EDU_F' || typeof text !== 'string') return text;
  const parts = text.split(/(women)/i);
  return parts.map((part, i) => (
    /^women$/i.test(part) ? (
      <strong key={i} style={{ fontWeight: 900, letterSpacing: '0.04em' }}>WOMEN</strong>
    ) : (
      part
    )
  ));
}

const SecSurvey = ({ mode = 'first', onComplete }) => {
  const isRefresh = mode === 'refresh';
  const isEdit = mode === 'edit';
  const [spec, setSpec] = useState(null);
  const [answers, setAnswers] = useState({});
  const [prevAnswers, setPrevAnswers] = useState(null);
  const [prevVersion, setPrevVersion] = useState(null);
  const [confirmed, setConfirmed] = useState({});
  const [softCheck, setSoftCheck] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editCursor, setEditCursor] = useState(0);
  const startedAtRef = useRef(new Date().toISOString());
  const submittingRef = useRef(false);
  const [stepId, setStepId] = useState(null);
  const stepPinned = useRef(false);
  const questionAnchorRef = useRef(null);
  const skipQuestionScroll = useRef(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const qRes = await secAPI.getQuestionnaire({ skipErrorToast: true });
        if (cancel) return;
        const questionnaire = qRes.data;
        setSpec(questionnaire);

        let serverAnswers = null;
        if (isRefresh || isEdit) {
          try {
            const cur = await secAPI.getCurrent({ skipErrorToast: true });
            if (cancel) return;
            setPrevAnswers(cur.data.answers || {});
            setPrevVersion(cur.data.instrument_version);
            serverAnswers = cur.data.answers || {};
          } catch {
            /* first-time from edit list */
          }
        }

        const draft = loadSecDraft(mode);
        if (
          draft
          && draft.instrument_version === questionnaire.instrument_version
          && Object.keys(draft.answers || {}).length
        ) {
          setAnswers(draft.answers);
          if (draft.startedAt) startedAtRef.current = draft.startedAt;
          if (isEdit && draft.editCursor != null) setEditCursor(draft.editCursor);
        } else if (isEdit && serverAnswers) {
          setAnswers({ ...serverAnswers });
        }
      } catch {
        toast.error('Could not load the household survey.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [isRefresh, isEdit, mode]);

  useEffect(() => {
    if (!spec || loading) return undefined;
    const timer = setTimeout(() => {
      saveSecDraft(mode, {
        answers,
        startedAt: startedAtRef.current,
        instrument_version: spec.instrument_version,
        editCursor,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [answers, editCursor, spec, mode, loading]);

  const visible = useMemo(() => (spec ? visibleIds(spec, answers) : []), [spec, answers]);
  const unanswered = useMemo(() => (spec ? nextQuestion(spec, answers) : null), [spec, answers]);
  const screens = useMemo(
    () => (spec ? screenList(spec, answers) : []),
    [spec, answers]
  );

  useEffect(() => {
    if (!spec || loading || isEdit || stepPinned.current) return;
    stepPinned.current = true;
    setStepId(initialScreenId(spec, answers));
  }, [spec, loading, isEdit, answers]);

  const qid = useMemo(() => {
    if (!spec) return null;
    if (isEdit) {
      // Walk every visible screen even when answers are already filled.
      return screens[editCursor] || null;
    }
    // Stay on a tick-all question after the first selection. Continue moves on.
    if (stepId && screens.includes(stepId)) return stepId;
    if (unanswered) return unanswered;
    return screens[screens.length - 1] || null;
  }, [spec, isEdit, screens, editCursor, stepId, unanswered]);

  useEffect(() => {
    if (!qid) return undefined;
    if (skipQuestionScroll.current) {
      skipQuestionScroll.current = false;
      return undefined;
    }
    const el = questionAnchorRef.current;
    if (!el) return undefined;
    // The Continue button stays focused. Some phones then keep that button
    // in view, so the new question heading never reaches the top.
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    const scroll = () => {
      el.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
    };
    scroll();
    const frame = window.requestAnimationFrame(scroll);
    return () => window.cancelAnimationFrame(frame);
  }, [qid]);

  const screenIds = qid ? screenIdsFor(qid) : [];
  const progress = spec
    ? (isEdit
      ? Math.min(1, (editCursor + 1) / Math.max(1, visible.length))
      : progressFraction(spec, answers))
    : 0;
  const allowConfirm = isRefresh
    && prevAnswers
    && prevVersion
    && spec
    && prevVersion === spec.instrument_version;

  const setAnswer = (id, value) => {
    setError('');
    setConfirmed((prev) => ({ ...prev, [id]: false }));
    setAnswers((prev) => pruneAnswers(spec, { ...prev, [id]: value }));
  };

  const toggleMulti = (id, code, exclusive) => {
    const current = Array.isArray(answers[id]) ? [...answers[id]] : [];
    let next;
    if (exclusive) {
      next = current.includes(code) ? [] : [code];
    } else {
      next = current.filter((c) => c !== 'NEITHER');
      if (next.includes(code)) next = next.filter((c) => c !== code);
      else next.push(code);
    }
    setAnswer(id, next);
  };

  const screenReady = () => {
    if (!spec || !qid) return false;
    for (const id of screenIds) {
      const q = questionById(spec, id);
      const v = answers[id];
      if (q.type === 'text') {
        if (typeof v !== 'string' || v.trim().length < (q.min_len || 0)) return false;
      } else if (v == null || v === '' || (Array.isArray(v) && !v.length)) {
        return false;
      }
    }
    return true;
  };

  const goBack = () => {
    if (softCheck) {
      setSoftCheck(false);
      return;
    }
    if (!spec) return;
    if (isEdit) {
      setEditCursor((c) => Math.max(0, c - 1));
      return;
    }
    const current = qid ? screenIdsFor(qid)[0] : null;
    const idx = screens.indexOf(current);
    if (idx > 0) setStepId(screens[idx - 1]);
  };

  const submit = async () => {
    if (submittingRef.current || !spec) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const pruned = pruneAnswers(spec, answers);
      const confirmedSame = [];
      if (isRefresh && allowConfirm) {
        for (const id of Object.keys(pruned)) {
          const offer = confirmSameOffer(spec, id, prevAnswers || {}, pruned);
          if (offer != null && valuesMatch(offer, pruned[id]) && confirmed[id]) {
            confirmedSame.push(id);
          }
        }
      }
      const body = {
        instrument_version: spec.instrument_version,
        locale: 'en',
        started_at: startedAtRef.current,
        confirmed_same: confirmedSame,
        answers: pruned,
      };
      if (isEdit) body.intent = 'edit';
      const res = await secAPI.submit(body, {
        headers: { 'Idempotency-Key': newIdempotencyKey() },
        skipErrorToast: true,
      });
      const awarded = res.data?.credits_awarded ?? 0;
      clearSecDraft(mode);
      if (awarded > 0) toast.success(`+${awarded} Ruchi Credits`);
      else toast.success('Saved');
      onComplete?.(awarded);
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === 'SEC_INVALID' && Array.isArray(data.problems)) {
        const noAdult = data.problems.find((p) => p.code === 'NO_ADULT');
        setError(noAdult ? NO_ADULT_MSG : (data.problems[0]?.message || 'Please check your answers.'));
        if (noAdult) {
          const back = { ...answers };
          delete back.ADULTS;
          delete back.YOUNG_M;
          delete back.YOUNG_F;
          delete back.EDU_M;
          delete back.EDU_F;
          setAnswers(pruneAnswers(spec, back));
          setSoftCheck(false);
        }
      } else if (data?.error === 'SEC_VERSION_MISMATCH') {
        toast.error('The questions were updated. Reloading…');
        window.location.reload();
      } else if (data?.error === 'SEC_NOT_AVAILABLE') {
        toast.error('This survey is not available right now.');
        onComplete?.(0);
      } else {
        toast.error(data?.message || 'Could not save. Try again.', { id: 'sec-save' });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const finishOrSoftCheck = (after) => {
    if (needsProfessionalSoftCheck(after) && !softCheck) {
      setSoftCheck(true);
      return;
    }
    submit();
  };

  const continueNext = () => {
    if (!screenReady()) return;
    const after = pruneAnswers(spec, answers);
    if (isEdit) {
      const uniqueScreens = screenList(spec, after);
      if (editCursor >= uniqueScreens.length - 1) {
        finishOrSoftCheck(after);
        return;
      }
      setEditCursor((c) => c + 1);
      return;
    }
    const current = qid ? screenIdsFor(qid)[0] : null;
    const idx = screens.indexOf(current);
    if (idx >= 0 && idx < screens.length - 1) {
      setStepId(screens[idx + 1]);
      return;
    }
    if (nextQuestion(spec, after) == null) finishOrSoftCheck(after);
    else setStepId(screenIdsFor(nextQuestion(spec, after))[0]);
  };

  if (loading || !spec) {
    return <p className="onboard-copy">Loading…</p>;
  }

  if (softCheck) {
    return (
      <div>
        <div className="onboard-progress" aria-hidden="true">
          <span style={{ width: '100%' }} />
        </div>
        <p className="onboard-copy" style={{ marginTop: '1rem' }}>
          You said the person the household depends on most has a professional job that needs a
          degree, licence or long training. But nobody at home has a degree. Is that right?
        </p>
        {error ? <p className="onboard-error">{error}</p> : null}
        <div className="onboard-actions">
          <button type="button" className="home-pill home-pill-navy" disabled={submitting} onClick={submit}>
            Yes, that is right
          </button>
          <button
            type="button"
            className="home-pill home-pill-outline"
            onClick={() => {
              setSoftCheck(false);
              const back = { ...answers };
              delete back.OCC;
              delete back.OCC_OTHER_TEXT;
              delete back.OCC_CLOSEST;
              delete back.BIZ_SIZE;
              setAnswers(pruneAnswers(spec, back));
            }}
          >
            Let me change an answer
          </button>
        </div>
      </div>
    );
  }

  if (!qid) {
    return (
      <div>
        <p className="onboard-copy">Ready to save your answers.</p>
        {error ? <p className="onboard-error">{error}</p> : null}
        <button type="button" className="home-pill home-pill-lg home-pill-navy" disabled={submitting} onClick={submit}>
          {submitting ? 'Saving…' : 'Submit'}
        </button>
      </div>
    );
  }

  const primaryId = screenIds[0];
  const offer = allowConfirm ? confirmSameOffer(spec, primaryId, prevAnswers, answers) : null;

  return (
    <div>
      <div
        className="onboard-progress"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${Math.max(6, Math.round(progress * 100))}%` }} />
      </div>

      <div ref={questionAnchorRef} style={{ scrollMarginTop: 16 }} />
      {screenIds.map((id) => {
        const q = questionById(spec, id);
        const options = visibleOptions(spec, id, answers);
        const text = questionText(spec, id, answers, 'text');
        const help = questionText(spec, id, answers, 'help');
        return (
          <div key={id} className="onboard-field" style={{ marginTop: '1.25rem' }}>
            <h3 className="text-base font-semibold text-[var(--navy)]">{questionHeading(id, text)}</h3>
            {help ? <p className="text-sm text-[var(--muted)] mt-0.5">{help}</p> : null}

            {q.type === 'text' ? (
              <div style={{ marginTop: 12 }}>
                <textarea
                  className="w-full rounded-2xl border border-[#e4e8ee] p-3 text-sm"
                  rows={3}
                  maxLength={q.max_len || 100}
                  value={answers[id] || ''}
                  onChange={(e) => setAnswer(id, e.target.value)}
                />
                <p className="text-sm text-[var(--muted)] mt-1">
                  {(answers[id] || '').trim().length}/{q.max_len || 100}
                </p>
              </div>
            ) : (
              <div className="onboard-pills" style={{ gridTemplateColumns: '1fr' }}>
                {options.map((opt) => {
                  const selected = q.type === 'multi'
                    ? Array.isArray(answers[id]) && answers[id].includes(opt.code)
                    : answers[id] === opt.code;
                  return (
                    <OptionPill
                      key={opt.code}
                      label={opt.label}
                      help={opt.help}
                      selected={selected}
                      onClick={() => {
                        if (q.type === 'multi') toggleMulti(id, opt.code, opt.exclusive);
                        else setAnswer(id, opt.code);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {offer != null ? (
        <ConfirmSame
          saved={offer}
          value={answers[primaryId]}
          confirmed={confirmed[primaryId]}
          onConfirm={() => {
            for (const id of screenIds) {
              const o = confirmSameOffer(spec, id, prevAnswers, answers);
              if (o != null) {
                setAnswers((prev) => pruneAnswers(spec, { ...prev, [id]: o }));
                setConfirmed((prev) => ({ ...prev, [id]: true }));
              }
            }
          }}
        />
      ) : null}

      {error ? <p className="onboard-error" role="alert">{error}</p> : null}

      <div className="onboard-actions mt-10 pt-6 border-t border-[#eef1f4]">
        <button type="button" className="home-pill home-pill-outline" onClick={goBack}>
          Back
        </button>
        <button
          type="button"
          className="home-pill home-pill-lg home-pill-lime"
          disabled={!screenReady() || submitting}
          onClick={continueNext}
        >
          {submitting ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default SecSurvey;
