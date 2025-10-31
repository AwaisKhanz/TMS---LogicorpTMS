export type FinancialAdjustmentRateSide = "customer" | "carrier";

export type FinancialAdjustmentCategory =
  | "Advance"
  | "Bonus"
  | "Breakdown"
  | "Damage"
  | "Deadhead"
  | "Detention"
  | "Discount"
  | "Disposal"
  | "Extra Stop"
  | "Freeze Protect"
  | "Fuel Advance"
  | "Gate Fee"
  | "General"
  | "Handling"
  | "Hazmat"
  | "Late Fee"
  | "Layover"
  | "Lumper"
  | "Maintenance"
  | "Missing Paperwork"
  | "On-Time Delivery"
  | "Other"
  | "Pallets"
  | "Permit"
  | "Permit Fees"
  | "Pilot Car"
  | "QuickPay"
  | "QuickPay Fee"
  | "Redelivery"
  | "Reimbursement"
  | "Revenue Share"
  | "Scale Ticket"
  | "Standard Fee"
  | "Storage"
  | "Team"
  | "Temperature Control"
  | "Tolls"
  | "Trailer Detention";

export interface FinancialAdjustment {
  id: string;
  date: string; // ISO string
  category: FinancialAdjustmentCategory;
  side: FinancialAdjustmentRateSide; // which rate changes
  amount: number; // positive values
  description?: string;
  createdBy?: string;
}


