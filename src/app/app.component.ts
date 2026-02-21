import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComparisonResult, LoanData } from './models/loan.model';
import { LoanCalculatorService } from './services/loan-calculator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  originalLoanForm!: FormGroup;
  newLoanForm!: FormGroup;
  comparisonResult: ComparisonResult | null = null;
  originalPrincipalAndInterest: number = 0;
  newPrincipalAndInterest: number = 0;

  constructor(
    private fb: FormBuilder,
    private loanCalculator: LoanCalculatorService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadSavedData();
    this.setupFormListeners();
    this.calculateComparison();
  }

  private initializeForms(): void {
    const defaultData = this.loanCalculator.getDefaultLoanData();
    
    this.originalLoanForm = this.fb.group({
      loanAmount: [defaultData.loanAmount, [Validators.required, Validators.min(0)]],
      loanLengthYears: [defaultData.loanLengthYears, [Validators.required, Validators.min(1)]],
      interestRate: [defaultData.interestRate, [Validators.required, Validators.min(0)]],
      startDate: [defaultData.startDate, Validators.required],
      monthlyPayment: [defaultData.monthlyPayment, [Validators.required, Validators.min(0)]],
      escrow: [defaultData.escrow, [Validators.min(0)]],
      extraPayment: [defaultData.extraPayment, [Validators.min(0)]],
      oneTimeExtraPayments: [defaultData.oneTimeExtraPayments, [Validators.min(0)]],
      closingCosts: [0, [Validators.min(0)]],
      continueExtraPayments: [false] // Default to not continuing
    });

    this.newLoanForm = this.fb.group({
      loanAmount: [defaultData.loanAmount, [Validators.required, Validators.min(0)]],
      loanLengthYears: [defaultData.loanLengthYears, [Validators.required, Validators.min(1)]],
      interestRate: [5.5, [Validators.required, Validators.min(0)]],
      monthlyPayment: [2000, [Validators.required, Validators.min(0)]],
      escrow: [defaultData.escrow, [Validators.min(0)]],
      extraPayment: [0, [Validators.min(0)]],
      oneTimeExtraPayments: [0, [Validators.min(0)]],
      closingCosts: [0, [Validators.min(0)]] // Default 0, user can adjust
    });
  }

  private loadSavedData(): void {
    const savedData = this.loanCalculator.loadFromLocalStorage();
    if (savedData) {
      this.originalLoanForm.patchValue(savedData.originalLoan);
      // For new loan, load all saved data including extraPayment
      this.newLoanForm.patchValue(savedData.newLoan);
    }
  }

  private setupFormListeners(): void {
    // Listen to all form changes and recalculate
    this.originalLoanForm.valueChanges.subscribe(() => {
      this.autoCalculatePayment(this.originalLoanForm, 'original');
      this.updateNewLoanAmount(); // Auto-populate new loan with remaining balance
      this.calculateComparison();
      this.saveData();
    });

    this.newLoanForm.valueChanges.subscribe(() => {
      this.autoCalculatePayment(this.newLoanForm, 'new');
      this.calculateComparison();
      this.saveData();
    });
    
    // Initial calculation
    this.autoCalculatePayment(this.originalLoanForm, 'original');
    this.autoCalculatePayment(this.newLoanForm, 'new');
    this.updateNewLoanAmount(); // Initial update of new loan amount
  }
  
  /**
   * Auto-populate new loan amount with current remaining balance of original loan
   */
  private updateNewLoanAmount(): void {
    if (this.originalLoanForm.valid) {
      const originalLoan: LoanData = this.originalLoanForm.value;
      const originalResult = this.loanCalculator.calculateLoan(originalLoan);
      
      // Update new loan amount to match the current remaining balance
      // DON'T touch other fields like extraPayment - respect user's input
      this.newLoanForm.patchValue(
        { 
          loanAmount: Math.round(originalResult.currentRemainingBalance)
        }, 
        { emitEvent: false }
      );
      
      // Recalculate payment for new loan with updated amount
      this.autoCalculatePayment(this.newLoanForm, 'new');
    }
  }

  private autoCalculatePayment(formGroup: FormGroup, loanType: 'original' | 'new'): void {
    const loanAmount = formGroup.get('loanAmount')?.value;
    const loanLengthYears = formGroup.get('loanLengthYears')?.value;
    const interestRate = formGroup.get('interestRate')?.value;
    const escrow = formGroup.get('escrow')?.value || 0;

    if (loanAmount && loanLengthYears && interestRate !== null && !isNaN(loanAmount) && !isNaN(loanLengthYears) && !isNaN(interestRate)) {
      const principalAndInterest = this.loanCalculator.calculateMonthlyPayment(
        loanAmount,
        loanLengthYears,
        interestRate
      );
      
      // Update P&I display
      if (loanType === 'original') {
        this.originalPrincipalAndInterest = principalAndInterest;
      } else {
        this.newPrincipalAndInterest = principalAndInterest;
      }
      
      // Calculate total monthly payment (P&I + Escrow)
      const totalMonthlyPayment = principalAndInterest + escrow;
      
      // Update form without triggering another valueChanges event
      formGroup.patchValue({ monthlyPayment: Math.round(totalMonthlyPayment * 100) / 100 }, { emitEvent: false });
    }
  }

  calculateComparison(): void {
    if (this.originalLoanForm.valid && this.newLoanForm.valid) {
      const originalLoan: LoanData = {
        ...this.originalLoanForm.value,
        escrow: this.originalLoanForm.value.escrow || 0,
        extraPayment: this.originalLoanForm.value.extraPayment || 0,
        oneTimeExtraPayments: this.originalLoanForm.value.oneTimeExtraPayments || 0,
        closingCosts: this.originalLoanForm.value.closingCosts || 0
      };
      const newLoan: LoanData = {
        ...this.newLoanForm.value,
        startDate: new Date().toISOString().split('T')[0], // Always use current date for new loan
        escrow: this.newLoanForm.value.escrow || 0,
        extraPayment: this.newLoanForm.value.extraPayment || 0,
        oneTimeExtraPayments: this.newLoanForm.value.oneTimeExtraPayments || 0,
        closingCosts: this.newLoanForm.value.closingCosts || 0
      };
      
      this.comparisonResult = this.loanCalculator.compareLoan(originalLoan, newLoan);
    }
  }

  private saveData(): void {
    if (this.originalLoanForm.valid && this.newLoanForm.valid) {
      this.loanCalculator.saveToLocalStorage(
        this.originalLoanForm.value,
        {
          ...this.newLoanForm.value,
          startDate: new Date().toISOString().split('T')[0] // Always use current date for new loan
        }
      );
    }
  }

  calculateStandardPayment(formGroup: FormGroup): void {
    const loanAmount = formGroup.get('loanAmount')?.value;
    const loanLengthYears = formGroup.get('loanLengthYears')?.value;
    const interestRate = formGroup.get('interestRate')?.value;

    if (loanAmount && loanLengthYears && interestRate !== null) {
      const payment = this.loanCalculator.calculateMonthlyPayment(
        loanAmount,
        loanLengthYears,
        interestRate
      );
      const escrow = formGroup.get('escrow')?.value || 0;
      formGroup.patchValue({ monthlyPayment: Math.round(payment + escrow) });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }

  formatPercent(value: number): string {
    return value.toFixed(3) + '%';
  }

  formatYears(years: number): string {
    const wholeYears = Math.floor(years);
    const months = Math.round((years - wholeYears) * 12);
    return `${wholeYears} years, ${months} months`;
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  setLoanTerm(formGroup: FormGroup, years: number): void {
    formGroup.patchValue({ loanLengthYears: years });
  }

  setInterestRate(formGroup: FormGroup, rate: number): void {
    formGroup.patchValue({ interestRate: rate });
  }
}
