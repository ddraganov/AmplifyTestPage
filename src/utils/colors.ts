import type { Config } from "../types";

export function applyStyles(colors: Config["colors"]) {
  if (!colors) return;

  const root = document.documentElement;
  root.style.setProperty("--text-color", colors.textColor);
  root.style.setProperty("--placeholder-color", colors.placeholderColor);
  root.style.setProperty("--error-text-color", colors.errorTextColor);
  root.style.setProperty("--bg-color", colors.backgroundColor);
  root.style.setProperty("--border-color", colors.borderColor);
  root.style.setProperty("--focus-border-color", colors.focusBorderColor);
  root.style.setProperty("--error-color", colors.errorTextColor);
  root.style.setProperty("--btn-text-color", colors.btnTextColor);
  root.style.setProperty("--btn-bg-color", colors.btnBgColor);
  root.style.setProperty("--btn-hover-bg-color", colors.btnHoverBgColor);

  return {
    base: {
      "::placeholder": {
        color: colors.placeholderColor,
        fontWeight: 400,
      },
      fontWeight: "600",
      fontSize: "16px",
      color: colors.textColor,
      backgroundColor: colors.backgroundColor,
    },
    invalid: {
      color: colors.errorTextColor,
    },
  };
}
