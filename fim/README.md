# ✈️ Flight Inventory Management System

A modern, professional flight inventory management application built with HTML5, CSS3, JavaScript, and AG Grid. This system provides comprehensive PNR (Passenger Name Record) management with real-time Amadeus API integration capabilities.

![Flight Management Interface](https://img.shields.io/badge/Interface-Professional-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![AG%20Grid](https://img.shields.io/badge/AG%20Grid-Latest-orange)

## 🌟 Features

### 📊 **Core Functionality**
- **PNR-Grouped Management**: Complete PNR booking units with 2-4 flight segments
- **Real-time Data Grid**: Professional AG Grid implementation with advanced filtering
- **Amadeus API Integration**: Live flight route and timing updates
- **Dynamic Row Height**: Adjustable row heights (45-90px) for optimal viewing
- **Smart Sorting**: PNR-grouped sorting maintains booking integrity

### 💰 **Financial Calculations**
- **Auto-calculated Total Fare**: Fare + YQ/Tax
- **Auto-calculated Total Deposit**: Seats × Deposit per seat
- **Multi-currency Support**: Thai Baht (฿) formatting
- **Real-time Updates**: Instant recalculation on data changes

### 📅 **Intelligent Date Management**
- **PNR-based Deadlines**: Single deadline per PNR (based on first flight)
- **Deadline 1**: -60 days from departure
- **Deadline 2**: -30 days from departure  
- **Issue Date**: -20 days from departure
- **Color-coded Urgency**: Visual deadline status indicators

### 🎨 **Professional UI/UX**
- **Modern Design**: Clean, responsive interface with Tailwind CSS
- **Interactive Elements**: Hover effects, smooth transitions
- **Visual Grouping**: Clear PNR separation with subtle borders
- **Search & Filter**: Advanced column filtering and quick search
- **Data Export**: CSV export functionality

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SSaksit23/FlightDataManagementSystem.git
   cd FlightDataManagementSystem
   ```

2. **Install dependencies** (if using React development environment)
   ```bash
   npm install
   ```

3. **Run the application**
   
   **Option A: Direct HTML** (Recommended for production)
   ```bash
   # Open public/index.html in your browser
   open public/index.html
   ```
   
   **Option B: Development Server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Production: `public/index.html`
   - Development: `http://localhost:3000`

## 📋 Data Structure

### PNR Groups
Each PNR contains multiple flight segments:

```javascript
{
  id: 1,
  groupCode: 'CHNURC01',
  pnr: 'ABC123',
  departureDate: '2025-05-30',
  flight: 'CZ3036',
  seat: 25,
  fare: 8500,
  yq: 1500,
  deposit: 2000,
  pushToMarket: 'Yes',
  route: 'BKK-CAN',        // From Amadeus API
  time: '03.00-07.00'      // From Amadeus API
}
```

### Field Types
- **User Input**: Group Code, PNR, Date, Flight, Seats, Fare, YQ/Tax, Deposit
- **Amadeus API**: Route, Time (via refresh buttons)
- **Auto-calculated**: Total Fare, Total Deposit, Issue Date, Deadlines

## 🎯 Key Features

### PNR-Grouped Operations
- **Unified Deadlines**: One set of deadlines per PNR (based on first flight)
- **Smart Sorting**: PNRs stay together during deadline sorting
- **Visual Grouping**: Clear separation between different PNRs

### Advanced Grid Features
- **Column Filtering**: Individual column filters with floating filter row
- **Quick Search**: Global search across all data
- **Multi-row Selection**: Bulk operations with checkboxes
- **Dynamic Sizing**: Adjustable row heights for optimal viewing
- **Data Export**: Export to CSV functionality

### Amadeus Integration
- **Route Updates**: Click refresh (⟳) to fetch route information
- **Time Updates**: Real-time departure/arrival times
- **Mock API**: Simulated Amadeus responses for demo

## 🔧 Configuration

### Row Height Adjustment
Use the slider in the toolbar to adjust row height (45-90px):
```css
:root {
  --row-height: 65px; /* Default */
}
```

### Amadeus API Configuration
```javascript
// Configure your Amadeus API credentials
const amadeus = {
  baseURL: 'test.api.amadeus.com',
  apiKey: 'your-api-key',
  secret: 'your-secret'
};
```

## 📁 Project Structure

```
FlightDataManagementSystem/
├── public/
│   └── index.html          # Main application file
├── src/
│   └── App.jsx            # React placeholder
├── package.json           # Dependencies
├── README.md             # This file
└── .gitignore            # Git ignore rules
```

## 🎨 Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Grid Component**: AG Grid Community Edition
- **Styling**: Tailwind CSS via CDN
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)
- **API Integration**: Mock Amadeus API (ready for real implementation)

## 📊 Data Management

### Sample Routes Included
- **China**: BKK-CAN-URC-CAN-BKK (China Southern)
- **Europe**: BKK-CDG-FRA-BKK (Air France, Lufthansa, Thai)
- **USA**: BKK-LAX-SFO (United Airlines)
- **Japan**: BKK-NRT-BKK (Thai Airways, ANA)
- **Australia**: BKK-SYD-BKK (Qantas, Thai Airways)

## 🔐 Security Notes

- Store API keys securely in environment variables
- Implement proper authentication for production
- Use HTTPS for all API communications
- Validate all user inputs on backend

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Deployment

### GitHub Pages
1. Push to GitHub repository
2. Go to Settings > Pages
3. Select source: `main` branch, `/public` folder
4. Access via: `https://ssaksit23.github.io/FlightDataManagementSystem/`

### Local Server
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server public/

# PHP
php -S localhost:8000 -t public/
```

## 📞 Support

For questions or support, please:
- Open an issue on GitHub
- Contact: [Your Contact Information]

---

**Built with ❤️ for efficient flight inventory management** 