import type { Config, FieldType } from "../types";

export function applyStyles({
  colors,
  amount,
}: {
  colors: Config["colors"];
  amount?: number;
}) {
  if (!colors) return;

  const root = document.documentElement;
  root.style.setProperty("--text-color", colors.textColor);
  root.style.setProperty("--placeholder-color", colors.placeholderColor);
  root.style.setProperty("--error-text-color", colors.errorTextColor);
  root.style.setProperty("--bg-color", colors.backgroundColor);
  root.style.setProperty("--border-color", colors.borderColor);
  root.style.setProperty("--focus-border-color", colors.focusBorderColor);
  root.style.setProperty("--error-border-color", colors.errorBorderColor);
  root.style.setProperty("--btn-text-color", colors.btnTextColor);
  root.style.setProperty("--btn-bg-color", colors.btnBgColor);
  root.style.setProperty("--btn-hover-bg-color", colors.btnHoverBgColor);

  const depositBtn = document.getElementById("depositBtn");
  if (depositBtn && amount) {
    depositBtn.textContent = `Deposit $${amount}`;
  }

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

export const applyButtonDisability = (isEnabled: boolean) => {
  const depositBtn = document.getElementById(
    "depositBtn",
  ) as HTMLButtonElement | null;

  if (depositBtn) {
    depositBtn.disabled = !isEnabled;
  }
};

export const applyFieldBorderColor = (
  isComplete: boolean,
  field: FieldType,
) => {
  switch (field) {
    case "ccNumber":
      const cardNumber = document.getElementById("card-number");
      if (cardNumber) {
        isComplete
          ? cardNumber?.classList.remove("invalid-field")
          : cardNumber?.classList.add("invalid-field");
      }
      break;

    case "ccExpiration":
      const cardExpiry = document.getElementById("card-expiry");
      if (cardExpiry) {
        isComplete
          ? cardExpiry?.classList.remove("invalid-field")
          : cardExpiry?.classList.add("invalid-field");
      }
      break;
    case "ccCvc":
      const cardCvc = document.getElementById("card-cvc");
      if (cardCvc) {
        isComplete
          ? cardCvc?.classList.remove("invalid-field")
          : cardCvc?.classList.add("invalid-field");
      }
      break;
  }
};
