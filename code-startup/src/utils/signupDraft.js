export const SIGNUP_DRAFT_KEY = "signupDraft";

export function loadDraft() {
  try { return JSON.parse(localStorage.getItem(SIGNUP_DRAFT_KEY) || "{}"); }
  catch { return {}; }
}

export function saveDraft(partial) {
  const cur = loadDraft();
  const next = { ...cur, ...partial };
  localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(next));
  return next;
}

export function clearDraft() {
  localStorage.removeItem(SIGNUP_DRAFT_KEY);
}
