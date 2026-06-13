// src/pages/Terms.jsx
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

const Terms = () => {
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
            <h1 className="text-xl font-light text-gray-900 tracking-tight">Terms &amp; Conditions</h1>
          </div>
        </div>

        {/* Meta */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-4 mb-8 flex flex-wrap gap-x-6 gap-y-1">
          <p className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">Effective:</span> 7 June 2025</p>
          <p className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">Version:</span> 1.0</p>
          <p className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">Jurisdiction:</span> Nepal</p>
          <p className="text-[11px] text-gray-500"><span className="font-semibold text-gray-700">Issued by:</span> E. Ruchi Pvt. Ltd.</p>
        </div>

        <p className="text-[13px] text-gray-500 leading-relaxed mb-8">
          This document governs your use of the eRuchi platform. Please read it in full before creating an account or using any eRuchi service. By using the platform you agree to these Terms in their entirety.
        </p>

        {/* Accordion Sections */}
        <div className="divide-y divide-gray-100 border-t border-gray-100">

          <Section number="1" title="Introduction and Acceptance">
            <p>Welcome to eRuchi. These Terms govern your access to and use of the eRuchi platform, including the website, web application, and all associated services, operated by E. Ruchi Pvt. Ltd.</p>
            <p>By creating an account, accessing the Platform, or submitting any survey response, you agree that you have read, understood, and accepted these Terms. If you do not agree, you must not use the Platform.</p>
            <p>These Terms constitute a legally binding agreement. We may update them from time to time and will notify you of material changes via email or a prominent platform notice. Continued use after such notice constitutes acceptance of the updated Terms.</p>
          </Section>

          <Section number="2" title="Eligibility and Account Registration">
            <SubSection title="2.1 Age Requirement">
              <p>You must be at least 16 years of age to create an account. This is an absolute minimum — no user under 16 may register, regardless of parental consent. By registering you confirm you are at least 16 years old. eRuchi reserves the right to terminate any account where the holder is reasonably believed to be under 16.</p>
            </SubSection>
            <SubSection title="2.2 Geographic Scope">
              <p>The Platform is designed for individuals in Kathmandu Valley, Nepal. Rewards, vouchers, and redemption services are available exclusively in the Kathmandu Valley area. We make no representations that the Platform is appropriate outside this region.</p>
            </SubSection>
            <SubSection title="2.3 Account Registration">
              <p>When registering you agree to:</p>
              <Bullet>Provide accurate, current, and complete information as prompted.</Bullet>
              <Bullet>Keep your credentials confidential and not share your password.</Bullet>
              <Bullet>Notify us immediately at support@eruchi.com.np of any unauthorised account access.</Bullet>
              <Bullet>Take responsibility for all activity that occurs under your account.</Bullet>
            </SubSection>
            <SubSection title="2.4 One Account Per User">
              <p>Each individual may maintain only one active account. Creating multiple accounts to accumulate credits or circumvent restrictions is strictly prohibited and may result in permanent termination of all associated accounts and forfeiture of all credits and vouchers.</p>
            </SubSection>
          </Section>

          <Section number="3" title="The Platform and Services">
            <SubSection title="3.1 How the Platform Works">
              <p>eRuchi is a consumer opinion platform. Registered users ("Panelists") complete short surveys about products, services, and brands in Kathmandu. In exchange, Panelists earn Ruchi Credits redeemable for rewards at participating local merchants.</p>
            </SubSection>
            <SubSection title="3.2 Survey Availability">
              <p>Survey availability may change at any time and is not guaranteed. The number of surveys available to you will vary based on your profile, location, survey quotas, and client requirements. eRuchi does not guarantee a minimum number of surveys per any period.</p>
            </SubSection>
            <SubSection title="3.3 Survey Eligibility">
              <p>Not every user qualifies for every survey. Eligibility is determined by screening criteria set by business clients and may not be disclosed. If you are screened out partway through, credits will not be awarded for the incomplete portion unless otherwise stated.</p>
            </SubSection>
            <SubSection title="3.4 Platform Availability">
              <p>We aim to make the Platform available at all times but do not guarantee uninterrupted access. The Platform may be temporarily unavailable due to maintenance, technical issues, or force majeure events.</p>
            </SubSection>
          </Section>

          <Section number="4" title="Ruchi Credits">
            <SubSection title="4.1 Earning Credits">
              <p>Credits are awarded upon successful completion of surveys. The credit value is displayed before you begin each survey. Credits are added after our verification of completion quality.</p>
            </SubSection>
            <SubSection title="4.2 Nature of Credits">
              <p>Ruchi Credits are a proprietary reward unit. They are not currency, money, or a financial instrument. They have no monetary value outside the Platform and cannot be transferred, sold, or exchanged for cash.</p>
            </SubSection>
            <SubSection title="4.3 Credit Expiry">
              <p>Credits do not expire while your account remains active and in good standing. Upon account termination — by you or by eRuchi — all accumulated credits are immediately and permanently forfeited with no compensation.</p>
            </SubSection>
            <SubSection title="4.4 Credit Adjustments">
              <p>eRuchi may adjust, void, or reclaim credits awarded due to technical error, fraudulent activity, or surveys determined to be of insufficient quality. We will make reasonable efforts to notify you of any material adjustment.</p>
            </SubSection>
            <SubSection title="4.5 Non-Transferability">
              <p>Credits are personal to the account holder and may not be transferred, gifted, sold, or assigned to another user under any circumstances.</p>
            </SubSection>
          </Section>

          <Section number="5" title="Rewards and Vouchers">
            <SubSection title="5.1 Redemption">
              <p>Panelists may redeem Ruchi Credits for Vouchers offered through the eRuchi rewards marketplace. Vouchers are subject to availability and may be modified or withdrawn at any time without prior notice.</p>
            </SubSection>
            <SubSection title="5.2 Voucher Delivery">
              <p>Upon successful redemption, a Voucher with a unique QR code will be sent to your registered email address. This QR code must be presented at the relevant merchant's point of sale. eRuchi is not responsible for Vouchers sent to an incorrect email address provided by you.</p>
            </SubSection>
            <SubSection title="5.3 Voucher Expiry">
              <p>Each Voucher carries an individual expiry date stated on the Voucher at issuance. eRuchi cannot extend expiry dates. Expired Vouchers are non-refundable and the credits used to redeem them will not be reinstated.</p>
            </SubSection>
            <SubSection title="5.4 Merchant Redemption">
              <p>Vouchers are redeemed exclusively at the merchant partner identified on the Voucher. eRuchi acts as an intermediary and is not a party to the transaction between you and the merchant. eRuchi is not responsible for goods or services provided by merchants. If you experience a problem redeeming a Voucher, contact support@eruchi.com.np.</p>
            </SubSection>
            <SubSection title="5.5 Forfeiture on Deletion">
              <p>All unredeemed Vouchers are permanently forfeited upon account deletion or termination. eRuchi will not reissue, replace, or compensate for forfeited Vouchers. We recommend redeeming all Vouchers before deleting your account.</p>
            </SubSection>
          </Section>

          <Section number="6" title="User Obligations and Prohibited Conduct">
            <SubSection title="6.1 Survey Integrity">
              <p>By completing surveys you agree to:</p>
              <Bullet>Provide honest, thoughtful, and genuine responses.</Bullet>
              <Bullet>Complete surveys yourself and not allow others to use your account.</Bullet>
              <Bullet>Not use automated tools, bots, or scripts to interact with the Platform.</Bullet>
            </SubSection>
            <SubSection title="6.2 General Prohibited Conduct">
              <p>You agree not to:</p>
              <Bullet>Use the Platform for any unlawful purpose under the laws of Nepal.</Bullet>
              <Bullet>Attempt to gain unauthorised access to the Platform or other users' accounts.</Bullet>
              <Bullet>Interfere with or damage the Platform or its servers.</Bullet>
              <Bullet>Reverse engineer or attempt to extract source code from the Platform.</Bullet>
              <Bullet>Scrape or harvest data from the Platform through unauthorised means.</Bullet>
              <Bullet>Engage in any activity that artificially inflates your Ruchi Credits balance.</Bullet>
            </SubSection>
            <SubSection title="6.3 Consequences">
              <p>Violations may result in account suspension or permanent termination, forfeiture of all credits and vouchers, exclusion of your responses from client data delivery, and legal action where material harm results.</p>
            </SubSection>
          </Section>

          <Section number="7" title="Intellectual Property">
            <SubSection title="7.1 Platform Content">
              <p>All content, features, and functionality of the Platform are the exclusive intellectual property of eRuchi or its licensors. You are granted a limited, non-exclusive, revocable licence to access and use the Platform solely for personal, non-commercial purposes.</p>
            </SubSection>
            <SubSection title="7.2 Survey Response Data">
              <p>All data you submit through surveys becomes the sole and exclusive property of eRuchi upon submission. You assign to eRuchi all rights, title, and interest in that data. eRuchi may use Survey Response Data for any purpose, including commercial purposes, without further obligation to you beyond the credits awarded.</p>
            </SubSection>
          </Section>

          <Section number="8" title="Disclaimers and Limitation of Liability">
            <SubSection title="8.1 Platform Provided 'As Is'">
              <p>The Platform is provided on an "as is" and "as available" basis without warranties of any kind. eRuchi does not warrant that the Platform will be uninterrupted or error-free. To the fullest extent permitted by law, all implied warranties are disclaimed.</p>
            </SubSection>
            <SubSection title="8.2 Limitation of Liability">
              <p>To the fullest extent permitted by the laws of Nepal, eRuchi shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Platform, including loss of credits or vouchers due to account termination or technical error.</p>
            </SubSection>
          </Section>

          <Section number="9" title="Account Termination">
            <SubSection title="9.1 Termination by You">
              <p>You may delete your account at any time by submitting a request through the Platform or by contacting support@eruchi.com.np. Upon deletion, all credits and vouchers are permanently forfeited and your data will be anonymised per our Privacy Policy.</p>
            </SubSection>
            <SubSection title="9.2 Termination by eRuchi">
              <p>eRuchi may suspend or terminate your account at any time without prior notice if you have violated these Terms, provided false information, or engaged in fraudulent or abusive behaviour. All credits and vouchers will be forfeited upon termination for cause.</p>
            </SubSection>
          </Section>

          <Section number="10" title="Governing Law and Dispute Resolution">
            <p>These Terms are governed by the laws of Nepal, including the Electronic Transactions Act 2063 (2006). Disputes will first be addressed through good-faith negotiation via support@eruchi.com.np. If unresolved within 30 days, either party may refer the matter to the courts of competent jurisdiction in Kathmandu, Nepal.</p>
          </Section>

        </div>

        {/* Contact block */}
        <div className="mt-8 rounded-xl bg-gray-50 border border-gray-100 px-5 py-4">
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Questions?</p>
          <p className="text-[12px] text-gray-500">
            Contact us at{' '}
            <a href="mailto:support@eruchi.com.np" className="text-[#3399FF] hover:underline">
              support@eruchi.com.np
            </a>
            {' '}— Kathmandu, Nepal
          </p>
        </div>

      </div>
    </div>
  );
};

export default Terms;