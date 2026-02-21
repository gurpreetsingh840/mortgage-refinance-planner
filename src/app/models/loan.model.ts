export interface LoanData {
  loanAmount: number;
  loanLengthYears: number;
  interestRate: number;
  startDate: string;
  monthlyPayment: number;
  escrow: number;
  extraPayment: number;
  oneTimeExtraPayments: number;
  closingCosts: number; // Refinancing costs (origination, title, appraisal, etc.)
}

export interface LoanCalculationResult {
  totalInterestPaid: number;
  totalAmountPaid: number;
  totalExtraPayment: number;
  monthsToPayout: number;
  yearsToPayout: number;
  payoffDate: string;
  currentRemainingBalance: number;
  monthsElapsed: number;
}

export interface ComparisonResult {
  originalLoan: LoanCalculationResult;
  newLoan: LoanCalculationResult;
  differenceInTotalPayment: number;
  differenceinInterest: number;
  monthlyPaymentDifference: number;
  suggestedNewRate: number;
  totalCostWithClosing: number; // New loan total cost including closing costs
  netSavings: number; // Savings after accounting for closing costs
  breakEvenMonths: number; // Months until closing costs are recovered
}

export interface StoredData {
  originalLoan: LoanData;
  newLoan: LoanData;
}
