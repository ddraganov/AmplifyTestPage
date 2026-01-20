import type { SafeChargeStatic } from "../types";

export function loadSafeCharge(
  src: string,
): Promise<SafeChargeStatic | undefined> {
  return new Promise((resolve, reject) => {
    if (window.SafeCharge) {
      resolve(window.SafeCharge);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(window.SafeCharge);
    };
    script.onerror = () => reject(new Error("Failed to load SafeCharge SDK"));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    SafeCharge?: SafeChargeStatic;
  }
}
