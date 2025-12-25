import React, { useState, useEffect } from 'react';
import { Search, X, Check, Info } from 'lucide-react';
import { interestsData } from '../../../utils/interests-data'; // Adjust path as needed

const Psychographics = ({ formData, updateFormData }) => {
  const [interests, setInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState(formData.selectedInterests || []);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpacityClass, setDialogOpacityClass] = useState('opacity-0');
  const searchInputRef = React.useRef(null);

  useEffect(() => {
    if (showWelcomeDialog) {
      setDialogOpacityClass('opacity-0');
      const timer = setTimeout(() => {
        setDialogOpacityClass('opacity-100');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeDialog]);

  useEffect(() => {
    if (showInfoDialog) {
      setDialogOpacityClass('opacity-0');
      const timer = setTimeout(() => {
        setDialogOpacityClass('opacity-100');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showInfoDialog]);

  // Focus search input when modal opens
  useEffect(() => {
    if (showInterestsModal && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [showInterestsModal]);

  // Load interests from your interests data file
  useEffect(() => {
    const loadInterests = () => {
      try {
        // Shuffle interests randomly for display
        const shuffledInterests = [...(interestsData || [])]
          .sort(() => Math.random() - 0.5);
        setInterests(shuffledInterests);
      } catch (error) {
        console.error("Failed to load interests:", error);
      }
    };

    loadInterests();
  }, []);

  const handleOpenDialog = () => {
    setShowInfoDialog(true);
  };

  const handleCloseDialog = () => {
    setDialogOpacityClass('opacity-0');
    setTimeout(() => {
      setShowInfoDialog(false);
    }, 500);
  };

  const handleCloseWelcomeDialog = () => {
    setDialogOpacityClass('opacity-0');
    setTimeout(() => {
      setShowWelcomeDialog(false);
    }, 500);
  };

  const filteredInterests = interests.filter(
    (interest) =>
      interest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (interest.hiddenkeys && interest.hiddenkeys.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleInterest = (interest) => {
    const current = [...selectedInterests];
    const index = current.findIndex((i) => i.id === interest.id);

    if (index === -1) {
      if (current.length < 5) {
        current.push({
          ...interest,
          intensity: 0.900 // High intensity for selected interests
        });
        setSelectedInterests(current);
        updateFormData('selectedInterests', current);
      } else {
        // Show error message (you can add toast here)
        console.error("You can select a maximum of 5 interests");
        return;
      }
    } else {
      current.splice(index, 1);
      setSelectedInterests(current);
      updateFormData('selectedInterests', current);
    }
  };

  const removeInterest = (interest) => {
    const current = selectedInterests.filter((i) => i.id !== interest.id);
    setSelectedInterests(current);
    updateFormData('selectedInterests', current);
  };

  const openInterestsModal = () => {
    setShowInterestsModal(true);
    setSearchTerm('');
  };

  const closeInterestsModal = () => {
    setShowInterestsModal(false);
    setSearchTerm('');
  };

  const clearAllSelections = () => {
    setSelectedInterests([]);
    updateFormData('selectedInterests', []);
  };

  // Check if search term has at least 3 characters
  const shouldShowInterests = searchTerm.trim().length >= 3;

  return (
    <div>
      {showWelcomeDialog && (
        <div
          className={`
            fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#3399ff] p-0
            transition-opacity duration-500 ease-in-out 
            ${dialogOpacityClass}
          `}
        >
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center max-w-lg mx-auto px-4">
              <h1 className="text-4xl font-bold mb-8 text-white text-center">Let's Discover What Makes You Unique</h1>
              <div className="text-xl mb-12 space-y-6 text-white text-center">
                <p>
                  Tell us what's at the <strong>core</strong> of what defines you.
                  <br />
                  Your selections will help us match you with product samples that truly fit your personality and passions.
                </p>
              </div>
              <button
                onClick={handleCloseWelcomeDialog}
                className="bg-white text-[#3399ff] hover:bg-gray-100 text-xl px-12 py-4 rounded-xl font-bold mx-auto transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoDialog && (
        <div className={`
          fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4
          transition-opacity duration-500 ease-in-out 
          ${dialogOpacityClass}
        `}>
          <div className="bg-[#3399ff] rounded-xl shadow-2xl p-6 md:p-8 max-w-xl w-full text-white text-center overflow-y-auto max-h-[calc(100vh-5rem)]">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white text-center">
              Tell us 3 to 5 things that define who you are.
            </h1>
            <p className="text-base md:text-lg mb-6 text-white text-center">
              We're here to help you discover more about yourself—one click at a time.
            </p>
            
            <p className="text-xl md:text-2xl font-bold mb-3 text-white text-center">
              Try answering one of these questions to explore what defines you
            </p>
            <ul className="list-none space-y-1.5 text-white text-left mx-auto max-w-md text-sm md:text-base mb-6">
              <li>What are your favourite things to do?</li>
              <li>What's something you love talking about with friends?</li>
              <li>Are you currently trying to improve or learn something new?</li>
              <li>What makes you feel most you?</li>
              <li>What kind of content do you keep coming back to online?</li>
            </ul>
            <button
              onClick={handleCloseDialog}
              className="bg-white text-[#3399ff] hover:bg-gray-100 text-base md:text-lg px-10 py-3 rounded-xl font-bold mx-auto transition-colors"
            >
              Sure!
            </button>
          </div>
        </div>
      )}

      {showInterestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Header with search */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Select Your Interests</h3>
                <button
                  onClick={closeInterestsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type at least 3 characters to search interests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="flex-1 overflow-auto">
              {!shouldShowInterests ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">Start typing to search</div>
                  <div className="text-sm">Type at least 3 characters to see interests</div>
                </div>
              ) : filteredInterests.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">No interests found</div>
                  <div className="text-sm">Try searching with different keywords</div>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredInterests.map((interest) => {
                    const isSelected = selectedInterests.some((i) => i.id === interest.id);
                    
                    return (
                      <div
                        key={interest.id}
                        className={`p-4 cursor-pointer rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleInterest(interest)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-lg mb-1">
                            {interest.name}
                          </div>
                          {interest.info && (
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {interest.info}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {shouldShowInterests ? (
                    <>{filteredInterests.length} interest{filteredInterests.length !== 1 ? 's' : ''} found</>
                  ) : (
                    <>Type to search</>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Selected: {selectedInterests.length}/5
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Interests & Personality</h2>
      <p className="text-gray-600 mb-8">Tell us 3 to 5 things that define who you are</p>

      <div className="space-y-6">
        {/* Selection Trigger - Similar to SearchableSelect */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Interests
          </label>
          
          <div
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center justify-between bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
            onClick={openInterestsModal}
          >
            <div className="flex-1">
              {selectedInterests.length > 0 ? (
                <span className="font-medium text-gray-900">
                  {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                </span>
              ) : (
                <span className="text-gray-400">Click to select interests...</span>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-2">
              {selectedInterests.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAllSelections();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Selected Interests Display */}
        {selectedInterests.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Your Selected Interests:</span>
              <button
                onClick={clearAllSelections}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedInterests.map((interest) => (
                <div 
                  key={interest.id} 
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-xl text-sm font-medium border border-blue-200"
                >
                  {interest.name}
                  <button 
                    onClick={() => removeInterest(interest)} 
                    className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleOpenDialog}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Need help choosing?
          </button>
          
          <div className="text-sm text-gray-500">
            {selectedInterests.length < 3 ? (
              <span className="text-orange-600">
                Select at least {3 - selectedInterests.length} more interest{3 - selectedInterests.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-green-600">
                ✓ Ready to continue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Step 4 of 4</span>
          <span className="font-medium text-blue-600">Psychographics</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Psychographics;