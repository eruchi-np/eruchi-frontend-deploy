import React from 'react';
import { useNavigate } from 'react-router-dom';
import SecSurvey from '../../components/sec/SecSurvey';
import OnboardingShell from '../../components/onboarding/OnboardingShell';
import CreditRewardBadge from '../../components/onboarding/CreditRewardBadge';
import { useAuth } from '../../context/AuthContext';
import { goToSurveyComplete } from '../../utils/surveyComplete';

const COPY = {
  first: {
    title: 'About your household',
    body: 'A few quick questions about your home, work and education.',
    credits: 25,
  },
  refresh: {
    title: 'About your household',
    body: 'Check that your household details are still right.',
    credits: 15,
  },
  edit: {
    title: 'About your household',
    body: 'Update your household answers. Edits do not earn credits.',
    credits: 0,
  },
};

const SecProfile = ({ mode = 'first' }) => {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const copy = COPY[mode] || COPY.first;

  const done = async (awarded = 0) => {
    await refreshUser();
    if (mode === 'edit') {
      navigate('/edit-profiles', { replace: true });
      return;
    }
    goToSurveyComplete(navigate, {
      creditsEarned: Number(awarded) || 0,
      previousStreak: user?.streakCount,
      streakCount: user?.streakCount,
      credits: (Number(user?.credits) || 0) + (Number(awarded) || 0),
      streakBonus: 0,
      kind: 'normal',
    });
  };

  return (
    <OnboardingShell footer={false}>
      <div className="onboard-card">
        {copy.credits > 0 ? (
          <div className="onboard-kicker">
            <CreditRewardBadge amount={copy.credits} />
          </div>
        ) : null}
        <h1 className="onboard-title">{copy.title}</h1>
        <p className="onboard-copy">{copy.body}</p>
        <SecSurvey mode={mode} onComplete={done} />
      </div>
    </OnboardingShell>
  );
};

export default SecProfile;
