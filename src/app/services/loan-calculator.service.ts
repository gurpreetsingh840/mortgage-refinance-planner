import { Injectable } from '@angular/core';
import { ComparisonResult, LoanCalculationResult, LoanData, StoredData } from '../models/loan.model';

interface AmortizationEntry {
  month: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  extraPayment: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoanCalculatorService {
  private readonly STORAGE_KEY = 'refinancing-loan-data';

  constructor() { }

  /**
   * Calculate loan details including total interest, payoff date, etc.
   */
  calculateLoan(loan: LoanData): LoanCalculationResult {
    const monthlyRate = loan.interestRate / 100 / 12;
    const totalMonths = loan.loanLengthYears * 12;
    
    let balance = loan.loanAmount;
    let totalInterest = 0;
    let totalExtraPayment = 0;
    let monthCount = 0;
    
    // Calculate months elapsed from start date to today
    const startDate = new Date(loan.startDate);
    const today = new Date();
    const monthsElapsed = Math.max(0, 
      (today.getFullYear() - startDate.getFullYear()) * 12 + 
      (today.getMonth() - startDate.getMonth())
    );
    
    let currentRemainingBalance = loan.loanAmount;
    let futureInterest = 0; // Interest to be paid from today forward
    let futureExtraPayment = 0; // Extra payments from today forward
    
    // Calculate standard monthly payment if not provided or calculate from loan terms
    const principalAndInterest = loan.monthlyPayment - loan.escrow;
    
    // Generate amortization schedule
    while (balance > 0 && monthCount < totalMonths * 2) { // safety limit
      monthCount++;
      
      const interestPayment = balance * monthlyRate;
      let principalPayment = principalAndInterest - interestPayment;
      
      // Apply extra payment
      const extraThisMonth = loan.extraPayment;
      
      // Total payment towards principal
      const totalPrincipal = principalPayment + extraThisMonth;
      
      // Check if this payment will pay off the loan
      if (totalPrincipal >= balance) {
        const finalInterest = balance * monthlyRate;
        totalInterest += finalInterest;
        
        // Track future interest (from today forward)
        if (monthCount > monthsElapsed) {
          futureInterest += finalInterest;
        }
        
        const finalExtra = (balance - principalPayment > 0) ? balance - principalPayment : 0;
        totalExtraPayment += finalExtra;
        
        if (monthCount > monthsElapsed) {
          futureExtraPayment += finalExtra;
        }
        
        balance = 0;
        break;
      }
      
      balance -= totalPrincipal;
      totalInterest += interestPayment;
      totalExtraPayment += extraThisMonth;
      
      // Track future payments (from today forward)
      if (monthCount > monthsElapsed) {
        futureInterest += interestPayment;
        futureExtraPayment += extraThisMonth;
      }
      
      // Track current remaining balance based on months elapsed
      if (monthCount === monthsElapsed) {
        currentRemainingBalance = balance;
      }
    }
    
    // If loan hasn't started yet, remaining balance is full amount
    if (monthsElapsed <= 0) {
      currentRemainingBalance = loan.loanAmount;
      futureInterest = totalInterest;
      futureExtraPayment = totalExtraPayment;
    }
    
    // Subtract one-time extra payments from current remaining balance
    currentRemainingBalance = Math.max(0, currentRemainingBalance - loan.oneTimeExtraPayments);
    
    // Calculate payoff date
    const payoffDate = new Date(startDate);
    payoffDate.setMonth(payoffDate.getMonth() + monthCount);
    
    // For comparison purposes, use future interest (from today forward) if months have elapsed
    // Total amount to be paid from today = current remaining balance + future interest
    const relevantInterest = monthsElapsed > 0 ? futureInterest : totalInterest;
    const relevantExtraPayment = monthsElapsed > 0 ? futureExtraPayment : totalExtraPayment;
    const relevantTotalPaid = monthsElapsed > 0 ? (currentRemainingBalance + futureInterest) : (loan.loanAmount + totalInterest);
    
    return {
      totalInterestPaid: relevantInterest,
      totalAmountPaid: relevantTotalPaid,
      totalExtraPayment: relevantExtraPayment,
      monthsToPayout: monthCount,
      yearsToPayout: monthCount / 12,
      payoffDate: payoffDate.toISOString().split('T')[0],
      currentRemainingBalance: currentRemainingBalance,
      monthsElapsed: monthsElapsed
    };
  }

  /**
   * Compare two loans and calculate differences
   */
  compareLoan(originalLoan: LoanData, newLoan: LoanData): ComparisonResult {
    const originalResult = this.calculateLoan(originalLoan);
    const newResult = this.calculateLoan(newLoan);
    
    const differenceInTotalPayment = newResult.totalAmountPaid - originalResult.totalAmountPaid;
    const differenceinInterest = newResult.totalInterestPaid - originalResult.totalInterestPaid;
    const monthlyPaymentDifference = newLoan.monthlyPayment - originalLoan.monthlyPayment;
    
    // Calculate target rate that would save 20% on interest - a good refinancing goal
    const targetInterestSavings = originalResult.totalInterestPaid * 0.20; // Save 20% of interest
    const targetTotalInterest = originalResult.totalInterestPaid - targetInterestSavings;
    const targetTotalCost = newLoan.loanAmount + targetTotalInterest;
    
    const suggestedNewRate = this.calculateTargetSavingsRate(
      newLoan.loanAmount,
      newLoan.loanLengthYears,
      targetTotalCost
    );
    
    return {
      originalLoan: originalResult,
      newLoan: newResult,
      differenceInTotalPayment,
      differenceinInterest,
      monthlyPaymentDifference,
      suggestedNewRate
    };
  }

  /**
   * Calculate target rate for meaningful savings (aims for 20% interest reduction)
   */
  private calculateTargetSavingsRate(
    loanAmount: number,
    loanLengthYears: number,
    targetTotalCost: number
  ): number {
    const totalMonths = loanLengthYears * 12;
    
    // Target total cost should be at least the loan amount
    if (targetTotalCost < loanAmount) {
      return 0;
    }
    
    const targetTotalInterest = targetTotalCost - loanAmount;
    
    // Binary search for the right interest rate
    let low = 0;
    let high = 20; // 20% max rate
    let iterations = 0;
    const maxIterations = 100;
    const tolerance = 10; // $10 tolerance
    
    while (iterations < maxIterations && high - low > 0.0001) {
      const mid = (low + high) / 2;
      const monthlyRate = mid / 100 / 12;
      
      // Calculate total interest for this rate
      let totalInterest: number;
      if (monthlyRate === 0) {
        totalInterest = 0;
      } else {
        const monthlyPayment = loanAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
          (Math.pow(1 + monthlyRate, totalMonths) - 1);
        totalInterest = (monthlyPayment * totalMonths) - loanAmount;
      }
      
      if (Math.abs(totalInterest - targetTotalInterest) < tolerance) {
        return mid;
      }
      
      if (totalInterest < targetTotalInterest) {
        low = mid;
      } else {
        high = mid;
      }
      
      iterations++;
    }
    
    return (low + high) / 2;
  }

  /**
   * Calculate the interest rate needed to achieve a target monthly payment
   * Uses iterative approach (Newton's method approximation)
   */
  private calculateSuggestedRate(
    loanAmount: number,
    loanLengthYears: number,
    targetMonthlyPayment: number
  ): number {
    const totalMonths = loanLengthYears * 12;
    
    // If target payment is too low, return 0
    if (targetMonthlyPayment <= loanAmount / totalMonths) {
      return 0;
    }
    
    // Binary search for the right interest rate
    let low = 0;
    let high = 20; // 20% max rate
    let mid = (low + high) / 2;
    const tolerance = 0.01;
    let iterations = 0;
    const maxIterations = 100;
    
    while (iterations < maxIterations && high - low > 0.0001) {
      const monthlyRate = mid / 100 / 12;
      
      // Calculate monthly payment for this rate
      let calculatedPayment: number;
      if (monthlyRate === 0) {
        calculatedPayment = loanAmount / totalMonths;
      } else {
        calculatedPayment = loanAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
          (Math.pow(1 + monthlyRate, totalMonths) - 1);
      }
      
      if (Math.abs(calculatedPayment - targetMonthlyPayment) < tolerance) {
        return mid;
      }
      
      if (calculatedPayment < targetMonthlyPayment) {
        low = mid;
      } else {
        high = mid;
      }
      
      mid = (low + high) / 2;
      iterations++;
    }
    
    return mid;
  }

  /**
   * Calculate standard monthly payment from loan parameters
   */
  calculateMonthlyPayment(
    loanAmount: number,
    loanLengthYears: number,
    interestRate: number
  ): number {
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanLengthYears * 12;
    
    if (monthlyRate === 0) {
      return loanAmount / totalMonths;
    }
    
    return loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  /**
   * Save loan data to localStorage
   */
  saveToLocalStorage(originalLoan: LoanData, newLoan: LoanData): void {
    const data: StoredData = { originalLoan, newLoan };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Load loan data from localStorage
   */
  loadFromLocalStorage(): StoredData | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data) as StoredData;
      } catch (e) {
        console.error('Error parsing stored data:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Get default loan data
   */
  getDefaultLoanData(): LoanData {
    return {
      loanAmount: 300000,
      loanLengthYears: 30,
      interestRate: 6.5,
      startDate: new Date().toISOString().split('T')[0],
      monthlyPayment: 2100,
      escrow: 400,
      extraPayment: 0,
      oneTimeExtraPayments: 0
    };
  }
}
