// src/pages/PrivacyPolicy.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const Section = ({ number, title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-[#3399FF] w-5 shrink-0">{number}</span>
          <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
            {title}
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="pb-5 pl-8 pr-2 text-[13px] text-gray-600 leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

const SubSection = ({ title, children }) => (
  <div className="space-y-1.5">
    <p className="text-[12px] font-semibold text-gray-700">{title}</p>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Bullet = ({ children }) => (
  <div className="flex gap-2">
    <span className="text-gray-300 mt-[3px] shrink-0">•</span>
    <p>{children}</p>
  </div>
);

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-gray-100 bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#3399FF] block">Legal</span>
            <h1 className="text-xl font-light text-gray-900 tracking-tight">Privacy Policy</h1>
          </div>
        </div>

        {/* Meta */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-4 mb-8 flex flex-wrap gap-x-6 gap-y-1">
          <p className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">Effective:</span> 7 June 2025</p>
          <p className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">Version:</span> 1.0</p>
          <p className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">Jurisdiction:</span> Nepal</p>
          <p className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">Legislation:</span> Privacy Act 2075 · ETA 2063</p>
        </div>

        <p className="text-[13px] text-gray-500 leading-relaxed mb-8">
          E. Ruchi Pvt. Ltd. is committed to protecting your privacy. This Policy explains how we collect, use, store, share, and protect your personal data when you use the eRuchi Platform. By using the Platform, you consent to the practices described here.
        </p>

        {/* Accordion Sections */}
        <div className="divide-y divide-gray-100 border-t border-gray-100">

          <Section number="1" title="Introduction">
            <p>This Privacy Policy is prepared in accordance with the Privacy Act 2075 (2018) of Nepal and the Electronic Transactions Act 2063 (2006). It forms part of our Terms and Conditions. Terms defined in the Terms and Conditions have the same meaning here.</p>
          </Section>

          <Section number="2" title="Data We Collect">
            <SubSection title="2.1 Information You Provide Directly">
              <p>When you register, we collect:</p>
              <Bullet>Full name</Bullet>
              <Bullet>Email address and mobile phone number</Bullet>
              <Bullet>Age</Bullet>
              <Bullet>Neighbourhood or general area within Kathmandu Valley</Bullet>
              <p>You may optionally provide additional profile information to improve survey relevance.</p>
            </SubSection>
            <SubSection title="2.2 Survey Response Data">
              <p>When you complete surveys, we collect the responses, ratings, opinions, and other information you submit. As stated in our Terms, this data becomes the exclusive property of eRuchi upon submission.</p>
            </SubSection>
            <SubSection title="2.3 Platform Activity Data">
              <p>We automatically collect:</p>
              <Bullet>Login dates and times</Bullet>
              <Bullet>Surveys viewed, started, and completed</Bullet>
              <Bullet>Ruchi Credits earned and redeemed</Bullet>
              <Bullet>Vouchers issued and redemption activity</Bullet>
              <Bullet>Device type, browser type, and operating system</Bullet>
              <Bullet>IP address and approximate geographic location</Bullet>
            </SubSection>
            <SubSection title="2.4 Communications Data">
              <p>If you contact us via email or any support channel, we retain records of that correspondence including message content and attachments.</p>
            </SubSection>
          </Section>

          <Section number="3" title="How We Use Your Data">
            <SubSection title="3.1 To Operate the Platform">
              <Bullet>Create and manage your account</Bullet>
              <Bullet>Deliver surveys relevant to your profile and location</Bullet>
              <Bullet>Calculate and maintain your Ruchi Credits balance</Bullet>
              <Bullet>Issue and deliver Vouchers to your registered email address</Bullet>
              <Bullet>Provide customer support and respond to enquiries</Bullet>
            </SubSection>
            <SubSection title="3.2 To Improve the Platform">
              <p>We use aggregated and anonymised data to analyse usage patterns, develop new features, and monitor technical and security issues.</p>
            </SubSection>
            <SubSection title="3.3 Business Insights">
              <p>Survey responses are aggregated across the Panelist pool. All insights delivered to business clients are based on aggregated, anonymised data. No business client receives access to individual survey responses or any data that could identify a specific Panelist. eRuchi's business model depends on maintaining the trust of our Panelist community — individual user data is never sold or directly disclosed to any client, advertiser, or third party.</p>
            </SubSection>
            <SubSection title="3.4 Marketing Communications">
              <p>We may use your email or phone number to send marketing communications about the Platform, new features, merchant partners, and rewards opportunities. You are enrolled by default and may unsubscribe at any time via the link in any marketing email, or by contacting support@eruchi.com.np. Opting out does not affect transactional communications such as Voucher delivery emails.</p>
            </SubSection>
          </Section>

          <Section number="4" title="Data Sharing and Disclosure">
            <SubSection title="4.1 Business Clients">
              <p>Business clients receive only aggregated, anonymised insights derived from Survey Response Data. They never receive any personally identifiable information about individual Panelists.</p>
            </SubSection>
            <SubSection title="4.2 Merchant Partners">
              <p>When you redeem a Voucher, the merchant's point-of-sale system receives only the information encoded in the QR code necessary to apply your benefit. Your name, contact details, and survey data are never shared with merchants.</p>
            </SubSection>
            <SubSection title="4.3 Service Providers">
              <p>We may share your data with trusted third-party providers (e.g. email delivery, hosting, analytics) who are contractually obligated to use your data only for providing services to eRuchi and to handle it in a manner consistent with this Policy.</p>
            </SubSection>
            <SubSection title="4.4 Legal Requirements">
              <p>We may disclose your personal data if required by applicable law, court order, or a lawful request from a competent government authority in Nepal. We will endeavour to notify you where permitted by law.</p>
            </SubSection>
            <SubSection title="4.5 No Sale of Personal Data">
              <p>eRuchi does not sell, rent, or trade your personal data to any third party for their independent use or for advertising purposes.</p>
            </SubSection>
          </Section>

          <Section number="5" title="Data Storage and Security">
            <SubSection title="5.1 Storage Location">
              <p>Your personal data is stored on servers located in Nepal. We do not transfer your personal data to servers outside Nepal as part of our standard operations.</p>
            </SubSection>
            <SubSection title="5.2 Security Measures">
              <p>We implement reasonable technical and organisational security measures including encrypted data transmission (HTTPS/TLS), secure server environments with access controls, and regular review of our security practices. No method of electronic storage is entirely secure, so we encourage you to use a strong, unique password.</p>
            </SubSection>
            <SubSection title="5.3 Breach Notification">
              <p>In the event of a data breach likely to result in risk to your rights or interests, we will notify affected users and, where required, the relevant authorities in Nepal, as soon as reasonably practicable and in accordance with applicable law.</p>
            </SubSection>
          </Section>

          <Section number="6" title="Your Rights">
            <SubSection title="6.1 Right to Access">
              <p>You may request a copy of the personal data we hold about you by emailing support@eruchi.com.np. We will respond within 30 days.</p>
            </SubSection>
            <SubSection title="6.2 Right to Correction">
              <p>If you believe any personal data we hold is inaccurate or incomplete, you may request correction. You may also update certain account information directly through the Platform.</p>
            </SubSection>
            <SubSection title="6.3 Right to Deletion">
              <p>You may request account deletion at any time. Your personal data will be anonymised as described in Section 7. Note that anonymised data that no longer identifies you is not subject to deletion under our retention policy.</p>
            </SubSection>
            <SubSection title="6.4 Right to Withdraw Consent">
              <p>Where we process your data based on consent (including marketing), you may withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing carried out prior to withdrawal.</p>
            </SubSection>
            <SubSection title="6.5 Right to Object">
              <p>You may object to the processing of your personal data for direct marketing at any time by using the unsubscribe mechanism in any marketing communication or by contacting us directly.</p>
            </SubSection>
            <p className="text-[12px] text-gray-500 italic">To exercise any of these rights, contact us at support@eruchi.com.np with the subject line "Privacy Request."</p>
          </Section>

          <Section number="7" title="Data Retention">
            <SubSection title="7.1 Active Accounts">
              <p>We retain your personal data for as long as your account remains active and for a reasonable period thereafter to comply with our legal obligations and resolve disputes.</p>
            </SubSection>
            <SubSection title="7.2 Account Deletion">
              <p>Upon deletion, all directly identifying information (name, email, phone number) will be removed or irreversibly anonymised within a reasonable timeframe. Anonymised Survey Response Data and platform activity logs will be retained for three (3) years for analytics integrity and security auditing. Once anonymised, data can no longer be linked back to you.</p>
            </SubSection>
            <SubSection title="7.3 Communications Records">
              <p>Support communication records will be retained for two (2) years following resolution of the relevant matter, after which they will be deleted or anonymised.</p>
            </SubSection>
          </Section>

          <Section number="8" title="Cookies and Tracking">
            <SubSection title="8.1 Use of Cookies">
              <p>The Platform uses cookies to maintain your login session and preferences, analyse Platform usage, and remember survey progress to prevent duplicate completions.</p>
            </SubSection>
            <SubSection title="8.2 Types of Cookies">
              <Bullet><span className="font-medium">Essential cookies:</span> Required for the Platform to function. These cannot be disabled.</Bullet>
              <Bullet><span className="font-medium">Analytical cookies:</span> Help us understand how users interact with the Platform. These may be disabled without affecting core functionality.</Bullet>
              <p>We do not use advertising or third-party tracking cookies for targeting advertisements.</p>
            </SubSection>
            <SubSection title="8.3 Managing Cookies">
              <p>You may disable non-essential cookies through your browser settings. Disabling certain cookies may affect Platform functionality.</p>
            </SubSection>
          </Section>

          <Section number="9" title="Children's Privacy">
            <p>The Platform is not directed at children under 16. We do not knowingly collect personal data from individuals under 16. If we become aware a user is under 16, we will promptly terminate the account and delete or anonymise all associated data. If you believe a child under 16 has registered, please notify us at support@eruchi.com.np.</p>
          </Section>

          <Section number="10" title="Changes to this Policy">
            <p>We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email or a prominent platform notice and update the effective date above. Continued use of the Platform following notification constitutes your acceptance of the updated Policy.</p>
          </Section>

        </div>

        {/* Contact block */}
        <div className="mt-8 rounded-xl bg-gray-50 border border-gray-100 px-5 py-4">
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Data &amp; Privacy Enquiries</p>
          <p className="text-[12px] text-gray-500">
            Contact us at{' '}
            <a href="mailto:support@eruchi.com.np" className="text-[#3399FF] hover:underline">
              support@eruchi.com.np
            </a>
            {' '}with subject line "Privacy Request" — Kathmandu, Nepal
          </p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;