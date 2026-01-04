import React, { useState } from 'react';
import { Search, Mail, Instagram, MessageCircle } from 'lucide-react';

const faqs = [
    { id: 1, question: "Is eRuchi really free?", answer: "Yes! You'll receive free product samples—no cost, no hidden fees, and no obligation to buy anything." },
    { id: 2, question: "How can I be sure this isn't a scam?", answer: "We understand that free products may sound too good to be true. But we assure you that eRuchi partners with real brands that want to introduce their products to new audiences. Follow us on social media and check out our updates as we grow!" },
    { id: 3, question: "How exactly does eRuchi benefit from giving away free samples?", answer: "eRuchi serves as a bridge between consumers and brands. We connect you with products we believe you'll love, while brands pay us a service fee for facilitating this connection with engaged and curious consumers like you. We do this while maintaining strict consumer data privacy—brands never have access to identifiable data of individuals who receive their samples." },
    { id: 4, question: "How do I sign up to be a sampler?", answer: "Just fill out our quick survey on the website. It only takes a few minutes!", link: "/login", linkText: "Sign up here" },
    { id: 5, question: "Is there really no catch? Will I ever be asked to pay for something later?", answer: "No catch, no hidden charges. You'll never be asked to pay for samples.We simply connect you with brands looking for genuine product samplers." },
    { id: 6, question: "Do I have to review the products?", answer: "More frequent reviews help you get new products more often." },
    { id: 7, question: "What personal information do I have to share to sign up?", answer: "We only ask for information relevant to matching you with the right products, such as your interests and basic details like name, location, and email." },
    { id: 8, question: "How does eRuchi use my data?", answer: "Your data may be used to derive market analytics to be shared with brands, similar to insights available on social media platforms. However, an individual's personal, identifiable data is never shared and we make sure that your privacy is always protected." },
    { id: 9, question: "Why haven't I heard of this before? How long has eRuchi been around?", answer: "Product sampling is a new concept in Nepal, and we're one of the first to do it with absolutely no strings attached. eRuchi is growing fast, and you'll be seeing a lot more of us soon!" },
    { id: 10, question: "Who is running eRuchi? Is this backed by a known company?", answer: "eRuchi is operated by E. Ruchi Pvt. Ltd. We work directly with brands to make sampling possible and are committed to providing an authentic experience." },
    { id: 11, question: "How exactly do you decide what products to send me?", answer: "We match products to your interests based on your survey responses. Our goal is to send you samples that fit your preferences and lifestyle." },
    { id: 12, question: "Do I have to choose from a list, or do you pick everything for me?", answer: "You won't need to choose specific products. Instead, we carefully select and send samples that align with your interests based on your profile." },
    { id: 13, question: "How long does it take to get my first sample after signing up?", answer: "It varies depending on availability and product matches. We'll notify you once you've been selected for a sample, so keep an eye on your inbox!" },
    { id: 14, question: "Will I get samples regularly, or is it random?", answer: "It depends on how well your profile matches with brands. The better the match, the more likely you are to receive samples." },
    { id: 15, question: "Can I request specific products?", answer: "No, but we ensure that the samples you receive align with your interests." },
    { id: 16, question: "If I sign up and don't like it, can I stop at any time?", answer: "Yes! You can opt out of receiving samples whenever you want." },
    { id: 17, question: "Will I get spammed with emails and messages after signing up?", answer: "No, we respect your inbox! We'll only contact you when it's relevant—such as when you're selected for a sample." },
    { id: 18, question: "What kind of products can I expect to receive? Are they good brands?", answer: "You can receive snacks, beverages, personal care items, and other lifestyle products that match your interests. We work with brands that meet our quality standards." },
    { id: 19, question: "Are the samples full-sized or just small trial packs?", answer: "It depends on the brand. Some samples are full-sized products, while others are trial versions designed to give you a taste before committing." },
    { id: 20, question: "Are the products safe and legitimate? Do they have proper labeling and expiry dates?", answer: "Yes! We only work with brands that provide authentic, well-labeled, and properly stored products. We ensure all items meet safety and quality standards." },
    { id: 21, question: "Do I have to use the products, or can I give them to someone else?", answer: "You can share them if you'd like! However, we recommend trying them yourself since they're matched to your interests." },
    { id: 22, question: "What if I don't like the sample I receive?", answer: "That's completely fine! Your feedback helps brands improve and send better-matched products in the future." },
    { id: 23, question: "If I update my preferences, will I start getting different kinds of products?", answer: "Yes! You can update your interests once every two months to make sure you keep receiving samples that match your changing tastes." },
    { id: 24, question: "Can I refer my friends to eRuchi?", answer: "Absolutely! The more, the merrier. Sharing great discoveries is what we're all about. In fact, when you refer friends, you earn Ruchi Credits, which boost your chances of receiving more exciting samples." },
    { id: 25, question: "What is the Ruchi Credit system?", answer: "Ruchi Credits are our way of rewarding engaged users and increasing their chances of receiving premium samples. You earn Credits by accepting and reviewing samples, referring friends, making purchases, and participating in surveys. The more active you are, the more Credits you accumulate—boosting your priority in future sampling campaigns." },
    { id: 26, question: "Can businesses apply to have their products sampled on eRuchi?", answer: "Yes! If you're a brand interested in partnering with us, reach out through our website or email us." },
    { id: 27, question: "How do I contact eRuchi if I have more questions?", answer: "You can reach out to us via our email at support@eruchi.com.np or social media pages. We're happy to help!" }
];

const FAQs = () => {
    const [query, setQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const searchValue = (e) => {
        const value = e.target.value;
        setQuery(value);
        setHasSearched(value.trim() !== '');
    };

    const filteredFaqs = faqs.filter(
        faq =>
            faq.question.toLowerCase().includes(query.toLowerCase()) ||
            faq.answer.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <section className='py-20 bg-gray-50 text-black min-h-screen'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex flex-col gap-16'>
                    {/* Header Section */}
                    <div className='flex flex-col space-y-8'>
                        <h1 className='text-5xl lg:text-6xl font-bold text-gray-900'>
                            Frequently Asked Questions
                        </h1>
                        <p className='text-xl text-gray-600 leading-relaxed max-w-3xl'>
                            Find answers to our most commonly asked questions below. Search for questions or contact
                            us for your queries.
                        </p>
                        
                        {/* Search Bar */}
                        <div className='relative max-w-2xl'>
                            <input
                                type='text'
                                onChange={searchValue}
                                placeholder='Search for questions...'
                                className='w-full text-lg outline-none py-4 px-6 pr-14 border-2 border-gray-300 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all'
                            />
                            <Search className='absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400' />
                        </div>

                        {hasSearched && filteredFaqs.length === 0 && (
                            <p className="text-lg text-gray-600 italic bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                                We couldn't find what you're looking for, maybe the FAQs below might help?
                            </p>
                        )}
                    </div>

                    {/* FAQ Cards */}
                    <div className='grid grid-cols-1 gap-5'>
                        {(hasSearched ? filteredFaqs : faqs).map((faq) => (
                            <div 
                                key={faq.id} 
                                className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'
                            >
                                <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                    {faq.question}
                                </h2>
                                <p className='text-base text-gray-700 leading-relaxed'>
                                    {faq.answer}
                                    {faq.link && (
                                        <a 
                                            href={faq.link}
                                            className='ml-2 text-blue-500 hover:text-blue-600 font-medium underline'
                                        >
                                            {faq.linkText}
                                        </a>
                                    )}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Contact Section */}
                    <div className='bg-blue-50 rounded-3xl p-8 border-2 border-blue-200 text-center'>
                        <h3 className='text-2xl font-bold text-gray-900 mb-3'>Still have questions?</h3>
                        <p className='text-lg text-gray-600 mb-6'>
                            We're here to help! Reach out to us anytime.
                        </p>
                        <div className='flex flex-wrap justify-center gap-4'>
                            <a 
                                href='mailto:support@eruchi.com.np'
                                className='inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-black-100 transition-colors shadow-lg'
                            >
                                <Mail className='h-5 w-5' />
                                Email
                            </a>
                           
                            <a 
                                href='https://instagram.com/eruchi.np'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg'
                            >
                                <Instagram className='h-5 w-5' />
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQs;