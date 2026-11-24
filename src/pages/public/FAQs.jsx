import React, { useEffect, useMemo, useState } from "react";
import { Mail, Instagram } from "lucide-react";
import SearchBar from "../../components/widgets/SearchBar";
import AnimatedContent from "../../components/animations/AnimatedContent";
import { INSTAGRAM_URL, SUPPORT_EMAIL, WHATSAPP_URL } from "../../utils/siteConfig";

const WhatsAppIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.45-8.44zM12.07 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.98c0 5.45-4.44 9.89-9.89 9.89zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
    </svg>
);

const contactLinkClass =
    "inline-flex items-center justify-center gap-2 bg-black text-white h-12 w-12 sm:w-auto sm:px-6 rounded-full text-base font-medium hover:bg-gray-800 transition-colors shadow-lg";
import { faqAPI } from "../../services/api";

const groupFaqs = (faqs) => {
    const map = new Map();
    for (const faq of faqs) {
        const key = faq.category || "General";
        if (!map.has(key)) {
            map.set(key, {
                category: key,
                categoryOrder: faq.categoryOrder ?? 0,
                faqs: [],
            });
        }
        map.get(key).faqs.push(faq);
    }
    return [...map.values()]
        .sort((a, b) => a.categoryOrder - b.categoryOrder || a.category.localeCompare(b.category))
        .map((group) => ({
            ...group,
            faqs: [...group.faqs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        }));
};

const FAQCard = ({ faq }) => (
    <div className="p-5 sm:p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all">
        <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
            {faq.question}
        </h2>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
    </div>
);

const FAQs = () => {
    const [query, setQuery] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const loadFaqs = async () => {
            try {
                const response = await faqAPI.getAll({ skipErrorToast: true });
                if (!cancelled) {
                    setFaqs(response.data.data || []);
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to load FAQs", err);
                if (!cancelled) {
                    setError("We couldn't load the FAQs right now. Please try again.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadFaqs();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setQuery(value);
        setHasSearched(value.trim() !== "");
    };

    const faqCategories = useMemo(() => groupFaqs(faqs), [faqs]);
    const filteredFaqs = faqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(query.toLowerCase()) ||
            faq.answer.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <section className="py-10 sm:py-20 bg-gray-50 text-black min-h-screen pb-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-10 sm:gap-16">
                    
                    {/* Header Section Animation */}
                    <AnimatedContent direction="vertical" distance={40} duration={0.8} className="flex flex-col space-y-6 sm:space-y-8">
                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light text-gray-900">
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

                        {hasSearched && filteredFaqs.length === 0 && faqs.length > 0 && (
                            <p className="text-lg text-gray-600 italic bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                                We couldn't find what you're looking for, maybe
                                the FAQs below might help?
                            </p>
                        )}
                    </AnimatedContent>

                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading FAQs...</div>
                    ) : error ? (
                        <div className="bg-white rounded-2xl border-2 border-red-100 p-6 text-red-700">
                            {error}
                        </div>
                    ) : faqs.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 text-gray-600">
                            No FAQs have been published yet.
                        </div>
                    ) : hasSearched ? (
                        <div className="grid grid-cols-1 gap-5">
                            {(filteredFaqs.length > 0 ? filteredFaqs : faqs).map((faq, index) => (
                                <AnimatedContent 
                                    key={faq._id || faq.id || `${faq.question}-${index}`} 
                                    direction="vertical" 
                                    distance={20} 
                                    duration={0.5} 
                                    delay={index * 0.05}
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
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-gray-200">
                                        {cat.category}
                                    </h2>
                                    <div className="grid grid-cols-1 gap-5">
                                        {cat.faqs.map((faq, index) => (
                                            <AnimatedContent 
                                                key={faq._id || faq.id || `${faq.question}-${index}`} 
                                                direction="vertical" 
                                                distance={30} 
                                                duration={0.6} 
                                                delay={index * 0.08}
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
                        <div id="contact" className="scroll-mt-24 bg-blue-50 rounded-3xl p-5 sm:p-8 border-2 border-blue-200 text-center">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                                Still have questions?
                            </h3>
                            <p className="text-lg text-gray-600 mb-6">
                                We're here to help! Reach out to us anytime.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <a
                                    href={`mailto:${SUPPORT_EMAIL}`}
                                    aria-label="Email"
                                    className={contactLinkClass}
                                >
                                    <Mail className="h-5 w-5" />
                                    <span className="hidden sm:inline">Email</span>
                                </a>
                                <a
                                    href={INSTAGRAM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                    className={contactLinkClass}
                                >
                                    <Instagram className="h-5 w-5" />
                                    <span className="hidden sm:inline">Instagram</span>
                                </a>
                                <a
                                    href={WHATSAPP_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="WhatsApp"
                                    className={contactLinkClass}
                                >
                                    <WhatsAppIcon className="h-5 w-5" />
                                    <span className="hidden sm:inline">WhatsApp</span>
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
