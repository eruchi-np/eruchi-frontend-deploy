import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { sepSurveyAPI } from '../services/api';
import { 
  Loader2, 
  ArrowLeft, 
  Award, 
  AlertCircle, 
  SearchX,
  ChevronDown,
  FileText,
  Calendar,
  CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedContent from '../components/animations/AnimatedContent';

const descriptionStyle = {
  fontSize: "clamp(16px, 1.5vw, 20px)",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

const StandaloneSurveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await sepSurveyAPI.getAvailable({ limit: 20 });
        setSurveys(res.data.data || []);
      } catch (err) {
        console.error('Failed to load standalone surveys:', err);
        setError('Could not load available surveys. Please try again later.');
        toast.error('Failed to load surveys');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  const sortedSurveys = useMemo(() => {
    const now = new Date();
    
    let items = surveys.filter(survey => {
      if (survey.status !== 'published') return false;
      if (survey.startDate && now < new Date(survey.startDate)) return false;
      if (survey.endDate && now > new Date(survey.endDate)) return false;
      return true;
    });

    if (sortOrder === "credits-desc") {
      items.sort((a, b) => b.credits - a.credits);
    } else if (sortOrder === "credits-asc") {
      items.sort((a, b) => a.credits - b.credits);
    }
    
    return items;
  }, [surveys, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <AnimatedContent direction="vertical" distance={20} duration={0.6} className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-neutral-900" />
          <p className="text-neutral-600 font-medium" style={descriptionStyle}>Loading available surveys...</p>
        </AnimatedContent>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        <AnimatedContent direction="vertical" distance={30} duration={0.6} className="text-center max-w-md w-full">
          <AlertCircle className="h-16 w-16 text-neutral-900 mx-auto mb-6" />
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 300, lineHeight: 1.1 }} className="text-neutral-900 mb-4">
            Oops!
          </h2>
          <p className="text-neutral-600 mb-8" style={descriptionStyle}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full max-w-xs mx-auto px-6 py-4 text-white rounded-md transition-transform hover:scale-[1.02] font-medium"
            style={{ backgroundColor: "#134074" }}
          >
            Try Again
          </button>
        </AnimatedContent>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-[1314px] mx-auto px-4 sm:px-8 lg:px-10 py-10 lg:py-16">
        
        {/* Header Section */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-end justify-between border-b border-neutral-200 pb-12 mb-12">
          <AnimatedContent direction="vertical" distance={40} duration={0.8} className="flex flex-col">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center text-neutral-500 hover:text-neutral-900 w-fit mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Profile
            </button>
            
            <h1 
              className="text-neutral-900 mb-4"
              style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 300, lineHeight: 1.1 }}
            >
              Available Surveys
            </h1>
            
            <p 
              className="text-neutral-600 leading-snug max-w-2xl"
              style={descriptionStyle}
            >
              Share your thoughts, influence brands, and earn credits. Select a survey below to get started and unlock your rewards.
            </p>
          </AnimatedContent>

          {/* Quick Action Sorting */}
          {surveys.length > 0 && (
            <AnimatedContent direction="vertical" distance={40} duration={0.8} delay={0.15} className="w-full">
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full pl-5 pr-12 py-4 border border-neutral-300 rounded-md text-base text-neutral-900 outline-none transition-colors focus:border-neutral-900 bg-white appearance-none cursor-pointer"
                >
                  <option value="default">Default Ordering</option>
                  <option value="credits-desc">Reward: High → Low</option>
                  <option value="credits-asc">Reward: Low → High</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" size={18} />
              </div>
            </AnimatedContent>
          )}
        </div>

        {/* Catalog Output Grid */}
        {sortedSurveys.length === 0 ? (
          <AnimatedContent direction="vertical" distance={30} duration={0.7} delay={0.2}>
            <div className="bg-neutral-50 rounded-2xl p-10 sm:p-16 text-center border border-neutral-200 max-w-3xl mx-auto">
              <SearchX className="h-20 w-20 text-neutral-400 mx-auto mb-6" />
              <h3 
                className="text-neutral-900 mb-4"
                style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 400 }}
              >
                No surveys right now
              </h3>
              <p className="text-neutral-600 mb-8" style={descriptionStyle}>
                Check back soon! New standalone surveys tailored to your profile will appear here when they're published.
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="px-8 py-4 text-white rounded-md hover:scale-[1.02] transition-transform font-medium"
                style={{ backgroundColor: "#134074" }}
              >
                Return to Dashboard
              </button>
            </div>
          </AnimatedContent>
        ) : (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {sortedSurveys.map((survey, index) => (
              <AnimatedContent 
                key={survey._id} 
                direction="vertical" 
                distance={40} 
                duration={0.6} 
                delay={0.15 + (index % 2) * 0.1}
                className="w-full flex flex-col"
              >
                <div className="p-6 sm:p-8 w-full bg-white flex flex-col justify-between rounded-xl border border-neutral-200 hover:border-neutral-900 hover:shadow-sm transition-all h-full group">
                  
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-neutral-800" />
                      </div>
                      <h2 className="text-neutral-900 font-semibold text-[18px] sm:text-[20px] leading-tight">
                        {survey.title}
                      </h2>
                    </div>

                    <p className="text-neutral-500 text-sm sm:text-base line-clamp-2 mb-6 min-h-[40px]">
                      {survey.description}
                    </p>

                    {/* Meta Indicators Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6 pt-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1 text-neutral-800">
                          <Award className="h-4 w-4" />
                          <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                            {survey.credits} Credits
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400 pl-[22px]">Reward</span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1 text-neutral-800">
                          {survey.isMandatory ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <CheckSquare className="h-4 w-4" />
                          )}
                          <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                            {survey.isMandatory ? "Mandatory" : "Optional"}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400 pl-[22px]">Type</span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1 text-neutral-800">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                            {survey.endDate ? new Date(survey.endDate).toLocaleDateString() : "No Limit"}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400 pl-[22px]">Deadline</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-2 pt-5 border-t border-neutral-100">
                    <button
                      onClick={() => navigate(`/standalone-survey/${survey._id}`)}
                      className="text-white py-3 px-6 rounded-md font-medium transition-all hover:opacity-90 active:scale-[0.98] text-sm w-full sm:w-auto"
                      style={{ backgroundColor: "#134074" }}
                    >
                      Start Survey
                    </button>
                  </div>

                </div>
              </AnimatedContent>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneSurveys;