import { loadSafeCharge } from "../../config/safeCharge";
import type {
  Config,
  SafeChargeInstance,
  CardData,
  AdditionalParams,
  Field,
  SafeChargeStatic,
} from "../../types";
import {
  INIT_SUCCESS,
  GENERATE_TOKEN_SUCCESS,
  GENERATE_TOKEN_FAILED,
  PAYMENT_SUCCESS,
  PAYMENT_FAILED,
} from "../../utils/events";
import { applyStyles } from "../../utils/colors";
import "../../style.css";

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
  const fieldStyles = applyStyles(colors);

  if (!isCvvForm) {
    const cardNumberField = fields?.create("ccNumber", {
      style: fieldStyles,
    });
    cardNumberField?.attach("#card-number");

    const cardExpiry = fields?.create("ccExpiration", {
      style: fieldStyles,
    });
    cardExpiry?.attach("#card-expiry");

    const cardCvc = fields?.create("ccCvc", {
      style: fieldStyles,
    });
    cardCvc?.attach("#card-cvc");

    cardData = cardNumberField;
  } else {
    const cardHolder = document.getElementById("cardHolderName");
    const cardNumber = document.getElementById("card-number");
    const cardExpiry = document.getElementById("card-expiry");

    if (cardNumber) cardNumber.style.display = "none";
    if (cardExpiry) cardExpiry.style.display = "none";
    if (cardHolder) cardHolder.style.display = "none";

    const cardCvc = fields?.create("ccCvc", {
      style: fieldStyles,
    });
    cardCvc?.attach("#card-cvc");

    cvvField = cardCvc;
  }

  if (window.ReactNativeWebView && sfc && fields && fieldStyles) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: INIT_SUCCESS }),
    );
  }
}

window.onPaymentOptionReceived = (data: {
  userPaymentOptionId: string;
  paymentSessionToken: string;
}) => {
  params = {
    ...params,
    userPaymentOptionId: data.userPaymentOptionId,
    paymentSessionToken: data.paymentSessionToken,
  };
};

async function getToken() {
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

    console.log(GENERATE_TOKEN_SUCCESS, ccTempToken);
    if (window?.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: GENERATE_TOKEN_SUCCESS, ccTempToken }),
      );
    }
  } catch (error) {
    console.error(GENERATE_TOKEN_FAILED, error);
    if (window?.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: GENERATE_TOKEN_FAILED, error }),
      );
    }
  }
}

function createPayment() {
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
    (result) => {
      if (window.ReactNativeWebView) {
        if (result.status === "SUCCESS") {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: PAYMENT_SUCCESS, result }),
          );
        } else {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: PAYMENT_FAILED, result }),
          );
        }
      }
      console.log("CREATE_PAYMENT_SUCCESS", result);
    },
  );
}

export function NuveiPage() {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <button type="button" id="initBtn" class="init-button">Init</button>
    <div class="container">
      <form class="form">
        <input id="cardHolderName" placeholder="Cardholder Name" type="text" />
        <div id="card-number" class="card-field"></div>
        <div class="multiple-row-item">
          <div id="card-expiry" class="card-field"></div>
          <div id="card-cvc" class="card-field"></div>
        </div>
        <button type="button" id="depositBtn" class="action-button">Deposit</button>
      </form>
    </div>
`;

  document.getElementById("initBtn")!.addEventListener("click", () =>
    init({
      merchantId: "1856371907611671305",
      merchantSiteId: "231948",
      env: "int",
      src: "https://cdn.safecharge.com/safecharge_resources/v1/websdk/safecharge.js",
      additionalParams: {
        sessionToken: "b3f68806dcb54d42bc121e789c530f950121",
        billingAddress: { email: "john.doe@example.com", country: "CA" },
        paymentSessionToken: "14fe3108266d48f6bd1422f4dd33ae1c0121",
        userPaymentOptionId: "3226638111",
      },
      showCvvForm: false,
      colors: {
        placeholderColor: "#A0A0A0",
        textColor: "rgb(255, 255, 255)",
        errorTextColor: "rgb(197, 36, 23)",
        backgroundColor: "rgba(0, 0, 0, 0.97)",
        borderColor: "rgb(42, 42, 42)",
        focusBorderColor: "rgb(255, 255, 255)",
        errorBorderColor: "rgb(197, 36, 23)",
        btnTextColor: "rgb(18, 18, 18)",
        btnBgColor:
          "linear-gradient(127deg, #ffeba5 0%, #ffc700 84.61%, #ffe27b 100%)",
        btnHoverBgColor:
          "linear-gradient(134deg, #ffc700 13.02%, #ffe27b 77.97%)",
      },
    }),
  );

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
