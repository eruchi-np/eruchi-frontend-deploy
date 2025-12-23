import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { groupedMunicipalities, getMaxWards, municipalityData } from '../../../utils/municipalityData';

const AddressInfo = ({ formData, updateFormData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] = useState(false);
  const [wardError, setWardError] = useState('');

  // Filter municipalities based on search
  const filteredMunicipalities = Object.entries(groupedMunicipalities).reduce((acc, [type, municipalities]) => {
    const filtered = municipalities.filter(municipality =>
      municipality.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[type] = filtered;
    }
    return acc;
  }, {});

  // Validate ward number when municipality changes
  useEffect(() => {
    if (formData.municipality && formData.wardNumber) {
      validateWardNumber(formData.wardNumber);
    }
  }, [formData.municipality]);

  const validateWardNumber = (ward) => {
    if (!formData.municipality) {
      setWardError('Please select a municipality first');
      return false;
    }

    const maxWards = getMaxWards(formData.municipality);
    const wardNum = parseInt(ward);

    if (isNaN(wardNum) || wardNum < 1) {
      setWardError('Ward number must be a positive number');
      return false;
    }

    if (wardNum > maxWards) {
      setWardError(`This municipality only has ${maxWards} wards`);
      return false;
    }

    setWardError('');
    return true;
  };

  const handleWardChange = (ward) => {
    updateFormData('wardNumber', ward);
    if (ward) {
      validateWardNumber(ward);
    } else {
      setWardError('');
    }
  };

  const handleMunicipalitySelect = (municipality) => {
    updateFormData('municipality', municipality.name);
    setShowMunicipalityDropdown(false);
    setSearchTerm('');
    
    // Clear ward number if the new municipality has fewer wards
    if (formData.wardNumber) {
      const maxWards = municipality.wards;
      const currentWard = parseInt(formData.wardNumber);
      if (currentWard > maxWards) {
        updateFormData('wardNumber', '');
        setWardError(`Please select a ward number between 1 and ${maxWards}`);
      }
    }
  };

  const getSelectedMunicipalityInfo = () => {
    if (!formData.municipality) return null;
    return municipalityData.find(m => m.name === formData.municipality);
  };

  const selectedMunicipality = getSelectedMunicipalityInfo();

  // Create unique key for each municipality by combining name, type, and index
  const createMunicipalityKey = (municipality, index, type) => {
    return `${municipality.name}-${municipality.type}-${type}-${index}`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Address Information</h2>
      <p className="text-gray-600 mb-8">Tell us where you live in Nepal</p>
      
      <div className="space-y-8">
        {/* Municipality Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Municipality / Rural Municipality
          </label>
          
          <div className="relative">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for your municipality..."
                value={searchTerm || formData.municipality || ''}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!showMunicipalityDropdown) setShowMunicipalityDropdown(true);
                }}
                onFocus={() => setShowMunicipalityDropdown(true)}
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              />
            </div>

            {/* Municipality Dropdown */}
            {showMunicipalityDropdown && (
              <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg shadow-gray-100 max-h-80 overflow-auto">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Select Municipality</span>
                    <button
                      onClick={() => setShowMunicipalityDropdown(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="py-2">
                  {Object.keys(filteredMunicipalities).length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <div>No municipalities found</div>
                      <div className="text-sm">Try searching with different keywords</div>
                    </div>
                  ) : (
                    Object.entries(filteredMunicipalities).map(([type, municipalities]) => (
                      <div key={type}>
                        <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {type}
                          </span>
                        </div>
                        {municipalities.map((municipality, index) => (
                          <div
                            key={createMunicipalityKey(municipality, index, type)} // Use unique key with index
                            className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            onClick={() => handleMunicipalitySelect(municipality)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {municipality.name}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {municipality.type} • {municipality.wards} wards
                                </div>
                              </div>
                              {formData.municipality === municipality.name && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Municipality Info */}
          {selectedMunicipality && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-green-600 mr-2" />
                <div>
                  <span className="font-medium text-green-800">
                    {selectedMunicipality.name}
                  </span>
                  <span className="text-green-600 text-sm ml-2">
                    ({selectedMunicipality.type} • {selectedMunicipality.wards} wards)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ward Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ward Number
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={selectedMunicipality ? selectedMunicipality.wards : 99}
              value={formData.wardNumber || ''}
              onChange={(e) => handleWardChange(e.target.value)}
              placeholder="Enter ward number"
              disabled={!formData.municipality}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                !formData.municipality 
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : wardError 
                    ? 'border-red-300 bg-white' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            />
            {!formData.municipality && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-xl flex items-center justify-center">
                <span className="text-sm text-gray-500"></span>
              </div>
            )}
          </div>

          {/* Ward Validation Messages */}
          {wardError && (
            <div className="mt-2 flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {wardError}
            </div>
          )}

          {selectedMunicipality && !wardError && formData.wardNumber && (
            <div className="mt-2 text-green-600 text-sm">
              ✓ Valid ward number for {selectedMunicipality.name}
            </div>
          )}

          {selectedMunicipality && !formData.wardNumber && (
            <div className="mt-2 text-gray-500 text-sm">
              Enter a number between 1 and {selectedMunicipality.wards}
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Step 2 of 4</span>
          <span className="font-medium text-blue-600">Address Information</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full w-2/4"></div>
        </div>
      </div>
    </div>
  );
};

export default AddressInfo;