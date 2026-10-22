import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { voucherAPI } from "../../services/api";
import { playClaimBody, playClaimOpen } from "../shop/shopCinema";
import { getOfferStock } from "../../utils/pickSurveyOffers";
import { healthSessionId, trackHealthEvent } from "../../utils/healthEvents";
import {
  getBrandPalette,
  claimColor,
  prettyCategory,
  formatAvailable,
} from "./voucherOfferFormatters.js";
import VoucherTicketFace from "./VoucherTicketFace.jsx";
import "../shop/shop.css";

export default function VoucherRedeemModal({
  offer,
  userCredits,
  onClose,
  onSuccess,
  onRedeemed,
  index,
  receivedVia,
}) {
  const [step, setStep] = useState("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voucher, setVoucher] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const qrRef = useRef(null);
  const backdropRef = useRef(null);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const brandName = offer.business?.brandName || offer.business?.name || "Partner";
  const category = prettyCategory(offer.business?.category);
  const description =
    String(offer.description || offer.business?.description || "").trim() ||
    "Turn your earned credits into a little more of what you love.";
  const location = String(offer.business?.address || "").trim() || "Kathmandu, Nepal";
  const validity =
    offer.expiryDays != null
      ? `${offer.expiryDays} day${offer.expiryDays === 1 ? "" : "s"} after claiming`
      : "See partner for details";
  const available = formatAvailable(offer);
  const accent = claimColor(index, offer);
  const stockInfo = useMemo(() => getOfferStock(offer), [offer]);
  const isOut = stockInfo !== null && stockInfo.remaining === 0;
  const notEnoughCredits = userCredits < offer.creditsRequired;
  const canRedeem = !notEnoughCredits && !isOut;

  const discountLabel =
    offer.discountType === "percentage"
      ? `${offer.discountValue}% off`
      : `Rs. ${offer.discountValue} off`;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useLayoutEffect(() => playClaimOpen(backdropRef.current, cardRef.current), [offer?._id]);

  useLayoutEffect(() => playClaimBody(cardRef.current, step), [step]);

  useEffect(() => {
    if (!offer?._id) return;
    const sessionId = healthSessionId();
    trackHealthEvent("voucher_viewed", { refId: offer._id, detail: { sessionId } });
    if (!notEnoughCredits) return;
    trackHealthEvent("insufficient_credits_shown", {
      refId: offer._id,
      eventId: `short:${offer._id}:${sessionId}`,
      detail: { sessionId },
    });
  }, [offer?._id, notEnoughCredits]);

  const handleRedeem = async () => {
    setLoading(true);
    setError("");
    let fromPrompt = false;
    try {
      fromPrompt = Boolean(sessionStorage.getItem("eruchi_reward_prompt"));
    } catch {
      fromPrompt = false;
    }
    trackHealthEvent("purchase_clicked", {
      refId: offer?._id,
      detail: fromPrompt ? { action: "bought", sessionId: healthSessionId() } : undefined,
    });
    try {
      const res = await voucherAPI.redeem(offer._id, { receivedVia });
      setVoucher(res.data.voucher);
      setStep("success");
      if (res.data.voucher?._id) {
        const sessionId = healthSessionId();
        trackHealthEvent("voucher_opened", {
          refId: res.data.voucher._id,
          eventId: `open:${res.data.voucher._id}:${sessionId}`,
          detail: { sessionId },
        });
      }
      onRedeemed?.(res.data.voucher);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to redeem voucher");
    } finally {
      setLoading(false);
    }
  };

  const goSurveys = () => {
    onClose?.();
    navigate("/standalone-surveys");
  };

  const downloadVoucher = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const CARD_W = 400;
    const CX = CARD_W / 2;
    const RADIUS = 28;
    const QR_SIZE = 220;

    const brandLogoUrl =
      offer.business?.brandLogo || offer.business?.logo || offer.business?.businessLogo || null;
    const palette = getBrandPalette(brandName);

    const wrapText = (ctx, text, maxWidth) => {
      const words = text.split(" ");
      const lines = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const HEADER_TOP_PAD = 30;
    const LOGO_SIZE = 68;
    const HEADER_BOTTOM_PAD = 26;
    const TITLE_LINE_H = 28;

    const measureCtx = document.createElement("canvas").getContext("2d");
    measureCtx.font = "bold 24px system-ui, sans-serif";
    const titleLines = wrapText(measureCtx, offer.title || "", CARD_W - 64);

    const HEADER_H =
      HEADER_TOP_PAD +
      LOGO_SIZE +
      16 +
      18 +
      4 +
      titleLines.length * TITLE_LINE_H +
      10 +
      22 +
      HEADER_BOTTOM_PAD;

    const BOX_X = 32;
    const BOX_W = CARD_W - 64;
    const BOX_PAD_X = 16;
    const BOX_PAD_Y = 12;
    const DESC_LINE_H = 18;
    const descInnerW = BOX_W - BOX_PAD_X * 2;

    let descLines = [];
    if (offer.description) {
      measureCtx.font = "13px system-ui, sans-serif";
      descLines = wrapText(measureCtx, offer.description, descInnerW);
    }
    const descBoxH =
      descLines.length > 0 ? descLines.length * DESC_LINE_H + BOX_PAD_Y * 2 : 0;

    const BODY_PAD_TOP = 28;
    const DIVIDER_GAP = 24;
    const HINT_H = voucher.redemptionCode ? 66 : 40;
    const EXPIRY_H = 24;
    const BODY_BOTTOM_PAD = 30;

    const CARD_H =
      HEADER_H +
      BODY_PAD_TOP +
      (descBoxH > 0 ? descBoxH + 20 : 0) +
      DIVIDER_GAP +
      QR_SIZE +
      HINT_H +
      EXPIRY_H +
      BODY_BOTTOM_PAD;

    const logoImg = brandLogoUrl
      ? await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = brandLogoUrl;
        })
      : null;

    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(
      new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
    );
    const qrImg = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(svgUrl);
        resolve(img);
      };
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext("2d");
    ctx.textAlign = "center";

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, CARD_W, CARD_H, RADIUS);
    ctx.clip();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, CARD_W, HEADER_H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CARD_W, HEADER_H);
    ctx.clip();
    const rayCX = CX;
    const rayCY = HEADER_H * 0.15;
    const rayR = CARD_W * 0.7;
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = palette.accent;
    const segDeg = 12;
    for (let deg = 0; deg < 360; deg += segDeg * 2) {
      const start = (deg * Math.PI) / 180;
      const end = ((deg + segDeg) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(rayCX, rayCY);
      ctx.arc(rayCX, rayCY, rayR, start, end);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    let y = HEADER_TOP_PAD;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(CX, y + LOGO_SIZE / 2, LOGO_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    if (logoImg) {
      const scale = Math.min(
        (LOGO_SIZE * 0.7) / logoImg.width,
        (LOGO_SIZE * 0.7) / logoImg.height
      );
      const lw = logoImg.width * scale;
      const lh = logoImg.height * scale;
      ctx.drawImage(logoImg, CX - lw / 2, y + LOGO_SIZE / 2 - lh / 2, lw, lh);
    } else {
      ctx.fillStyle = palette.bg;
      ctx.font = "600 26px system-ui, sans-serif";
      ctx.fillText(brandName.charAt(0).toUpperCase(), CX, y + LOGO_SIZE / 2 + 9);
    }
    y += LOGO_SIZE + 16;

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.9;
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(brandName.toUpperCase(), CX, y);
    ctx.globalAlpha = 1;
    y += 22;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px system-ui, sans-serif";
    for (const line of titleLines) {
      ctx.fillText(line, CX, y);
      y += TITLE_LINE_H;
    }
    y += 6;

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.9;
    ctx.font = "700 17px system-ui, sans-serif";
    ctx.fillText(discountLabel, CX, y);
    ctx.globalAlpha = 1;

    y = HEADER_H + BODY_PAD_TOP;

    if (descLines.length > 0) {
      ctx.fillStyle = "#EFF6FF";
      ctx.beginPath();
      ctx.roundRect(BOX_X, y, BOX_W, descBoxH, 10);
      ctx.fill();

      ctx.fillStyle = "#4B5563";
      ctx.font = "13px system-ui, sans-serif";
      let ty = y + BOX_PAD_Y + 14;
      for (const line of descLines) {
        ctx.fillText(line, CX, ty);
        ty += DESC_LINE_H;
      }
      y += descBoxH + 20;
    }

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(CARD_W - 32, y);
    ctx.stroke();
    y += DIVIDER_GAP;

    const qrX = (CARD_W - QR_SIZE) / 2;
    ctx.drawImage(qrImg, qrX, y, QR_SIZE, QR_SIZE);
    y += QR_SIZE;

    ctx.fillStyle = "#3399FF";
    ctx.globalAlpha = 0.8;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText("Show this QR to store staff to redeem", CX, y + 26);
    ctx.globalAlpha = 1;

    if (voucher.redemptionCode) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.fillText("OR GIVE STAFF THIS CODE", CX, y + 44);
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 20px system-ui, sans-serif";
      ctx.fillText(voucher.redemptionCode.split("").join(" "), CX, y + 66);
    }

    if (voucher.expiresAt) {
      ctx.fillStyle = "#0f172a";
      ctx.font = "600 14px system-ui, sans-serif";
      ctx.fillText(
        `Expires ${new Date(voucher.expiresAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`,
        CX,
        y + (voucher.redemptionCode ? 90 : 50)
      );
    }

    ctx.restore();

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, CARD_W - 1, CARD_H - 1, RADIUS);
    ctx.stroke();

    const a = document.createElement("a");
    a.download = `voucher-${voucher._id}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return createPortal(
    <div className="reward-claim-backdrop" onClick={onClose}>
      <div ref={backdropRef} className="reward-claim-dim" aria-hidden="true" />
      <div
        className="reward-claim-motion"
        onClick={(event) => event.stopPropagation()}
      >
        <VoucherTicketFace
          cardRef={cardRef}
          accent={accent}
          brandName={brandName}
          category={category}
          description={description}
          offer={offer}
          validity={validity}
          available={available}
          location={location}
          canRedeem={canRedeem}
          agreed={agreed}
          setAgreed={setAgreed}
          error={error}
          notEnoughCredits={notEnoughCredits}
          isOut={isOut}
          userCredits={userCredits}
          loading={loading}
          step={step}
          voucher={voucher}
          qrRef={qrRef}
          onClose={onClose}
          onRedeem={handleRedeem}
          onGoSurveys={goSurveys}
          onDownload={downloadVoucher}
          onViewVouchers={() => {
            onSuccess?.();
            navigate("/vouchers");
          }}
        />
      </div>
    </div>,
    document.body
  );
}
