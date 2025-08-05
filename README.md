# Fare Calculation Engine and Capping System

This project implements a fare calculation and capping system for a public transportation service,The solution is developed in TypeScript, focusing on clean architecture, maintainability, and robust logic, without relying on external frameworks like REST APIs, databases, or GUI components.

## Features

-   **Dynamic Fare Calculation:** Fares are determined based on the time of travel (peak/off-peak hours) and zones crossed (1-1, 1-2/2-1, 2-2).
-   **Daily Fare Capping:** Automatically caps daily expenditure based on the farthest journey made within that day.
-   **Weekly Fare Capping:** Caps weekly expenditure (Monday-Sunday), working in conjunction with daily caps.
-   **Configurable Rules:** Fare and capping rules are externalized in configuration files for easy modification.

## Project Structure

fare-calculator-engine/

├── src/

│ ├── config/ # Configuration for fare and cap rules

│ ├── models/ # TypeScript interfaces for data structures (Journey, FareRule, CapRule, etc.)

│ ├── services/ # Core business logic for fare calculation (FareCalculator and FareCapper)

│ ├── utils/ # Helper functions for date/time manipulation and zone mapping

│ └── app.ts # Main application entry point for processing journey data from a file

├── tests/ # Comprehensive unit tests for core logic

├── data/ # Example input data files (journeys.json)

├── package.json # Project dependencies and scripts

├── tsconfig.json # TypeScript compiler configuration

├── jest.config.js # Jest test runner configuration

├── .gitignore # Git ignore rules

└── README.md # Project documentation

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone fare-calculator-engine
    cd fare-calculator-engine
    ```

2.  **Install dependencies:**
    Ensure you have Node.js (LTS recommended) and npm (or yarn) installed.
    ```bash
    npm install
    # or yarn install
    ```

3.  **Build the TypeScript project:**
    This compiles the TypeScript source files (`.ts`) into JavaScript (`.js`) files, placing them in the `dist/` directory.
    ```bash
    npm run build
    ```

## How to Run and Test

### Run the application with default input

The `app.ts` script reads journey data from `./data/journeys.json` by default.

```bash
npm start

### Run the test suite using:
npm run test

### Modifying Journey Data for Testing
You can customize the journey data to simulate different travel scenarios and see how the fare calculation logic works.

Steps:
Navigate to the data folder.

Open the file: journeys.json.

Modify, add, or remove journey records as needed.

### Output:
The fare calculation results will be displayed directly in the terminal console.

You will see a detailed summary including individual journey fares, daily totals, and weekly caps applied (if any).
