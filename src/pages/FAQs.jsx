import React, { useState } from "react";
import { Search, Mail, Instagram, ArrowRight } from "lucide-react";
import SearchBar from "../components/widgets/SearchBar";
// Import the AnimatedContent component
import AnimatedContent from "../components/animations/AnimatedContent";

const faqCategories = [
    {
        category: "Getting Started",
        faqs: [
            { id: 1, question: "What is eRuchi?", answer: "eRuchi is a rewards platform where you can earn exciting rewards, like discount vouchers; simply by sharing your opinions through surveys and other activities. Please note: we will keep you updated on when new rewards/features are added." },
            { id: 2, question: "Who can sign up on eRuchi?", answer: "Anyone can sign up on eRuchi! Registration is free and open to all eligible users. Simply create an account with a valid email address or phone number to get started." },
            { id: 3, question: "Is it free to join eRuchi?", answer: "Yes, joining eRuchi is completely free. There are no hidden fees or charges to sign up or participate in activities." },
            { id: 4, question: "How do I create an account?", answer: 'Visit our website, click "Join Us," and fill in your basic details such as your name, email address or phone number, and a password. Once verified, your account will be ready to use.' },
        ],
    },
    {
        category: "Surveys & Activities",
        faqs: [
            { id: 5, question: "How do I start earning rewards?", answer: "After logging in, head to your dashboard to see available surveys and activities. Complete them honestly and in full to earn points or rewards." },
            { id: 6, question: "Why am I not qualifying for some surveys?", answer: "Surveys are targeted to specific groups of users depending on their profile and performance. If you don't qualify for a particular survey, don't worry — new surveys are added regularly, and you'll be matched to the ones that fit your profile!" },
            { id: 7, question: "How long do surveys take to complete?", answer: "Survey lengths vary. The estimated completion time is shown before you begin, so you always know what to expect. Most surveys should take less than 2 minutes." },
            { id: 8, question: "Can I save a survey and complete it later?", answer: "This depends on the individual survey. Some surveys allow you to pause and return, while others must be completed in one session. We recommend completing a survey once you start to avoid losing your progress." },
        ],
    },
    {
        category: "Credits & Rewards",
        faqs: [
            { id: 9, question: "What kinds of rewards can I earn?", answer: "You can earn Ruchi credits after each successful completion of surveys. With Ruchi credits, you will be able to claim a variety of rewards including discount vouchers for different places like cafes, recreation, sports and more. The available rewards are displayed in the Rewards section of your dashboard." },
            { id: 10, question: "How do I redeem my rewards?", answer: "Once you've accumulated enough points, go to the Rewards section, choose your preferred reward, and follow the redemption steps. Most rewards are delivered digitally to your registered phone number or email." },
            { id: 11, question: "Is there a minimum points threshold before I can redeem?", answer: "Yes, there is a minimum points balance required before redemption. The exact threshold is shown in the Rewards section and varies by reward type." },
            { id: 12, question: "How long does it take to receive my reward after redemption?", answer: "Most rewards are processed instantly or within 24 hours. In rare cases, it may take up to 3–5 business days. If you haven't received your reward after that time, please contact our support team." },
            { id: 13, question: "Do my Ruchi credits expire?", answer: "While Ruchi credits do not have a fixed expiry period, if your account is inactive for more than 3 weeks, the accumulated credits may be slowly deducted from your account. We recommend redeeming your Ruchi credits regularly to avoid losing them." },
            { id: 14, question: "Can I transfer my Ruchi credits or rewards to someone else?", answer: "While you will not be able to transfer your Ruchi credits to another individual account, if you have already redeemed a reward then you are free to gift it to someone else – depending on the nature of the reward." },
        ],
    },
    {
        category: "Account & Privacy",
        faqs: [
            { id: 15, question: "Is my personal information safe with eRuchi?", answer: "Absolutely. eRuchi takes your privacy seriously. Your data is securely stored and never sold to third parties. We only use your information to match you with relevant surveys and improve your experience on the platform. Please read our Privacy Policy for full details." },
            { id: 16, question: "Why do I need to provide personal information during sign-up?", answer: "Your basic profile information helps us match you with the most relevant surveys. The more accurate your profile, the more survey opportunities you'll receive." },
            { id: 17, question: "Can I have more than one eRuchi account?", answer: "No. Each user is allowed only one account. Duplicate accounts may be suspended, and any associated Ruchi credits may be forfeited." },
            { id: 18, question: "How do I update my profile information?", answer: 'Log in to your account, go to "My Profile" or "Account Settings," and update your details. Keeping your profile up to date ensures you receive the most relevant survey invitations.' },
        ],
    },
    {
        category: "Support",
        faqs: [
            { id: 19, question: "What should I do if I have a problem with my account or a reward?", answer: 'If you experience any issues, please reach out to our support team through the "Contact Us" page or email us at support@eruchi.com.np. Include your registered email/phone number and a description of the issue, and our team will get back to you.' },
        ],
    },
];

const allFaqs = faqCategories.flatMap((cat) => cat.faqs);

const FAQCard = ({ faq }) => (
    <div className="p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {faq.question}
        </h2>
        <p className="text-base text-gray-700 leading-relaxed">{faq.answer}</p>
    </div>
);

const FAQs = () => {
    const [query, setQuery] = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (e) => {
        const value = e.target.value;
        setQuery(value);
        setHasSearched(value.trim() !== "");
    };

    const filteredFaqs = allFaqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(query.toLowerCase()) ||
            faq.answer.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <section className="py-20 bg-gray-50 text-black min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-16">
                    
                    {/* Header Section Animation */}
                    <AnimatedContent direction="vertical" distance={40} duration={0.8} className="flex flex-col space-y-8">
                        <h1 className="text-6xl font-light text-gray-900">
                            Frequently Asked Questions
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl text-justify">
                            Find answers to our most commonly asked questions below. Can't find what you're looking
                            for? Search below or reach out to our support team directly.
                        </p>

                        <SearchBar
                            value={query}
                            onChange={handleSearch}
                            placeholder="Search for questions..."
                            className="max-w-2xl"
                        />

                        {hasSearched && filteredFaqs.length === 0 && (
                            <p className="text-lg text-gray-600 italic bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                                We couldn't find what you're looking for, maybe
                                the FAQs below might help?
                            </p>
                        )}
                    </AnimatedContent>

                    {/* FAQ Cards Animation Section */}
                    {hasSearched ? (
                        <div className="grid grid-cols-1 gap-5">
                            {(filteredFaqs.length > 0 ? filteredFaqs : allFaqs).map((faq, index) => (
                                <AnimatedContent 
                                    key={faq.id} 
                                    direction="vertical" 
                                    distance={20} 
                                    duration={0.5} 
                                    delay={index * 0.05} // Subtle fast cascade stagger for results
                                    className="w-full"
                                >
                                    <FAQCard faq={faq} />
                                </AnimatedContent>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-12">
                            {faqCategories.map((cat) => (
                                <div key={cat.category}>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-gray-200">
                                        {cat.category}
                                    </h2>
                                    <div className="grid grid-cols-1 gap-5">
                                        {cat.faqs.map((faq, index) => (
                                            <AnimatedContent 
                                                key={faq.id} 
                                                direction="vertical" 
                                                distance={30} 
                                                duration={0.6} 
                                                delay={index * 0.08} // Staggers cards inside each visible block
                                                className="w-full"
                                            >
                                                <FAQCard faq={faq} />
                                            </AnimatedContent>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bottom Contact Section Animation */}
                    <AnimatedContent direction="vertical" distance={40} duration={0.8} threshold={0.15}>
                        <div className="bg-blue-50 rounded-3xl p-8 border-2 border-blue-200 text-center">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                Still have questions?
                            </h3>
                            <p className="text-lg text-gray-600 mb-6">
                                We're here to help! Reach out to us anytime.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <a
                                    href="mailto:support@eruchi.com.np"
                                    className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors shadow-lg"
                                >
                                    <Mail className="h-5 w-5" />
                                    Email
                                </a>
                                <a
                                    href="https://instagram.com/eruchi.np"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors shadow-lg"
                                >
                                    <Instagram className="h-5 w-5" />
                                    Instagram
                                </a>
                            </div>
                        </div>
                    </AnimatedContent>
                </div>
            </div>
        </section>
    );
};

export default FAQs;