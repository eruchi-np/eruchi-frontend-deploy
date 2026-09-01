export function getOfferStock(offer) {
  if (offer.totalStock !== null && offer.totalStock !== undefined) {
    return {
      remaining: Math.max(0, offer.totalStock - (offer.totalRedeemed || 0)),
      isMonthly: false,
    };
  }
  if (offer.monthlyStock !== null && offer.monthlyStock !== undefined) {
    const currentLog =
      offer.monthlyRedemptionLog && offer.monthlyRedemptionLog.length > 0
        ? offer.monthlyRedemptionLog[offer.monthlyRedemptionLog.length - 1]
        : null;
    return {
      remaining: Math.max(
        0,
        offer.monthlyStock - (currentLog ? currentLog.count : 0)
      ),
      isMonthly: true,
    };
  }
  return null;
}

export function isOfferAvailable(offer) {
  if (!offer) return false;
  if (offer.status && offer.status !== "active") return false;
  if (offer.validUntil && new Date(offer.validUntil) < new Date()) return false;
  const stock = getOfferStock(offer);
  if (stock !== null && stock.remaining <= 0) return false;
  return true;
}

export function merchantKey(offer) {
  return String(
    offer.business?._id ||
      offer.business?.id ||
      offer.business ||
      offer._id
  );
}

function shuffle(list) {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function pickDifferentMerchants(offers, limit = 2) {
  const seen = new Set();
  const picked = [];
  for (const offer of offers) {
    const key = merchantKey(offer);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(offer);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function matchesOfferSearch(offer, query) {
  if (!query) return true;
  const haystack = `${offer.title || ""} ${offer.business?.brandName || ""} ${
    offer.business?.name || ""
  } ${offer.creditsRequired || ""} ${offer.discountValue || ""}`
    .toLowerCase()
    .replace(/\s/g, "");
  return haystack.includes(query.toLowerCase().replace(/\s/g, ""));
}

export function pickSuggestedOffers(offers, credits, limit = 2) {
  const available = (offers || []).filter(isOfferAvailable);
  const affordable = shuffle(
    available.filter((offer) => (offer.creditsRequired || 0) <= credits)
  );
  const affordablePicks = pickDifferentMerchants(affordable, limit);

  if (affordablePicks.length > 0) {
    return { mode: "affordable", offers: affordablePicks };
  }

  const almost = available
    .filter((offer) => (offer.creditsRequired || 0) > credits)
    .sort(
      (a, b) =>
        (a.creditsRequired || 0) - credits - ((b.creditsRequired || 0) - credits)
    );

  return { mode: "almost", offers: pickDifferentMerchants(almost, limit) };
}
