export type Field = {
  attach(selector: string): void;
  detach(): void;
  destroy(): void;
  on(event: "change", callback: (state: FieldState) => void): void;
  on(event: "focus" | "blur" | "ready", callback: () => void): void;
  update(options: FieldOptions): void;
};

type Fields = {
  create(type: FieldType, options?: FieldOptions): Field;
};

type FieldsOptions = {
  locale?: string;
  fonts?: Array<{
    cssUrl: string;
  }>;
};

type FieldOptions = {
  style?: FieldStyle;
};

type FieldStyle = {
  base?: Record<string, unknown>;
  invalid?: Record<string, unknown>;
  valid?: Record<string, unknown>;
};

type FieldState = {
  empty: boolean;
  complete: boolean;
  allFieldsCompleted: boolean;
  field: FieldType;
  error: {
    id: string;
    message: string;
  }
};

export type FieldType = "ccNumber" | "ccExpiration" | "ccCvc";

export type BillingAddress = {
  email: string;
  country: string;
};

export type CardData = {
  cardNumber?: string;
  cardHolderName?: string;
  expirationMonth?: string;
  expirationYear?: string;
  CVV?: string;
};

type TokenParams = {
  sessionToken?: string;
  cardHolderName: string;
  billingAddress: BillingAddress;
};

export type TokenResponse = {
  cardType: string;
  ccTempToken: string;
  sessionToken: string;
  status: "SUCCESS" | "ERROR";
};

type PaymentOption = {
  userPaymentOptionId?: string;
  card?: {
    CVV?: CardData | Field | null;
  };
};

export type CreatePaymentParams = {
  sessionToken: string;
  clientUniqueId?: string;
  paymentOption: PaymentOption;
  billingAddress: BillingAddress;
};

export type CreatePaymentResponse = {
  status: "SUCCESS" | "ERROR";
  transactionStatus: string;
  transactionType: string;
  transactionId: string;
  externalTransactionId?: string;
};

export type Config = {
  merchantId: string;
  merchantSiteId: string;
  env: "int" | "prod";
  src: string;
  additionalParams: AdditionalParams;
  showCvvForm: boolean;
  amount: number;
  colors: Colors;
};

type Colors = {
  placeholderColor: string;
  textColor: string;
  errorTextColor: string;
  backgroundColor: string;
  borderColor: string;
  focusBorderColor: string;
  errorBorderColor: string;
  btnTextColor: string;
  btnBgColor: string;
  btnHoverBgColor: string;
};

export type AdditionalParams = {
  sessionToken?: string;
  billingAddress: BillingAddress;
  userPaymentOptionId?: string;
  paymentSessionToken?: string;
};

export type SafeChargeInstance = {
  fields(options?: FieldsOptions): Fields;
  createPayment(
    params: CreatePaymentParams,
    callback: (response: CreatePaymentResponse) => void,
  ): void;
  getToken(card: CardData | Field, params: TokenParams): Promise<TokenResponse>;
};

export type SafeChargeConfig = {
  merchantId: string;
  merchantSiteId: string;
  env: 'prod' | 'int';
};

export type SafeChargeStatic = {
  (config: SafeChargeConfig): SafeChargeInstance;
};

