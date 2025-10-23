// Form Option Types

export interface FormOption {
  id: string;
  value: string;
  label: string;
}

export interface CustomerOption extends FormOption {
  name: string;
}

export interface CarrierOption extends FormOption {
  name: string;
  mcNumber: string;
}
