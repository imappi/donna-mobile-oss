// The settings seam persists within the mock's lifetime, never claims external work.
export const readSettings = (book, principalId) => {
  const owner = book.mobileSettings?.[principalId];
  return {
    source: "sample",
    vat_period: book.declaredVatPeriod ?? null,
    notifications: owner?.notifications ?? {
      needs_you: true,
      due_dates: true,
      monthly_summary: false,
      every_receipt: false,
    },
    notification_delivery: "not_configured",
    phone_number: null,
    financial_year: { current: null, first: null, statements: null },
  };
};
export const updateSettings = (book, principalId, action) => {
  const invalid = () => {
    const error = new Error("Invalid settings action");
    error.code = "SETTINGS_INVALID";
    throw error;
  };
  if (!action || typeof action !== "object" || Array.isArray(action)) invalid();
  if (action.type === "set_vat_period") {
    if (
      Object.keys(action).some(
        (key) => !["type", "vat_period"].includes(key),
      ) ||
      !["month", "quarter", "year"].includes(action.vat_period)
    )
      invalid();
    book.declaredVatPeriod = action.vat_period;
  } else if (action.type === "set_notifications") {
    const keys = ["needs_you", "due_dates", "monthly_summary", "every_receipt"];
    const prefs = action.notifications;
    if (
      Object.keys(action).some(
        (key) => !["type", "notifications"].includes(key),
      ) ||
      !prefs ||
      typeof prefs !== "object" ||
      Array.isArray(prefs) ||
      Object.keys(prefs).length !== keys.length ||
      keys.some((key) => typeof prefs[key] !== "boolean")
    )
      invalid();
    book.mobileSettings ??= {};
    book.mobileSettings[principalId] = { notifications: { ...prefs } };
  } else invalid();
  return readSettings(book, principalId);
};
