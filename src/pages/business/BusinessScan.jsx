import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ScanLine, LayoutDashboard } from "lucide-react";
import { businessAPI } from "../../services/api";
import { discountLabel, formatRs } from "../../utils/billMath";

const RESULT_IDLE = null;

export default function BusinessScan() {
  const navigate = useNavigate();
  const [scannerActive, setScannerActive] = useState(false);
  const [result, setResult] = useState(RESULT_IDLE);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [mode, setMode] = useState("qr"); // "qr" | "code"
  const [codeInput, setCodeInput] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billAmountError, setBillAmountError] = useState("");
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const billInputRef = useRef(null);

  const parsedBillAmount = (() => {
    const raw = billAmount.trim().replace(/,/g, "");
    if (!raw) return null;
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  })();

  const processResult = async (voucherId, redemptionToken, amount) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await businessAPI.scan({
        voucherId,
        redemptionToken,
        billAmountAfterDiscount: amount,
      });
      setResult({ type: "success", data: res.data });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "An error occurred";
      if (status === 403) {
        setResult({ type: "wrong_business", message: msg });
      } else if (/bill amount/i.test(msg)) {
        setResult({ type: "invalid", message: msg });
      } else if (msg.startsWith("Voucher already used")) {
        setResult({ type: "already_used", message: msg });
      } else if (msg.startsWith("Voucher expired")) {
        setResult({ type: "expired", message: msg });
      } else {
        setResult({ type: "invalid", message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const previewVoucher = async (voucherId, redemptionToken) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await businessAPI.previewScan(voucherId, redemptionToken);
      setResult({ type: "pending", voucherId, redemptionToken, data: res.data.data });
      setBillAmount("");
      setBillAmountError("");
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "An error occurred";
      if (status === 403) {
        setResult({ type: "wrong_business", message: msg });
      } else if (msg.startsWith("Voucher already used")) {
        setResult({ type: "already_used", message: msg });
      } else if (msg.startsWith("Voucher expired")) {
        setResult({ type: "expired", message: msg });
      } else {
        setResult({ type: "invalid", message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!result || result.type !== "pending") return;
    if (parsedBillAmount === null) {
      setBillAmountError("Enter an amount");
      return;
    }
    setBillAmountError("");
    await processResult(result.voucherId, result.redemptionToken, parsedBillAmount);
  };

  const startScanner = async () => {
    setScanError(null);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    html5QrcodeRef.current = scanner;
    setScannerActive(true);
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.v && parsed.t) {
              await scanner.stop();
              setScannerActive(false);
              await previewVoucher(parsed.v, parsed.t);
            }
          } catch {
            // ignore malformed QR
          }
        },
        () => {}
      );
    } catch (err) {
      setScannerActive(false);
      setScanError(err?.message || "Could not start camera. Check browser permissions.");
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
      } catch {
        // already stopped
      }
    }
    setScannerActive(false);
  };

  useEffect(() => {
    if (result?.type === "pending") {
      billInputRef.current?.focus();
    }
  }, [result?.type]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleReset = () => {
    setResult(RESULT_IDLE);
    setCodeInput("");
    setBillAmount("");
    setBillAmountError("");
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed.length !== 6) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await businessAPI.previewScanByCode(trimmed);
      setResult({
        type: "pending",
        voucherId: res.data.data.voucherId,
        redemptionToken: res.data.data.redemptionToken,
        data: res.data.data,
      });
      setBillAmount("");
      setBillAmountError("");
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "An error occurred";
      if (status === 403) {
        setResult({ type: "wrong_business", message: msg });
      } else if (msg.startsWith("Voucher already used")) {
        setResult({ type: "already_used", message: msg });
      } else if (msg.startsWith("Voucher expired")) {
        setResult({ type: "expired", message: msg });
      } else {
        setResult({ type: "invalid", message: msg });
      }
    } finally {
      setLoading(false);
      setCodeInput("");
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col pb-28"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Scan Voucher</h1>
        <button
          onClick={() => navigate("/business/dashboard")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-6 max-w-md mx-auto w-full">
        {/* Result card */}
        {result && (
          <div
            className={`w-full rounded-2xl p-6 text-center ${
              result.type === "success"
                ? "bg-green-50 border border-green-200"
                : result.type === "pending"
                ? "bg-blue-50 border border-blue-200"
                : result.type === "already_used"
                ? "bg-gray-100 border border-gray-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.type === "success" && (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-xl font-bold text-green-700 mb-1">Voucher Valid</p>
                <p className="text-sm font-semibold text-gray-700">
                  {result.data.discount?.title}
                </p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {result.data.discount?.label
                    || (result.data.discount?.type === "percentage"
                      ? `${result.data.discount.value}% off`
                      : `Rs. ${result.data.discount?.value} off`)}
                </p>
                <BillMathBlock math={result.data.math} />
              </>
            )}
            {result.type === "pending" && (
              <>
                <p className="text-xl font-bold text-gray-800 mb-1">Confirm Redemption</p>
                <p className="text-sm font-semibold text-gray-700">{result.data.title}</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {discountLabel(result.data)}
                </p>
                {result.data.description && (
                  <p className="text-sm text-gray-500 mt-2">{result.data.description}</p>
                )}
                <label className="block text-left mt-5 bg-white rounded-xl border border-blue-200 px-4 py-3">
                  <span className="block text-sm font-semibold text-gray-800 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      Rs.
                    </span>
                    <input
                      ref={billInputRef}
                      type="text"
                      inputMode="decimal"
                      value={billAmount}
                      onChange={(e) => {
                        setBillAmount(e.target.value.replace(/[^\d.,]/g, ""));
                        setBillAmountError("");
                      }}
                      placeholder="0.00"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium text-left focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {billAmountError && (
                    <p className="mt-1.5 text-xs text-red-500">{billAmountError}</p>
                  )}
                </label>
                <div className="flex gap-3 mt-4 justify-center">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:border-gray-400 transition-colors disabled:opacity-50"
                  >
                    Deny
                  </button>
                </div>
              </>
            )}
            {result.type === "already_used" && (
              <>
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-xl font-bold text-gray-600 mb-1">Already Used</p>
                <p className="text-sm text-gray-500">{result.message}</p>
              </>
            )}
            {(result.type === "expired" ||
              result.type === "wrong_business" ||
              result.type === "invalid") && (
              <>
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-xl font-bold text-red-600 mb-1">
                  {result.type === "expired"
                    ? "Expired"
                    : result.type === "wrong_business"
                    ? "Not for your business"
                    : /bill amount/i.test(result.message || "")
                    ? "Bill amount required"
                    : "Invalid QR Code"}
                </p>
                <p className="text-sm text-red-500">{result.message}</p>
              </>
            )}
            {result.type !== "pending" && (
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Scan next voucher
              </button>
            )}
          </div>
        )}

        {/* Scanner */}
        {!result && (
          <>
          <div className="flex w-full rounded-full bg-gray-100 p-1">
              <button
                onClick={() => { setMode("qr"); setCodeInput(""); }}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                  mode === "qr" ? "bg-white shadow text-gray-900" : "text-gray-500"
                }`}
              >
                Scan QR
              </button>
              <button
                onClick={async () => { await stopScanner(); setMode("code"); }}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                  mode === "code" ? "bg-white shadow text-gray-900" : "text-gray-500"
                }`}
              >
                Enter Code
              </button>
            </div>
  
            {mode === "qr" && (
            <div className="w-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div id="qr-reader" ref={scannerRef} className="w-full" />
              {!scannerActive && (
                <div className="flex flex-col items-center py-10 px-6">
                  <ScanLine size={48} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 mb-4 text-center">
                    Press the button to open the camera and scan a voucher QR code
                  </p>
                  <button
                    onClick={startScanner}
                    disabled={loading}
                    className="px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Start Scanning
                  </button>
                  {scanError && (
                    <p className="mt-2 text-xs text-red-500 text-center">{scanError}</p>
                  )}
                </div>
              )}
              {scannerActive && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={stopScanner}
                    className="px-5 py-2 rounded-full border border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              )}
            </div>
            )}

            {mode === "code" && (
              <form
                onSubmit={handleCodeSubmit}
                className="w-full bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-4"
              >
                <p className="text-sm text-gray-400 text-center">
                  Ask the customer for the 6-character code on their voucher
                </p>
                <input
                  value={codeInput}
                  onChange={(e) =>
                    setCodeInput(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
                    )
                  }
                  placeholder="ABC123"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full text-center text-2xl font-bold tracking-[0.3em] uppercase border border-gray-200 rounded-xl py-3 focus:outline-none focus:border-gray-400"
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={loading || codeInput.length !== 6}
                  className="w-full px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Checking..." : "Verify Code"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BillMathBlock({ math }) {
  if (!math || math.afterDiscount == null) return null;
  return (
    <div className="mt-4 text-left bg-white/80 border border-gray-100 rounded-xl px-4 py-3">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-gray-800">Amount</span>
        <span className="font-bold text-green-700">{formatRs(math.afterDiscount)}</span>
      </div>
    </div>
  );
}