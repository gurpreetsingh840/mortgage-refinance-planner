# Refinancing Loan Calculator

A comprehensive Angular web application for comparing original loans with refinancing options.

## 🚀 Live Demo

**Try it now without installation:** [https://gurpreetsingh840.github.io/mortgage-refinance-planner/](https://gurpreetsingh840.github.io/mortgage-refinance-planner/)

No installation required - just click the link above to start comparing loans immediately!

## Features

- **Side-by-side loan comparison**: Compare your current loan with a proposed refinancing option
- **Comprehensive calculations**:
  - Total interest paid
  - Total amount paid over the life of the loan
  - Total extra payments applied
  - Loan payoff date
  - Suggested interest rate to match current payment
- **Extra payment support**: Calculate how extra monthly payments reduce your loan term
- **LocalStorage persistence**: All your data is automatically saved and restored when you return
- **Responsive design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time updates**: Results update automatically as you modify any input

## Installation

**Want to run it locally or contribute?** Follow these steps:

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Open your browser and navigate to `http://localhost:4200`

## Usage

### Original Loan Section

Enter your current loan details:

- Loan amount
- Loan length in years
- Interest rate
- Start date
- Monthly payment (total including principal, interest, and escrow)
- Escrow amount
- Extra payment amount (if any)

### New Loan Section

Enter the proposed refinancing loan details with the same fields.

### Calculate Button

Use the "Calculate" button next to the monthly payment field to automatically compute the standard monthly payment based on the loan amount, length, and interest rate.

### Results

The app displays:

- Total interest for both loans
- Total amount paid for both loans
- Difference in total payments (savings or additional cost)
- Suggested new interest rate to match your current payment
- Recommendation based on the comparison

## Technology Stack

- **Angular 17**: Latest Angular framework with standalone components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern utility-first CSS framework
- **Reactive Forms**: Angular's powerful form handling
- **LocalStorage API**: Client-side data persistence

## Project Structure

```
src/
├── app/
│   ├── models/
│   │   └── loan.model.ts          # Data interfaces and types
│   ├── services/
│   │   └── loan-calculator.service.ts  # Calculation logic and localStorage
│   ├── app.component.ts           # Main component logic
│   ├── app.component.html         # Main component template
│   ├── app.component.css          # Component styles
│   └── app.config.ts              # App configuration
├── main.ts                        # Application entry point
├── styles.css                     # Global styles with Tailwind
└── index.html                     # HTML entry point
```

## Calculations

### Monthly Payment Formula

The standard monthly payment is calculated using the amortization formula:

```
M = P × [r(1 + r)^n] / [(1 + r)^n - 1]
```

Where:

- M = Monthly payment
- P = Principal loan amount
- r = Monthly interest rate (annual rate / 12)
- n = Total number of payments (years × 12)

### Extra Payments

Extra payments are applied directly to the principal each month, reducing the total interest paid and shortening the loan term.

### Suggested Rate

The app uses binary search to find the interest rate that would result in a monthly payment matching your original loan, helping you understand what rate you'd need to maintain your current payment.

## Development

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

This will build the app for production and deploy it to GitHub Pages automatically.

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
