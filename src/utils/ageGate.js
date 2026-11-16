const AGE_GATE_TOKEN_KEY = "eruchi_age_gate_rt";

export const stashAgeGateReminderToken = (token) => {
  if (!token) return;
  try {
    sessionStorage.setItem(AGE_GATE_TOKEN_KEY, String(token));
  } catch {
    // private mode
  }
};

export const consumeAgeGateReminderToken = () => {
  try {
    const token = sessionStorage.getItem(AGE_GATE_TOKEN_KEY) || "";
    sessionStorage.removeItem(AGE_GATE_TOKEN_KEY);
    return token;
  } catch {
    return "";
  }
};
