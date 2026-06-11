import React from 'react';
import { useAuth } from '../../context/AuthContext';

const ProfileCompletionBar = () => {
  const { user, loading } = useAuth();

  if (loading || !user || user.isProfileComplete) return null;

  const fields = [
    !!user.phone,
    !!user.dateOfBirth,
    !!user.gender,
    !!user.nationality,
    !!user.firstLanguage,
    !!user.educationLevel,
    !!user.maritalStatus,
    !!user.occupation,
    !!(user.address?.municipality && user.address?.wardNumber),
    !!(user.householdDurables?.length > 0),
    !!user.mainIncomeSource,
    !!(user.interests?.length > 0),
  ];

  const percentage = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  return (
    <div className="w-full h-[5px] bg-gray-200">
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${percentage}%`,
          background: 'linear-gradient(to right, #f97316, #22c55e)',
        }}
      />
    </div>
  );
};

export default ProfileCompletionBar;