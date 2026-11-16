/**
 * Surveys still needed to afford a voucher.
 * X = ceil((price - balance) / avgCreditsPerSurvey)
 */
export function surveysAwayCount(userCredits, offerCredits, avgSurveyCredits) {
  const avg = Number(avgSurveyCredits);
  if (!(avg > 0)) return null;
  const shortfall = Math.max(
    0,
    (Number(offerCredits) || 0) - (Number(userCredits) || 0)
  );
  if (shortfall <= 0) return 0;
  return Math.ceil(shortfall / avg);
}

export function surveysAwayLabel(userCredits, offerCredits, avgSurveyCredits) {
  const count = surveysAwayCount(userCredits, offerCredits, avgSurveyCredits);
  if (count == null || count <= 0) return null;
  return count === 1 ? "1 survey away" : `${count} surveys away`;
}

export function canAffordOffer(userCredits, offer) {
  return (Number(offer?.creditsRequired) || 0) <= (Number(userCredits) || 0);
}
