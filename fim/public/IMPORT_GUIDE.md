# Flight Inventory Import Guide

## 📥 CSV Import Feature

The Flight Inventory Management system supports flexible CSV import with intelligent field mapping.

### ✅ What You Need to Know

- **Not all fields are required** - the system will use sensible defaults
- **Flexible column headers** - case-insensitive matching with multiple aliases
- **Multiple date formats** supported
- **Currency symbols** are automatically handled
- **Empty cells** are handled gracefully

### 📋 Supported Column Headers

| Field | Accepted Headers (case-insensitive) |
|-------|-------------------------------------|
| Group Code | "Group Code", "GroupCode", "Group_Code", "Code" |
| PNR | "PNR", "Booking", "Booking Code", "Reference" |
| Departure Date | "Departure Date", "DepartureDate", "Departure_Date", "Date", "Dep Date" |
| Flight | "Flight", "Flight Number", "Flight_Number", "FlightNo", "Flight No" |
| Seats | "Seat", "Seats", "Pax", "Passengers", "Passenger" |
| Fare | "Fare", "Base Fare", "Base_Fare", "Price" |
| YQ/Tax | "YQ", "Tax", "YQ/Tax", "Taxes", "Fuel Surcharge", "Surcharge" |
| Deposit | "Deposit", "Advance", "Payment" |
| Push to Market | "Push to Market", "Push_to_Market", "Market", "Publish" |
| Route | "Route", "Sector", "Destination" |
| Time | "Time", "Departure Time", "Schedule" |

### 📅 Date Formats Supported

- `YYYY-MM-DD` (2025-12-01)
- `MM/DD/YYYY` (01/15/2025)
- `MM-DD-YYYY` (01-15-2025)
- `YYYY/MM/DD` (2025/06/20)

### 💰 Currency Handling

- Automatically removes ฿, $, and comma symbols
- Example: "฿12,000" becomes 12000

### 🎯 Import Options

When importing, you can choose to:
- **Replace** all existing data
- **Add** to existing data (append)

### 📄 Sample CSV

Check `sample_import.csv` for an example with missing fields to see how the system handles incomplete data.

### ⚠️ Important Notes

- CSV files only (Excel support requires export to CSV first)
- At least one of: PNR, Flight Number, or Group Code must be present
- Invalid rows are skipped automatically
- Unique IDs are generated automatically
- Missing numeric fields default to 0
- Missing text fields default to empty string
- Missing dates default to today's date 