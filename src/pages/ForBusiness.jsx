import React, { useState } from "react";
// Import the AnimatedContent component
import AnimatedContent from "../components/animations/AnimatedContent";

const ForBusiness = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ businessName: "", phone: "", email: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.businessName || !form.phone || !form.email) return;
    setStatus("loading");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({ businessName: "", phone: "", email: "" });
    setStatus("idle");
  };

  // Shared text styles for card labels and headings
  const stepLabelStyle = {
    fontSize: "13px",
    fontWeight: 400,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.55,
    marginBottom: "10px",
  };

  const cardHeadingStyle = {
    fontWeight: 500,
    lineHeight: 1.25,
    letterSpacing: "-0.01em",
  };

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1314px] mx-auto px-4 sm:px-8 lg:px-10 py-10 lg:py-16">
        <div className="grid lg:grid-cols-[auto_1fr] gap-12 lg:gap-16 items-start">

          {/* Left Column */}
          <AnimatedContent
            direction="vertical"
            distance={40}
            duration={0.8}
            className="flex flex-col gap-6 w-full"
            style={{ maxWidth: "460px" }}
          >
            <h1
              className="text-gray-900"
              style={{
                fontSize: "clamp(36px, 9vw, 64px)",
                fontWeight: 300,
                lineHeight: 1.0,
              }}
            >
              Become a founding Merchant
            </h1>

            <p
              className="text-gray-700 leading-snug text-justify"
              style={{ fontSize: "20px", fontWeight: 300 }}
            >
              We drive verified, young Kathmandu consumers to your door at zero upfront cost.
              Fill in your details below and we'll reach out within 24 hours to get you set up.
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <h2
                style={{
                  fontSize: "clamp(36px, 9vw, 64px)",
                  fontWeight: 400,
                  color: "#4A9EF5",
                  lineHeight: 1.05,
                }}
              >
                Contact Us
              </h2>

              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center justify-center gap-3 rounded-full hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "#4A9EF5",
                  height: "65px",
                  width: "100%",
                  maxWidth: "425px",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Get in Touch
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </button>
            </div>
          </AnimatedContent>

          {/* Right Column — Cards */}
          <div className="flex flex-col gap-4 w-full">

            {/* Step 1 Card */}
            <AnimatedContent
              direction="vertical"
              distance={45}
              duration={0.7}
              delay={0.15}
              className="w-full"
            >
              <div
                className="rounded-3xl p-8 text-white flex flex-col justify-end"
                style={{
                  backgroundColor: "#134074",
                  height: "230px",
                  width: "100%",
                }}
              >
                <p style={stepLabelStyle}>Step 1</p>
                <h2 style={{ ...cardHeadingStyle, fontSize: "clamp(20px, 2.2vw, 28px)" }}>
                  Tell us about your business and the offer you want to run
                </h2>
              </div>
            </AnimatedContent>

            {/* Step 2 + Step 3 side-by-side */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "39% 1fr" }}>

              {/* Step 2 Card */}
              <AnimatedContent
                direction="vertical"
                distance={45}
                duration={0.7}
                delay={0.3}
                className="w-full flex flex-col"
              >
                <div
                  className="rounded-3xl p-8 text-white flex flex-col justify-end h-full"
                  style={{
                    backgroundColor: "#13315C",
                    height: "281px",
                  }}
                >
                  <p style={stepLabelStyle}>Step 2</p>
                  <h2 style={{ ...cardHeadingStyle, fontSize: "clamp(18px, 2vw, 26px)" }}>
                    We match you with users who fit your customer profile
                  </h2>
                </div>
              </AnimatedContent>

              {/* Step 3 Card */}
              <AnimatedContent
                direction="vertical"
                distance={45}
                duration={0.7}
                delay={0.45}
                className="w-full flex flex-col"
              >
                <div
                  className="rounded-3xl p-8 text-white flex flex-col justify-between h-full"
                  style={{
                    backgroundColor: "#08162B",
                    height: "281px",
                  }}
                >
                  {/* Top-right accent text */}
                  <p
                    className="text-right"
                    style={{
                      fontSize: "clamp(18px, 2vw, 26px)",
                      fontWeight: 300,
                      lineHeight: 1.25,
                      letterSpacing: "-0.01em",
                      opacity: 0.85,
                    }}
                  >

                  </p>

                  {/* Bottom label + heading */}
                  <div>
                    <p style={stepLabelStyle}>Step 3</p>
                    <h2 style={{ ...cardHeadingStyle, fontSize: "clamp(18px, 2vw, 26px)" }}>
                      They walk in. You track results. We grow together.
                    </h2>
                  </div>
                </div>
              </AnimatedContent>

            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="relative w-full rounded-3xl overflow-hidden overflow-y-auto"
            style={{ maxWidth: "480px", maxHeight: "90vh", backgroundColor: "white" }}
          >
            {/* Modal Header */}
            <div className="px-8 py-6" style={{ backgroundColor: "#134074" }}>
              <h2 className="text-white" style={{ fontSize: "24px", fontWeight: 700 }}>
                Partner with eRuchi
              </h2>
              <p className="text-white opacity-75" style={{ fontSize: "14px", marginTop: "4px" }}>
                Fill in your details and we'll be in touch.
              </p>
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 text-white opacity-75 hover:opacity-100 transition-opacity"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            {status === "success" ? (
              <div className="px-8 py-10 text-center">
                <div
                  className="mx-auto mb-4 flex items-center justify-center rounded-full"
                  style={{ width: "64px", height: "64px", backgroundColor: "#4A9EF5" }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#134074" }}>
                  We've received your inquiry!
                </h3>
                <p className="text-gray-500 mt-2" style={{ fontSize: "15px" }}>
                  Our team will reach out to <strong>{form.email}</strong> shortly.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-6 rounded-full px-8 py-3 text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#4A9EF5", fontSize: "15px", fontWeight: 500 }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="px-8 py-6 flex flex-col gap-4">
                {[
                  { label: "Business Name", name: "businessName", type: "text", placeholder: "Your Company Name" },
                  { label: "Phone Number", name: "phone", type: "tel", placeholder: "+977 98XXXXXXXX" },
                  { label: "Email Address", name: "email", type: "email", placeholder: "you@yourbusiness.com" },
                ].map(({ label, name, type, placeholder }) => (
                  <div key={name} className="flex flex-col gap-1">
                    <label className="text-gray-700" style={{ fontSize: "13px", fontWeight: 500 }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className="rounded-xl px-4 outline-none text-gray-800"
                      style={{ height: "48px", border: "1.5px solid #e5e7eb", fontSize: "15px" }}
                      onFocus={(e) => (e.target.style.borderColor = "#4A9EF5")}
                      onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                    />
                  </div>
                ))}

                {status === "error" && (
                  <p className="text-red-500" style={{ fontSize: "13px" }}>
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={status === "loading"}
                  className="mt-2 rounded-full py-3 text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "#4A9EF5", fontSize: "15px", fontWeight: 600 }}
                >
                  {status === "loading" ? "Sending..." : "Send Inquiry"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForBusiness;