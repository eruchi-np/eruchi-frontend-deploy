import React from 'react';
import { Mail, Instagram, FileText } from 'lucide-react';

const TermsPage = () => {
    return (
        <section className='py-20 bg-gray-50 text-black min-h-screen'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex flex-col gap-16'>
                    {/* Header Section */}
                    <div className='flex flex-col space-y-8'>
                        <div className='inline-flex items-center gap-2 text-blue-500 font-medium'>
                            <FileText className='h-5 w-5' />
                            <span className='text-sm uppercase tracking-wider'>eRuchi Survey Participation</span>
                        </div>
                        <h1 className='text-5xl lg:text-6xl font-bold text-gray-900'>
                            Terms & Conditions
                        </h1>
                        <p className='text-xl text-gray-600 leading-relaxed max-w-3xl'>
                            This agreement outlines the rights and responsibilities of both eRuchi and survey participants, ensuring transparency, fairness, and compliance with ethical data-handling practices. Please read these terms carefully before proceeding.
                        </p>
                    </div>

                    {/* Terms Content */}
                    <div className='grid grid-cols-1 gap-5'>
                        {/* Purpose of Data Collection */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Purpose of Data Collection
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                The data collected through this survey plays a crucial role in enhancing eRuchi's targeted product sampling services and conducting meaningful market analysis. Our mission is to connect consumers with product samples that align with their specific interests while simultaneously generating valuable insights that inform marketing strategies. By participating, you contribute to a system that helps brands understand consumer behavior and preferences while receiving product samples tailored to your profile.
                            </p>
                        </div>

                        {/* Data We Collect */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Data We Collect
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                Participants agree to provide various types of information, including personal details such as name, phone number, email address, gender, nationality, and date of birth, alongside demographic details, which may include first language, education level, marital status, residential address, occupation, monthly income, and ethnicity. Additionally, interest-based information, which, in addition to participants' interests, consists of details regarding product preferences, purchase frequency, and brand preferences across selected categories, will also be collected. The combination of this data allows eRuchi to match participants with relevant product samples and refine the quality and effectiveness of our services.
                            </p>
                        </div>

                        {/* Use of Data */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Use of Data
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                The primary function of the data collected is to facilitate the accurate matching of participants with relevant product samples and to conduct an extensive analysis of aggregated consumer trends, which contributes to the ongoing optimization of the sampling experience. In addition to its primary purpose, the collected data may also be utilized for generating consumer insights and reports that assist in shaping eRuchi's marketing and operational strategies. While eRuchi may explore additional uses of this data in the future, any such utilization will always be in strict compliance with ethical data-handling principles, ensuring that personal and identifiable information is neither shared nor disclosed to external parties without explicit participant consent.
                            </p>
                        </div>

                        {/* Data Sharing and Sale */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Data Sharing and Sale
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                eRuchi upholds a strict confidentiality policy concerning personal data, ensuring that raw, identifiable information is never sold or shared with third parties under any circumstances, except when legally mandated by relevant authorities who can demonstrate a legitimate requirement for legal enforcement purposes. However, in certain cases, anonymized and aggregated data may be used for marketing analysis, industry research, or commercial reporting purposes. Should a scenario arise where the sharing of specific data is deemed necessary, explicit and informed consent will be sought from the participant before proceeding.
                            </p>
                        </div>

                        {/* Disclaimer on Sample Availability */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Disclaimer on Sample Availability
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                Participation in the survey does not, in any way, guarantee access to product samples. The selection and distribution of samples are entirely dependent on various factors, including but not limited to the availability of client campaigns, the alignment between participant preferences and product offerings, and the qualification criteria defined for each specific sampling campaign. eRuchi reserves full discretion in determining the frequency and selection of samples, which may fluctuate due to campaign schedules, supply constraints, or specific product niche requirements.
                            </p>
                        </div>

                        {/* Opt-Out and Data Modification */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Opt-Out and Data Modification
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                Participants retain the right to opt out of eRuchi's services at any given time. Should a participant choose to opt out, their data will be scheduled for permanent deletion from eRuchi's systems within a period of ninety days. Furthermore, participants are permitted to request modifications or updates to their submitted data; however, to prevent fraudulent activity and ensure fair distribution of samples, such modification requests may only be made at an interval of no less than sixty days.
                            </p>
                        </div>

                        {/* Data Retention */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Data Retention
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                All data collected through the survey will be retained indefinitely unless one of the following conditions is met: the participant explicitly opts out and requests that their data be permanently deleted, or eRuchi ceases operations, at which point all stored data will be completely erased from our systems.
                            </p>
                        </div>

                        {/* Communication Frequency */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Communication Frequency
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                Participants will be contacted by eRuchi regarding sample opportunities only on an as-needed basis, with communication frequency generally ranging from once every two to three months to a maximum of twice per year. It is important to note that participants retain full discretion over whether they wish to accept or decline any given sample offer, and their decision to do so will not impact their eligibility for future sampling opportunities.
                            </p>
                        </div>

                        {/* Eligibility */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Eligibility
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                Participation in the survey is strictly restricted to individuals who are sixteen years of age or older. There are no additional eligibility requirements beyond this minimum age restriction, meaning that anyone meeting this criterion may voluntarily participate in the survey without any further limitations.
                            </p>
                        </div>

                        {/* Data Security and Storage */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Data Security and Storage
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                All data collected is securely stored on cloud-based servers that are equipped with robust encryption and access control mechanisms designed to prevent unauthorized access. Only a limited number of authorized eRuchi personnel are granted access to raw survey data, ensuring that personal information is handled responsibly and safeguarded against any potential security breaches. eRuchi continuously updates and enhances its security practices to remain in alignment with globally recognized data protection standards.
                            </p>
                        </div>

                        {/* Compliance and Ethical Standards */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Compliance and Ethical Standards
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                Although the enforcement of data protection laws in Nepal remains limited, eRuchi places the highest priority on ethical data use, transparency, and the safeguarding of consumer privacy. Our data-handling protocols adhere to internationally accepted best practices, ensuring that participant rights and data security are never compromised.
                            </p>
                        </div>

                        {/* Consent and Agreement */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Consent and Agreement
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                By choosing to participate in this survey, you explicitly acknowledge that you have read, understood, and agreed to the terms and conditions outlined in this document. Your agreement is confirmed by checking the designated confirmation box provided during the survey process. While reviewing the full terms and conditions document is encouraged, it is not a mandatory prerequisite for participation.
                            </p>
                        </div>

                        {/* Liability Limitations */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Liability Limitations
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                eRuchi is not liable for any inaccuracies or omissions in the data provided by participants. Furthermore, eRuchi retains the right to modify its sampling criteria, campaign structure, or participant eligibility requirements at its sole discretion and without prior notice to participants.
                            </p>
                        </div>

                        {/* Contact Information */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Contact Information
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                Participants who have questions, concerns, or require further clarification regarding the terms and conditions, data use policies, or their rights under this agreement may reach out to eRuchi by contacting us at{' '}
                                <a 
                                    href="mailto:support@eruchi.com.np" 
                                    className='text-blue-500 hover:text-blue-600 font-medium underline'
                                >
                                    support@eruchi.com.np
                                </a>.
                            </p>
                        </div>

                        {/* Limitation of Liability for Data Breaches */}
                        <div className='p-8 w-full bg-white flex flex-col rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all'>
                            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                                Limitation of Liability for Data Breaches
                            </h2>
                            <p className='text-base text-gray-700 leading-relaxed'>
                                While eRuchi employs cutting-edge security measures designed to protect participant data, it is important to recognize that no system can guarantee absolute protection against unauthorized access or data breaches. In the unlikely event of a data breach, eRuchi will take all necessary steps to mitigate potential risks and will notify affected parties in accordance with relevant data protection guidelines. By agreeing to these terms, participants acknowledge the inherent risks associated with digital data storage and accept that eRuchi cannot be held liable for damages resulting from circumstances beyond its control, including but not limited to cyber-attacks, technical failures, or other unforeseen security vulnerabilities.
                            </p>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className='bg-blue-50 rounded-3xl p-8 border-2 border-blue-200 text-center'>
                        <h3 className='text-2xl font-bold text-gray-900 mb-3'>Questions about our terms?</h3>
                        <p className='text-lg text-gray-600 mb-6'>
                            We're here to help clarify anything you need.
                        </p>
                        <div className='flex flex-wrap justify-center gap-4'>
                            <a 
                                href='mailto:support@eruchi.com.np'
                                className='inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors shadow-lg'
                            >
                                <Mail className='h-5 w-5' />
                                Email
                            </a>
                           
                            <a 
                                href='https://instagram.com/eruchi.np'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-base font-medium hover:bg-gray-800 transition-colors shadow-lg'
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

export default TermsPage;