const HIDDEN_MARKETPLACE_PATTERNS = [
  /remote integration fix test/i,
  /integration fix test/i,
  /\bpytest\b/i,
  /\bdummy\b/i,
  /\bmock\b/i,
  /\bseed(?:ed)?\b/i,
  /\bqa\b/i,
  /\bsample\b/i,
  /\btest\b/i,
];

function matchesHiddenPattern(values) {
  return values
    .filter(Boolean)
    .map((value) => String(value))
    .some((value) => HIDDEN_MARKETPLACE_PATTERNS.some((pattern) => pattern.test(value)));
}

export function isMarketplaceCategoryVisible(category) {
  return !matchesHiddenPattern([category]);
}

export function isMarketplaceServiceVisible(service) {
  return !matchesHiddenPattern([
    service?.title,
    service?.label,
    service?.category,
    service?.description,
  ]);
}

export function isMarketplaceCreatorVisible(creator, skills = []) {
  const user = creator?.user || {};
  return !matchesHiddenPattern([
    user?.display_name,
    user?.full_name,
    user?.username,
    user?.email,
    creator?.display_name,
    creator?.username,
    creator?.bio,
    ...(Array.isArray(skills) ? skills : []),
  ]);
}
