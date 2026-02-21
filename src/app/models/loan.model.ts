export interface LoanData {
  loanAmount: number;
  loanLengthYears: number;
  interestRate: number;
  startDate: string;
  monthlyPayment: number;
  escrow: number;
  extraPayment: number;
  oneTimeExtraPayments: number;
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
}

export interface StoredData {
  originalLoan: LoanData;
  newLoan: LoanData;
}
