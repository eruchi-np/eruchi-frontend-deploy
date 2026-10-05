const GROUPS = [
  {
    parent: "food",
    terms: [
      "momo",
      "pizza",
      "burger",
      "coffee",
      "noodles",
      "chowmein",
      "thakali",
      "sekuwa",
      "biryani",
      "sandwich",
      "restaurant",
      "cafe",
      "bakery",
      "bar & lounge",
      "fast food",
      "fine dining",
      "food court",
      "ice cream",
      "desserts",
      "ice cream & desserts",
    ],
  },
  {
    parent: "sports",
    terms: [
      "football",
      "futsal",
      "table tennis",
      "tennis",
      "cricket",
      "basketball",
      "badminton",
      "volleyball",
      "gym",
      "fitness",
    ],
  },
];

function tokens(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function sameTokens(left, right) {
  return left.length === right.length && left.every((token, index) => token === right[index]);
}

function hasPhrase(haystack, phrase) {
  if (!phrase.length || haystack.length < phrase.length) return false;
  for (let start = 0; start <= haystack.length - phrase.length; start += 1) {
    let found = true;
    for (let offset = 0; offset < phrase.length; offset += 1) {
      if (haystack[start + offset] !== phrase[offset]) {
        found = false;
        break;
      }
    }
    if (found) return true;
  }
  return false;
}

const prepared = GROUPS.map((group) => ({
  parent: tokens(group.parent),
  terms: group.terms.map(tokens),
}));

export function matchesRelatedSearch(fields, keywords, query) {
  const queryTokens = tokens(query);
  if (!queryTokens.length) return false;

  const fieldTokens = fields.map(tokens);
  const keywordTokens = (keywords || []).map(tokens);

  return prepared.some((group) => {
    const queryIsParent = sameTokens(queryTokens, group.parent);
    const queryIsChild = group.terms.some((term) => sameTokens(queryTokens, term));
    if (queryIsParent) {
      const phrases = [group.parent, ...group.terms];
      return fieldTokens.some((list) => phrases.some((phrase) => hasPhrase(list, phrase)));
    }
    if (queryIsChild) {
      return keywordTokens.some((list) => hasPhrase(list, group.parent));
    }
    return false;
  });
}
