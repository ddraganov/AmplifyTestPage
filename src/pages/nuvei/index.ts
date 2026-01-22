import { loadSafeCharge } from "../../config/safeCharge";
import type {
  Config,
  SafeChargeInstance,
  CardData,
  AdditionalParams,
  Field,
  SafeChargeStatic,
  TokenResponse,
  CreatePaymentResponse,
} from "../../types";
import {
  INIT_SUCCESS,
  GENERATE_TOKEN_SUCCESS,
  GENERATE_TOKEN_FAILED,
  PAYMENT_SUCCESS,
  PAYMENT_FAILED,
  INIT_NUVEI,
  INIT_PAYMENT,
} from "../../utils/events";
import {
  applyButtonDisability,
  applyFieldBorderColor,
  applyStyles,
} from "../../utils/applyStyles";
import "../../style.css";

let initCompleted: boolean = false;
let sfc: SafeChargeInstance | undefined;
let cardData: CardData | Field | undefined;
let cvvField: CardData | Field | undefined;
let params: AdditionalParams;
let isCvvForm: boolean;

async function init(config: Config) {
  if (sfc) return;

  const {
    merchantId,
    merchantSiteId,
    env,
    src,
    colors,
    additionalParams,
    showCvvForm,
    amount,
  } = config;

  const SafeCharge: SafeChargeStatic | undefined = await loadSafeCharge(src);
  sfc =
    SafeCharge &&
    SafeCharge({
      merchantId,
      merchantSiteId,
      env,
    });
  params = additionalParams;
  isCvvForm = showCvvForm;

  const fields = sfc?.fields({ locale: "en" });
  const fieldStyles = applyStyles({ colors, amount });

  function notifyInitSuccess() {
    if (initCompleted) return;
    initCompleted = true;

    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: INIT_SUCCESS }),
    );
  }

  if (!isCvvForm) {
    const cardNumberField = fields?.create("ccNumber", {
      style: fieldStyles,
    });
    cardNumberField?.on("change", ({ allFieldsCompleted, complete, field }) => {
      applyButtonDisability(allFieldsCompleted);
      applyFieldBorderColor(complete, field);
    });
    cardNumberField?.attach("#card-number");

    const cardExpiry = fields?.create("ccExpiration", {
      style: fieldStyles,
    });
    cardExpiry?.on("change", ({ allFieldsCompleted, complete, field }) => {
      applyButtonDisability(allFieldsCompleted);
      applyFieldBorderColor(complete, field);
    });
    cardExpiry?.attach("#card-expiry");

    const cardCvc = fields?.create("ccCvc", {
      style: fieldStyles,
    });
    cardCvc?.on("change", ({ allFieldsCompleted, complete, field }) => {
      applyButtonDisability(allFieldsCompleted);
      applyFieldBorderColor(complete, field);
    });
    cardCvc?.attach("#card-cvc");

    cardData = cardNumberField;
    notifyInitSuccess();
  } else {
    document.getElementById("cardHolderName")?.remove();
    document.getElementById("card-number")?.remove();
    document.getElementById("card-expiry")?.remove();

    const cardCvc = fields?.create("ccCvc", {
      style: fieldStyles,
    });
    cardCvc?.on("change", ({ complete, field }) => {
      applyButtonDisability(complete);
      applyFieldBorderColor(complete, field);
    });
    cardCvc?.attach("#card-cvc");

    cvvField = cardCvc;
    notifyInitSuccess();
  }
}

async function getToken(): Promise<TokenResponse | undefined> {
  const { billingAddress, sessionToken } = params;
  if (!sfc || !cardData || !billingAddress || !sessionToken) return;

  try {
    const { ccTempToken } = await sfc.getToken(cardData, {
      cardHolderName:
        (document.getElementById("cardHolderName") as HTMLInputElement)
          ?.value || "",
      sessionToken,
      billingAddress,
    });

    if (window?.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: GENERATE_TOKEN_SUCCESS,
          ccTempToken,
          cardholderName:
            (document.getElementById("cardHolderName") as HTMLInputElement)
              ?.value || "",
        }),
      );
    }
  } catch (error) {
    if (window?.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: GENERATE_TOKEN_FAILED, error }),
      );
    }
  }
}

function createPayment(): CreatePaymentResponse | undefined {
  const { paymentSessionToken, userPaymentOptionId, billingAddress } = params;

  if (
    !sfc ||
    !cvvField ||
    !paymentSessionToken ||
    !userPaymentOptionId ||
    !billingAddress
  )
    return;

  sfc.createPayment(
    {
      paymentOption: {
        userPaymentOptionId: userPaymentOptionId,
        card: {
          CVV: cvvField,
        },
      },
      billingAddress: billingAddress,
      sessionToken: paymentSessionToken,
    },
    ({ status, transactionStatus }) => {
      if (window.ReactNativeWebView) {
        if (status === "SUCCESS") {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: PAYMENT_SUCCESS, transactionStatus }),
          );
        } else {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: PAYMENT_FAILED, transactionStatus }),
          );
        }
      }
    },
  );
}

function handleMessage(event: MessageEvent) {
  try {
    const data =
      typeof event.data === "string" ? JSON.parse(event.data) : event.data;

    switch (data?.type) {
      case INIT_NUVEI:
        init(data.payload);
        break;

      case INIT_PAYMENT:
        params = {
          ...params,
          userPaymentOptionId: data.payload.userPaymentOptionId,
          paymentSessionToken: data.payload.paymentSessionToken,
        };
        createPayment();
        break;
    }
  } catch (e) {
    console.warn("Invalid message received", e);
  }
}

window.addEventListener("message", handleMessage);
document.addEventListener("message", handleMessage as EventListener);

export function NuveiPage() {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
      <form class="form">
        <div class="fields">
          <input id="cardHolderName" placeholder="Cardholder Name" type="text" />
          <div id="card-number" class="card-field"></div>
          <div class="multiple-row-item">
            <div id="card-expiry" class="card-field"></div>
            <div id="card-cvc" class="card-field"></div>
          </div>
        </div>
        <button type="button" id="depositBtn" disabled class="action-button">Deposit</button>
      </form>
`;

  document.getElementById("depositBtn")!.addEventListener("click", () => {
    if (isCvvForm) {
      createPayment();
    } else {
      getToken();
    }
  });
}

declare global {
  interface Window {
    onPaymentOptionReceived?: (data: {
      userPaymentOptionId: string;
      paymentSessionToken: string;
    }) => void;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
