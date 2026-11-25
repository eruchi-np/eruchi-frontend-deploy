import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sepSurveyAPI } from "../../services/api";
import { healthSessionId } from "../../utils/healthEvents";

function formatVotes(total) {
  return Number(total || 0).toLocaleString("en-US");
}

function PollIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 19v-8M12 19V5M18 19v-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * Inline SEP quick poll on /standalone-surveys.
 * One tap votes; results replace the options in place.
 * Results stay open until the user hides them; refresh/revisit starts collapsed.
 */
export default function QuickPoll({ survey, onVoted }) {
  const poll = survey?.poll || {};
  const [busy, setBusy] = useState(false);
  const [localPoll, setLocalPoll] = useState(poll);
  // Collapse only when arriving already answered (refresh / navigate back).
  const [collapsed, setCollapsed] = useState(() => Boolean(poll.answered));

  useEffect(() => {
    setLocalPoll(poll);
  }, [poll]);

  const questionText = localPoll.questionText || survey.title || "Quick poll";
  const options = localPoll.options || [];
  const results = localPoll.results;
  const myAnswer = localPoll.myAnswer;
  const answered = Boolean(localPoll.answered);
  const showResults = answered && Boolean(results);

  const vote = async (label) => {
    if (busy || localPoll.answered) return;
    setBusy(true);
    try {
      const responses = { [questionText]: label };
      const sessionId = healthSessionId() || undefined;
      const res = await sepSurveyAPI.submit(
        survey._id,
        responses,
        null,
        sessionId,
        { skipErrorToast: true }
      );
      const nextPoll = res.data?.data?.poll || {
        ...localPoll,
        answered: true,
        myAnswer: label,
      };
      setLocalPoll(nextPoll);
      setCollapsed(false);
      onVoted?.(survey, res.data?.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn’t record your vote.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`qp-root${collapsed ? " is-collapsed" : " is-open"}`}>
      <div className="qp-slot qp-slot-strip" aria-hidden={!collapsed}>
        <div className="qp-slot-inner">
          <button
            type="button"
            className="qp-strip"
            tabIndex={collapsed ? 0 : -1}
            aria-expanded="false"
            aria-label={`Quick poll, you picked ${myAnswer || "an option"}. Show results`}
            onClick={() => setCollapsed(false)}
          >
            <span className="qp-strip-ic" aria-hidden="true">
              <CheckIcon />
            </span>
            <span className="qp-strip-copy">
              <span className="qp-strip-k">
                Quick poll
                <span className="qp-strip-hint"> · tap for results</span>
              </span>
              <span className="qp-strip-v">
                You picked {myAnswer || "an option"}
              </span>
            </span>
            <span className="qp-strip-btn">
              <span className="qp-strip-btn-label">See results</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <div className="qp-slot qp-slot-card" aria-hidden={collapsed}>
        <div className="qp-slot-inner">
          <section className="qp" aria-labelledby={`qp-q-${survey._id}`}>
            <div className="qp-in">
              <div className="qp-side">
                <div className="qp-meta">
                  <span className="qp-tag">
                    <PollIcon />
                    Quick poll
                  </span>
                </div>
                <h3 className="qp-q" id={`qp-q-${survey._id}`}>
                  {questionText}
                </h3>
                {!showResults ? (
                  <p className="qp-hint">Tap an answer to see what everyone else picked.</p>
                ) : (
                  <>
                    <p className="qp-hint">Thanks for voting.</p>
                    <div className="qp-foot qp-foot-side">
                      {results?.showCount ? (
                        <span>{formatVotes(results.total)} votes</span>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        className="qp-hide"
                        tabIndex={collapsed ? -1 : 0}
                        onClick={() => setCollapsed(true)}
                      >
                        Hide results
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 15l6-6 6 6" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {!showResults ? (
                <div className="qp-opts" role="group" aria-labelledby={`qp-q-${survey._id}`}>
                  {options.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="qp-opt"
                      disabled={busy}
                      tabIndex={collapsed ? -1 : 0}
                      onClick={() => vote(label)}
                    >
                      {label}
                    </button>
                  ))}
                  <p className="qp-hint qp-hint-mobile">
                    Tap an answer to see what everyone else picked.
                  </p>
                </div>
              ) : (
                <div className="qp-opts" role="list" aria-label="Poll results">
                  {(results.options || []).map((row) => {
                    const mine = row.label === myAnswer;
                    return (
                      <div
                        key={row.label}
                        className={`qp-result${mine ? " is-mine" : ""}`}
                        role="listitem"
                        style={{ "--p": `${row.percent || 0}%` }}
                      >
                        <i aria-hidden="true" />
                        <span>
                          {mine ? <CheckIcon /> : null}
                          {row.label}
                          {mine ? <span className="sr-only">, your pick</span> : null}
                        </span>
                        <b>{row.percent || 0}%</b>
                      </div>
                    );
                  })}
                  <div className="qp-foot qp-foot-mobile">
                    {results?.showCount ? (
                      <span>{formatVotes(results.total)} votes</span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      className="qp-hide"
                      tabIndex={collapsed ? -1 : 0}
                      onClick={() => setCollapsed(true)}
                    >
                      Hide results
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 15l6-6 6 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
