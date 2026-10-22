import React from "react";
import QRCode from "react-qr-code";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { VOUCHER_TERMS } from "../../constants/voucherTerms";
import { discountHeadline } from "./voucherOfferFormatters.js";

export default function VoucherTicketFace({
  cardRef,
  accent,
  brandName,
  category,
  description,
  offer,
  validity,
  available,
  location,
  canRedeem,
  agreed,
  setAgreed,
  error,
  notEnoughCredits,
  isOut,
  userCredits,
  loading,
  step,
  voucher,
  qrRef,
  onClose,
  onRedeem,
  onGoSurveys,
  onDownload,
  onViewVouchers,
}) {
  return (
    <article ref={cardRef} className="reward-claim" style={{ "--claim": accent }}>
      <aside className="reward-claim-brand">
        <p className="reward-claim-kicker">Eruchi exclusive</p>
        <div className="reward-claim-arch">
          <span>{brandName}</span>
        </div>
        <p className="reward-claim-tagline">
          A little reward.
          <br />
          A great experience.
        </p>
        <p className="reward-claim-mark">Claim it. Enjoy it.</p>
      </aside>

      <div className="reward-claim-body">
        <button
          type="button"
          className="reward-claim-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {step === "confirm" && (
          <>
            <p className="reward-claim-category">{category}</p>
            <h2 className="reward-claim-title">{brandName}</h2>
            <p className="reward-claim-copy">{description}</p>

            <div className="reward-claim-deal">
              <strong>{discountHeadline(offer)}</strong>
              <span>{offer.title}</span>
            </div>

            <dl className="reward-claim-meta">
              <div>
                <dt>Validity</dt>
                <dd>{validity}</dd>
              </div>
              <div>
                <dt>Available</dt>
                <dd>{available}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{location}</dd>
              </div>
            </dl>

            {canRedeem && (
              <div className="reward-claim-legal">
                <label className="reward-claim-agree">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                  />
                  I have read and agree to the
                </label>
                <details className="reward-claim-terms">
                  <summary>Terms &amp; Conditions</summary>
                  <ul>
                    {VOUCHER_TERMS.map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}

            {error ? <p className="reward-claim-error">{error}</p> : null}
            {notEnoughCredits && !isOut ? (
              <p className="reward-claim-error">Not enough credits</p>
            ) : null}

            <div className="reward-claim-foot">
              <div>
                <p className="reward-claim-credits">{offer.creditsRequired || 0} Credits</p>
                <p className="reward-claim-balance">Your balance: {userCredits} credits</p>
              </div>
              {isOut ? (
                <button type="button" className="reward-claim-cta" disabled>
                  Sold out
                </button>
              ) : notEnoughCredits ? (
                <button type="button" className="reward-claim-cta" onClick={onGoSurveys}>
                  Surveys
                </button>
              ) : (
                <button
                  type="button"
                  className="reward-claim-cta"
                  onClick={onRedeem}
                  disabled={loading || !agreed}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Buy
                </button>
              )}
            </div>

            <p className="reward-claim-note">
              Present your voucher at the venue. Terms and conditions apply.
            </p>
          </>
        )}

        {step === "success" && voucher && (
          <div className="reward-claim-success">
            <div className="reward-claim-success-head">
              <CheckCircle2 size={22} />
              <h2>Voucher redeemed</h2>
            </div>
            <div ref={qrRef} className="reward-claim-qr">
              <QRCode
                value={JSON.stringify({ v: voucher._id, t: voucher.redemptionToken })}
                size={168}
              />
            </div>
            <p className="reward-claim-copy">Show this QR to store staff to redeem.</p>
            {voucher.redemptionCode ? (
              <div className="reward-claim-code">
                <p className="reward-claim-code-label">Or give staff this code</p>
                <p className="reward-claim-code-value">{voucher.redemptionCode}</p>
              </div>
            ) : null}
            <div className="reward-claim-success-actions">
              <button type="button" className="reward-claim-secondary" onClick={onDownload}>
                Download voucher
              </button>
              <button
                type="button"
                className="reward-claim-cta"
                onClick={onViewVouchers}
              >
                View my vouchers
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
