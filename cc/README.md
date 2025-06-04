Tour Costing & CVP Analysis Application
1. Overview
This is a comprehensive web application designed for tour operators and management to:

Accurately calculate detailed tour costs.

Manage various cost components including variable, commission, and shared costs.

Determine optimal selling prices based on expected margins or manual overrides.

Perform Cost-Volume-Profit (CVP) analysis to understand profitability under different scenarios (group sizes, selling price adjustments).

Analyze competitor offerings side-by-side.

Gain AI-powered insights from CVP data.

Export costing details and analyses to Excel and PDF formats.

The application is built as a single-page React application and currently operates entirely on the client-side (in the browser), meaning no data is saved to a backend server between sessions unless integrated with a backend service like Firebase (which is currently commented out/removed).

2. Key Features
General Program Information: Input basic tour details like program name, operator, airline, group size, number of days/nights, and meal information.

Currency Conversion: Select an original currency for specific costs (e.g., air tickets, land fare) and automatically convert to a target currency (THB) using a live exchange rate API, with manual override.

Detailed Cost Inputs:

Variable Costs (Per Person): Air tickets, taxes, land fare, insurance, tips, office expenses, VAT.

Commissions (Per Person): For operations, sales agents, agent companies.

Shared Costs (Total for Group): Tour leader airfare & insurance (auto-calculated), airport staff, tour leader wage (calculated from daily rate and number of days), taxi, and other expenses.

Cost Summaries:

Sum of Variable Costs

Sum of Commissions

Sum of Shared Costs (and per person breakdown)

Total Cost Per Person

Total Cost With Marketing (based on a configurable percentage)

Flexible Selling Price Calculation:

Input an "Expected Margin (%)" to get a "Recommended Selling Price."

Option to input a "Manual Selling Price" to override the recommendation.

Add customer tips.

Calculates "Final Selling Price."

Revenue & Profit/Loss Analysis:

Profit/Loss per person.

Total Profit/Loss for the group.

CVP (Cost-Volume-Profit) Analysis:

Generates a matrix showing total group profit/loss for various group sizes (10, 15, 20, 25, 30 pax) at different selling price adjustments from the calculated final selling price.

AI-Powered CVP Insights:

Button to generate a brief textual insight based on the CVP data using the Gemini API.

Competitive Analysis:

Add up to 8 competitors with details: name, trip length, airline, min/max price (average calculated), total meals, hotel level, commission, and additional tip.

Side-by-side comparison table showing your product against competitors for key features.

Export Functionality:

Export comprehensive costing data, CVP analysis, and competitor comparison to an Excel file (multiple sheets).

Export a summary PDF document.

User Interface:

Responsive design for use on different screen sizes.

Collapsible sections for better organization.

Number formatting for currency values.

Notifications for actions and errors.

3. Technology Stack (Client-Side)
Frontend Library: React.js

Styling: Tailwind CSS

Icons: Lucide React

Exchange Rate Data: ExchangeRate-API.com (requires a free API key)

AI Insights: Google Gemini API (via gemini-2.0-flash model)

Excel Export: SheetJS (xlsx) - Assumed to be loaded via CDN

PDF Export: jsPDF & jsPDF-AutoTable - Assumed to be loaded via CDN

4. Setup and Running Locally
These instructions assume you are setting up a standard Create React App project.

Prerequisites:

Node.js and npm (or yarn) installed.

Create React App (if starting fresh):

npx create-react-app tour-costing-app
cd tour-costing-app

Install Dependencies:

Lucide React (Icons):

npm install lucide-react
# or
yarn add lucide-react

Tailwind CSS: Follow the official guide for installing Tailwind CSS with Create React App: https://tailwindcss.com/docs/guides/create-react-app

Install Tailwind CSS, PostCSS, and Autoprefixer:

npm install -D tailwindcss postcss autoprefixer

Generate config files:

npx tailwindcss init -p

Configure template paths in tailwind.config.js:

// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

Add Tailwind directives to your ./src/index.css:

@tailwind base;
@tailwind components;
@tailwind utilities;

Replace src/App.js:

Copy the entire React code provided for this application and replace the contents of your project's src/App.js (or App.jsx) file.

API Key Configuration:

Open the App.jsx (or App.js) file.

Locate the EXCHANGE_RATE_API_KEY constant near the top.

Replace the placeholder or existing key with your actual API key from ExchangeRate-API.com.

const EXCHANGE_RATE_API_KEY = "YOUR_ACTUAL_API_KEY_HERE";

Add CDN Scripts for Export Libraries (Optional - for local export functionality):

If you want the "Export to Excel" and "Export to PDF" buttons to work when running locally (outside an environment that might provide these), add the following script tags to your public/index.html file, just before the closing </body> tag:

<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>

Start the Development Server:

npm start
# or
yarn start

This will open the application in your default web browser, usually at http://localhost:3000.

5. Deployment
To deploy this application for remote access:

Build the Application:

npm run build
# or
yarn build

This creates a build folder with static assets.

Deploy to a Static Site Host:

Upload the contents of the build folder to a static site hosting provider like:

Netlify (recommended for ease of use)

Vercel

GitHub Pages

Cloudflare Pages

AWS S3

6. Notes
Client-Side Operation: As currently configured, this application runs entirely in the browser. Data is not saved between sessions unless you re-integrate a backend solution like Firebase.

API Rate Limits: Be mindful of any rate limits on the free tier of the ExchangeRate-API and the Gemini API.

Export Libraries: The export functionality relies on third-party libraries (SheetJS for Excel, jsPDF & jsPDF-Autotable for PDF). If not using the CDN links for local development, ensure these are properly managed if you bundle the application.

7. Future Considerations
Backend Integration (e.g., Firebase): To enable saving and loading of costing sheets, user accounts, and potentially collaborative features.

More Advanced AI Features: Deeper CVP analysis, cost anomaly detection, predictive pricing based on historical data.

Direct Google Sheets Export: Using the Google Sheets API for more seamless integration.

UI/UX Enhancements: More sophisticated charting, drag-and-drop features, etc.
