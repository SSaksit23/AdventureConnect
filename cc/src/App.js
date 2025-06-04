import React, { useState, useEffect, useCallback } from 'react';
// Firebase imports are removed
import { ArrowDownToLine, UploadCloud, BarChart3, Calculator, Settings, Trash2, PlusCircle, Copy, FileDown, Brain, RefreshCw, CalendarDays, Moon, Percent, Edit3, Users, Briefcase, Plane, Hotel, Utensils, DollarSign, Gift, Columns, FileSpreadsheet, FileText } from 'lucide-react'; // Added more icons

// --- CDN Library Placeholders ---
// For this app to work standalone with export functionality, you would include these in your HTML:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>


// --- Exchange Rate API Configuration ---
const EXCHANGE_RATE_API_KEY = "60b9f6293a0664d19957a65f"; // Your ExchangeRate-API Key
const EXCHANGE_RATE_API_URL_BASE = "https://v6.exchangerate-api.com/v6/";

// --- App Identifier (can be static if not using Firebase for multi-tenancy) ---
const currentAppId = "tour_costing_app_local_v1"; 

// --- Helper Function for Number Formatting ---
const formatNumberWithCommas = (number, defaultValue = '0.00') => {
    if (number === null || number === undefined || isNaN(Number(number))) {
        return defaultValue;
    }
    return Number(number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


// --- Helper Components ---
const Section = ({ title, icon, children, gridCols = "lg:grid-cols-3", isCollapsible = false, defaultOpen = true }) => { 
    const [isOpen, setIsOpen] = useState(isCollapsible ? defaultOpen : true); 

    return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div 
            className={`flex justify-between items-center ${isCollapsible ? 'cursor-pointer' : ''}`}
            onClick={isCollapsible ? () => setIsOpen(!isOpen) : undefined}
        >
            <h2 className="text-2xl font-semibold text-indigo-700 flex items-center">
                {icon && React.createElement(icon, { className: "mr-3 h-6 w-6 text-indigo-500" })}
                {title}
            </h2>
            {isCollapsible && (
                <button className="text-indigo-500 hover:text-indigo-700">
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    )}
                </button>
            )}
        </div>
        {isOpen && (
            <div className={`mt-6 grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6`}>
                {children}
            </div>
        )}
    </div>
    );
};

const InputField = ({ label, type = "number", value, onChange, name, placeholder, currency, readOnly = false, step = "0.01", disabled = false, onIconClick, icon, min, inputClassName = "" }) => (
    <div className="flex flex-col space-y-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center relative">
            <input
                type={type}
                id={name}
                name={name}
                value={value === null || value === undefined ? '' : value} // Keep input as raw number string
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
                disabled={disabled || readOnly}
                step={type === "number" ? step : undefined}
                min={type === "number" ? min : undefined}
                className={`w-full p-3 border ${readOnly || disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out ${inputClassName}`}
            />
            {currency && !icon && <span className="ml-2 text-gray-500 whitespace-nowrap">{currency}</span>}
            {icon && onIconClick && (
                <button onClick={onIconClick} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-600 hover:text-indigo-800 disabled:text-gray-400" disabled={disabled}>
                    {React.createElement(icon, {className: "h-5 w-5"})}
                </button>
            )}
        </div>
    </div>
);


const CalculatedField = ({ label, value, currency, isHighlighted = false, className = "" }) => (
    <div className={`flex flex-col space-y-1 ${className}`}>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className={`p-3 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm ${isHighlighted ? 'ring-2 ring-green-500' : ''}`}>
            <span className={`font-semibold text-lg ${isHighlighted ? 'text-green-700' : 'text-indigo-800'}`}>
                {formatNumberWithCommas(value)}
            </span>
            {currency && <span className="ml-2 text-gray-500">{currency}</span>}
        </div>
    </div>
);

const Button = ({ onClick, children, icon, variant = 'primary', className = '', disabled = false, size = 'normal' }) => {
    const baseStyle = "font-semibold shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm rounded-md",
        normal: "px-6 py-3 rounded-lg"
    };
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
        success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500",
    };
    return (
        <button onClick={onClick} className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`} disabled={disabled}>
            {icon && React.createElement(icon, { className: "mr-2 h-5 w-5" })}
            {children}
        </button>
    );
};

// --- Main Application Component ---
function App() {
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success"); 
    const [cvpAiInsight, setCvpAiInsight] = useState("");
    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
    const [competitors, setCompetitors] = useState([]);


    const initialFormData = {
        programName: "New Tour Program",
        landOperator: "",
        airline: "",
        groupSize: 10,
        numberOfDays: 1, 
        numberOfNights: 0, 
        ourProduct_totalMeals: "", 
        originalCurrency: "CNY", 
        exchangeRate: 5.00,    

        var_airTicket_orig: 0,
        var_airTicket_thb: 0,
        var_yqTax_thb: 0,
        var_landFare_orig: 0,
        var_landFare_thb: 0,
        var_insurance_thb: 0,
        var_tipDriverGuide_thb: 0,
        var_officeExpense_thb: 0,
        var_tipTourLeader_thb: 0,
        var_vat_thb: 0,

        comm_operation_thb: 0,
        comm_salesAgent_thb: 0,
        comm_agentCo_thb: 0,

        shared_airportStaff_thb: 0,
        shared_tourLeaderWagePerDay_thb: 0, 
        shared_taxiExpense_thb: 0,
        shared_etcExpense_thb: 0,

        expectedMarginPercentage: 20, 
        manualSellingPrice_thb: "", 
        selling_tip_thb: 0,

        marketingExpensePercentage: 4,
    };

    const [formData, setFormData] = useState(initialFormData);

    const displayNotification = (message, type = "success", duration = 3000) => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => {
            setShowNotification(false);
        }, duration);
    };
    
    const fetchExchangeRate = useCallback(async (currency) => {
        if (!EXCHANGE_RATE_API_KEY) {
            console.warn("Exchange Rate API Key is missing.");
            displayNotification("Exchange Rate API Key missing. Manual input required.", "error");
            return;
        }
        if (!currency) {
            console.warn("No currency selected to fetch rate for.");
            return;
        }
        console.log(`API: Fetching exchange rate for ${currency} to THB.`);
        setIsFetchingRate(true);
        try {
            const response = await fetch(`${EXCHANGE_RATE_API_URL_BASE}${EXCHANGE_RATE_API_KEY}/latest/${currency}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ 'error-type': 'Unknown API error structure' })); 
                console.error("API: Exchange rate request failed:", response.status, errorData);
                throw new Error(`API request failed: ${errorData['error-type'] || response.status}`);
            }
            const data = await response.json();
            if (data.result === "success" && data.conversion_rates && data.conversion_rates.THB) {
                const rate = parseFloat(data.conversion_rates.THB.toFixed(4));
                console.log(`API: Successfully fetched rate for ${currency} to THB: ${rate}`);
                setFormData(prev => ({ ...prev, exchangeRate: rate }));
            } else {
                console.error("API: Invalid response format or THB rate not found:", data);
                if (data['error-type'] === 'unsupported-code') {
                     throw new Error(`Currency code '${currency}' is unsupported by the API.`);
                } else {
                    throw new Error("Invalid API response format or THB rate not found.");
                }
            }
        } catch (error) {
            console.error("API: Error fetching exchange rate:", error);
            displayNotification(`Failed to fetch exchange rate for ${currency}: ${error.message}. Please input manually.`, "error", 5000);
        } finally {
            setIsFetchingRate(false);
            console.log("API: Finished fetching exchange rate.");
        }
    }, []); 

    useEffect(() => {
        if (formData.originalCurrency) { 
            console.log(`Effect: originalCurrency is ${formData.originalCurrency}, attempting to fetch rate.`);
            fetchExchangeRate(formData.originalCurrency);
        }
    }, [formData.originalCurrency, fetchExchangeRate]);


    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        let processedValue = type === 'number' ? parseFloat(value) : value;
        
        if (type === 'number' && isNaN(processedValue)) {
             processedValue = ""; 
        } else if (type === 'number' && (name === "numberOfDays" || name === "numberOfNights" || name === "groupSize") && processedValue < 0) {
            processedValue = 0; 
        }
    
        setFormData(prev => {
            const updatedData = { ...prev, [name]: processedValue };
    
            if (name === "exchangeRate" || name === "var_airTicket_orig") {
                if (String(updatedData.var_airTicket_orig).trim() !== "" && parseFloat(updatedData.var_airTicket_orig) !== 0 && String(updatedData.exchangeRate).trim() !== "") {
                     updatedData.var_airTicket_thb = (parseFloat(updatedData.var_airTicket_orig || 0) * parseFloat(updatedData.exchangeRate || 0)).toFixed(2);
                } else if (String(updatedData.var_airTicket_orig).trim() === "") { 
                    updatedData.var_airTicket_thb = "";
                }
            }
            if (name === "exchangeRate" || name === "var_landFare_orig") {
                 if (String(updatedData.var_landFare_orig).trim() !== "" && parseFloat(updatedData.var_landFare_orig) !== 0 && String(updatedData.exchangeRate).trim() !== "") {
                    updatedData.var_landFare_thb = (parseFloat(updatedData.var_landFare_orig || 0) * parseFloat(updatedData.exchangeRate || 0)).toFixed(2);
                } else if (String(updatedData.var_landFare_orig).trim() === "") { 
                    updatedData.var_landFare_thb = "";
                }
            }
            
            return updatedData;
        });
    };
    
    const calculations = useCallback(() => {
        const data = { ...formData }; 
        Object.keys(data).forEach(key => { 
            if (typeof initialFormData[key] === 'number' && (String(data[key]).trim() === "" || data[key] === null || data[key] === undefined)) {
                data[key] = 0; 
            } else if (typeof initialFormData[key] === 'number' && typeof data[key] !== 'number') {
                data[key] = parseFloat(data[key]) || 0;
            }
        });

        const sumVarCosts = data.var_airTicket_thb + data.var_yqTax_thb + data.var_landFare_thb + data.var_insurance_thb + data.var_tipDriverGuide_thb + data.var_officeExpense_thb + data.var_tipTourLeader_thb + data.var_vat_thb;
        const sumCommissions = data.comm_operation_thb + data.comm_salesAgent_thb + data.comm_agentCo_thb;
        
        const totalTourLeaderWage_thb = (data.shared_tourLeaderWagePerDay_thb || 0) * (data.numberOfDays || 0);

        const shared_airTicketTourLeader_thb = data.var_airTicket_thb + data.var_yqTax_thb;
        const shared_insuranceTourLeader_thb = data.var_insurance_thb;
        const sumSharedCosts = shared_airTicketTourLeader_thb + 
                               shared_insuranceTourLeader_thb + 
                               data.shared_airportStaff_thb + 
                               totalTourLeaderWage_thb + 
                               data.shared_taxiExpense_thb + 
                               data.shared_etcExpense_thb;

        const groupSize = Math.max(1, data.groupSize);
        const sharedCostPerPerson = sumSharedCosts / groupSize;
        const totalCostPerPerson = sumVarCosts + sumCommissions + sharedCostPerPerson;
        const marketingExpenseAmount = totalCostPerPerson * (data.marketingExpensePercentage / 100);
        const totalCostWithMarketingPerPerson = totalCostPerPerson + marketingExpenseAmount;

        const recommendedSellingPrice_thb_before_tip = totalCostWithMarketingPerPerson * (1 + (data.expectedMarginPercentage / 100));
        
        let baseSellingPriceToUse = recommendedSellingPrice_thb_before_tip;
        if (data.manualSellingPrice_thb !== "" && parseFloat(data.manualSellingPrice_thb) > 0) {
            baseSellingPriceToUse = parseFloat(data.manualSellingPrice_thb);
        }

        const finalSellingPricePerPerson = baseSellingPriceToUse + data.selling_tip_thb;
        
        const profitLossPerPerson = finalSellingPricePerPerson - totalCostWithMarketingPerPerson;
        const totalProfitLossForGroup = profitLossPerPerson * groupSize;

        const cvpGroupSizes = [10, 15, 20, 25, 30];
        const cvpPriceSteps = [-3000, -2000, -1000, 0, 1000, 2000, 3000]; 
        
        const cvpMatrix = cvpGroupSizes.map(pax => {
            const sharedCostPerPaxForCVP = sumSharedCosts / Math.max(1, pax);
            const totalCostPerPaxForCVP = sumVarCosts + sumCommissions + sharedCostPerPaxForCVP;
            const marketingForCVP = totalCostPerPaxForCVP * (data.marketingExpensePercentage / 100);
            const totalCostWithMarketingForCVP = totalCostPerPaxForCVP + marketingForCVP;
            return cvpPriceSteps.map(step => {
                const sellingPriceScenario = finalSellingPricePerPerson + step; 
                const profit = sellingPriceScenario - totalCostWithMarketingForCVP;
                return { 
                    pax, 
                    sellingPrice: sellingPriceScenario, 
                    profitPerPerson: profit, 
                    totalProfit: profit * pax 
                };
            });
        });
        
        const sharedCostBreakdown = {};
        cvpGroupSizes.forEach(pax => {
            sharedCostBreakdown[pax] = sumSharedCosts / Math.max(1, pax);
        });

        return {
            sumVarCosts, sumCommissions, shared_airTicketTourLeader_thb, shared_insuranceTourLeader_thb,
            totalTourLeaderWage_thb, 
            recommendedSellingPrice_thb_before_tip, 
            sumSharedCosts, sharedCostPerPerson, sharedCostBreakdown, totalCostPerPerson, marketingExpenseAmount,
            totalCostWithMarketingPerPerson, finalSellingPricePerPerson, profitLossPerPerson,
            totalProfitLossForGroup, cvpMatrix,
        };
    }, [formData]);

    const calculatedValues = calculations();
    
    const handleNewCosting = () => {
        console.log("Action: Creating new costing sheet (local).");
        setFormData(initialFormData);
        setCompetitors([]); 
        setCvpAiInsight(""); 
        if (initialFormData.originalCurrency) { 
            fetchExchangeRate(initialFormData.originalCurrency);
        }
        displayNotification("New costing sheet created.", "success");
    };

    // --- Competitor Analysis Functions ---
    const addCompetitor = () => {
        if (competitors.length < 8) {
            setCompetitors([...competitors, { 
                id: Date.now(), 
                name: "", 
                tripLength: "", 
                airline: "", 
                maxPrice: "", 
                minPrice: "", 
                totalMeals: "", 
                hotelLevel: "", 
                commission: "", 
                additionalTip: "" 
            }]);
        } else {
            displayNotification("Maximum of 8 competitors reached.", "error");
        }
    };

    const removeCompetitor = (id) => {
        setCompetitors(competitors.filter(comp => comp.id !== id));
    };

    const handleCompetitorChange = (id, field, value) => {
        let processedValue = value;
        if (field === "minPrice" || field === "maxPrice" || field === "commission" || field === "additionalTip") {
            processedValue = parseFloat(value);
            if (isNaN(processedValue)) processedValue = "";
        }
        setCompetitors(competitors.map(comp => 
            comp.id === id ? { ...comp, [field]: processedValue } : comp
        ));
    };


    const generateCVPInsight = async () => {
        if (!calculatedValues || !calculatedValues.cvpMatrix) {
            displayNotification("Please calculate costs first to generate CVP insights.", "error");
            return;
        }
        console.log("AI: Generating CVP insight.");
        setIsGeneratingInsight(true);
        setCvpAiInsight("Generating insights...");

        let promptDataSummary = `The current tour program is for ${formData.numberOfDays} days and ${formData.numberOfNights} nights.
        The expected margin is ${formData.expectedMarginPercentage}%.
        The recommended selling price (before tip, based on margin) is ${formatNumberWithCommas(calculatedValues.recommendedSellingPrice_thb_before_tip)} THB.
        The manual selling price entered (before tip) is ${formData.manualSellingPrice_thb !== "" ? formatNumberWithCommas(formData.manualSellingPrice_thb) + " THB" : "not set"}.
        The final selling price used for calculations (with tip) is ${formatNumberWithCommas(calculatedValues.finalSellingPricePerPerson)} THB.
        The total cost with marketing per person at the base group size of ${formData.groupSize} is ${formatNumberWithCommas(calculatedValues.totalCostWithMarketingPerPerson)} THB.
        The profit/loss per person at this base configuration is ${formatNumberWithCommas(calculatedValues.profitLossPerPerson)} THB.
        CVP Analysis Matrix (Total Group Profit/Loss for different group sizes and selling price adjustments from the final selling price of ${formatNumberWithCommas(calculatedValues.finalSellingPricePerPerson)} THB):
        `;

        calculatedValues.cvpMatrix.forEach((paxData, paxIndex) => {
            const groupSize = [10, 15, 20, 25, 30][paxIndex];
            promptDataSummary += `For ${groupSize} PAX:\n`;
            paxData.forEach(pricePoint => {
                const priceAdjustment = pricePoint.sellingPrice - calculatedValues.finalSellingPricePerPerson;
                promptDataSummary += `  - Selling Price: ${formatNumberWithCommas(pricePoint.sellingPrice)} THB (Adj: ${priceAdjustment >=0 ? '+' : ''}${formatNumberWithCommas(priceAdjustment)} THB) -> Total Group Profit: ${formatNumberWithCommas(pricePoint.totalProfit)} THB\n`;
            });
        });
        
        promptDataSummary += "\nProvide a brief, actionable insight (2-3 sentences) for a tour operator based on this CVP data. Focus on profitability, break-even points, or optimal pricing/group size combinations. Be concise and practical.";
        console.log("AI: Prompt for Gemini API:", promptDataSummary);

        try {
            let chatHistory = [{ role: "user", parts: [{ text: promptDataSummary }] }];
            const payload = { contents: chatHistory };
            const geminiApiKey = ""; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("AI: Gemini API request failed:", response.status, errorBody);
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }
            
            const result = await response.json();
            console.log("AI: Gemini API response received:", result);

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setCvpAiInsight(text);
                console.log("AI: Insight successfully generated and set.");
            } else {
                setCvpAiInsight("Could not retrieve insight. The response structure was unexpected.");
                console.error("AI: Unexpected API response structure:", result);
            }
        } catch (error) {
            console.error("AI: Error generating CVP insight:", error);
            setCvpAiInsight(`Error generating insight: ${error.message}. Check console for details.`);
        } finally {
            setIsGeneratingInsight(false);
            console.log("AI: Finished generating CVP insight.");
        }
    };

    // --- Export Functions ---
    const handleExportToExcel = () => {
        if (!window.XLSX) {
            displayNotification("Excel export library (SheetJS) not loaded.", "error");
            console.error("XLSX (SheetJS) is not available. Make sure it's loaded via CDN.");
            return;
        }
        try {
            // 1. Main Costing Data
            const mainCostingData = [
                { Item: "Program Name", Value: formData.programName },
                { Item: "Land Operator", Value: formData.landOperator },
                { Item: "Airline", Value: formData.airline },
                { Item: "Group Size (Pax)", Value: formData.groupSize },
                { Item: "Number of Days", Value: formData.numberOfDays },
                { Item: "Number of Nights", Value: formData.numberOfNights },
                { Item: "Our Product - Total Meals", Value: formData.ourProduct_totalMeals },
                { Item: "Original Currency", Value: formData.originalCurrency },
                { Item: "Exchange Rate", Value: formData.exchangeRate },
                { Item: "", Value: "" }, // Spacer
                { Item: "--- Variable Costs (Per Person) ---", Value: "" },
                { Item: "Air Ticket (Original Curr.)", Value: formData.var_airTicket_orig, Currency: formData.originalCurrency },
                { Item: "Air Ticket (THB)", Value: formData.var_airTicket_thb, Currency: "THB" },
                { Item: "YQ / Add-on Tax (THB)", Value: formData.var_yqTax_thb, Currency: "THB" },
                { Item: "Land Fare (Original Curr.)", Value: formData.var_landFare_orig, Currency: formData.originalCurrency },
                { Item: "Land Fare (THB)", Value: formData.var_landFare_thb, Currency: "THB" },
                { Item: "Insurance (THB)", Value: formData.var_insurance_thb, Currency: "THB" },
                { Item: "Tip for Driver/Guide (THB)", Value: formData.var_tipDriverGuide_thb, Currency: "THB" },
                { Item: "Office Expense (THB)", Value: formData.var_officeExpense_thb, Currency: "THB" },
                { Item: "Tip for Tour Leader (THB)", Value: formData.var_tipTourLeader_thb, Currency: "THB" },
                { Item: "VAT (THB)", Value: formData.var_vat_thb, Currency: "THB" },
                { Item: "SUM of Variable Costs (THB)", Value: calculatedValues.sumVarCosts, Currency: "THB" },
                { Item: "", Value: "" },
                { Item: "--- Commissions (Per Person) ---", Value: "" },
                { Item: "Commission for Operation (THB)", Value: formData.comm_operation_thb, Currency: "THB" },
                { Item: "Commission for Sales Agent (THB)", Value: formData.comm_salesAgent_thb, Currency: "THB" },
                { Item: "Commission for Agent Co. (THB)", Value: formData.comm_agentCo_thb, Currency: "THB" },
                { Item: "SUM of Commissions (THB)", Value: calculatedValues.sumCommissions, Currency: "THB" },
                { Item: "", Value: "" },
                { Item: "--- Shared Costs (Total for Group) ---", Value: "" },
                { Item: "Air Ticket for Tour Leader (THB)", Value: calculatedValues.shared_airTicketTourLeader_thb, Currency: "THB" },
                { Item: "Insurance for Tour Leader (THB)", Value: calculatedValues.shared_insuranceTourLeader_thb, Currency: "THB" },
                { Item: "Airport Staff (THB)", Value: formData.shared_airportStaff_thb, Currency: "THB" },
                { Item: "Tour Leader Wage per Day (THB)", Value: formData.shared_tourLeaderWagePerDay_thb, Currency: "THB" },
                { Item: "Total Tour Leader Wage (THB)", Value: calculatedValues.totalTourLeaderWage_thb, Currency: "THB" },
                { Item: "Taxi Expense (THB)", Value: formData.shared_taxiExpense_thb, Currency: "THB" },
                { Item: "Etc. Expense (THB)", Value: formData.shared_etcExpense_thb, Currency: "THB" },
                { Item: "SUM of Shared Costs (THB)", Value: calculatedValues.sumSharedCosts, Currency: "THB" },
                { Item: `Shared Cost Per Person (for ${formData.groupSize} Pax)`, Value: calculatedValues.sharedCostPerPerson, Currency: "THB" },
                 { Item: "", Value: "" },
                { Item: "--- Cost Summary (Per Person) ---", Value: "" },
                { Item: "Total Variable Costs (THB)", Value: calculatedValues.sumVarCosts, Currency: "THB" },
                { Item: "Total Commissions (THB)", Value: calculatedValues.sumCommissions, Currency: "THB" },
                { Item: `Shared Cost (for ${formData.groupSize} Pax) (THB)`, Value: calculatedValues.sharedCostPerPerson, Currency: "THB" },
                { Item: "TOTAL COST PER PERSON (THB)", Value: calculatedValues.totalCostPerPerson, Currency: "THB" },
                { Item: "Marketing Expense (%)", Value: formData.marketingExpensePercentage, Currency: "%" },
                { Item: "Marketing Expense Amount (THB)", Value: calculatedValues.marketingExpenseAmount, Currency: "THB" },
                { Item: "TOTAL COST WITH MARKETING (THB)", Value: calculatedValues.totalCostWithMarketingPerPerson, Currency: "THB" },
                { Item: "", Value: "" },
                { Item: "--- Selling Price (Per Person) ---", Value: "" },
                { Item: "Expected Margin (%)", Value: formData.expectedMarginPercentage, Currency: "%" },
                { Item: "Recommended Selling Price (THB, before tip)", Value: calculatedValues.recommendedSellingPrice_thb_before_tip, Currency: "THB" },
                { Item: "Manual Selling Price (THB, before tip)", Value: formData.manualSellingPrice_thb, Currency: "THB" },
                { Item: "Customer Tip (THB)", Value: formData.selling_tip_thb, Currency: "THB" },
                { Item: "FINAL SELLING PRICE (Used for Calcs) (THB)", Value: calculatedValues.finalSellingPricePerPerson, Currency: "THB" },
                { Item: "", Value: "" },
                { Item: "--- Revenue & Profit/Loss ---", Value: "" },
                { Item: "Revenue per Person (Final Selling Price) (THB)", Value: calculatedValues.finalSellingPricePerPerson, Currency: "THB" },
                { Item: "Expense per Person (Total Cost w/ Marketing) (THB)", Value: calculatedValues.totalCostWithMarketingPerPerson, Currency: "THB" },
                { Item: "PROFIT / LOSS PER PERSON (THB)", Value: calculatedValues.profitLossPerPerson, Currency: "THB" },
                { Item: `TOTAL PROFIT / LOSS FOR GROUP (${formData.groupSize} Pax) (THB)`, Value: calculatedValues.totalProfitLossForGroup, Currency: "THB" },
            ];
            const wsMain = window.XLSX.utils.json_to_sheet(mainCostingData, { skipHeader: true }); // Using skipHeader as Item is the header

            // 2. CVP Matrix Data
            const cvpHeader = ["Pax Size", ...calculatedValues.cvpMatrix[0].map(cell => `${formatNumberWithCommas(cell.sellingPrice)} THB`)];
            const cvpBody = calculatedValues.cvpMatrix.map((row, rowIndex) => {
                const paxSize = [10,15,20,25,30][rowIndex];
                return [paxSize, ...row.map(cell => formatNumberWithCommas(cell.totalProfit))];
            });
            const wsCVP = window.XLSX.utils.aoa_to_sheet([cvpHeader, ...cvpBody]);

            // 3. Competitor Comparison Data
            const compHeader = ["Feature", "Our Product", ...competitors.map((c, i) => c.name || `Competitor ${i+1}`)];
            const compBody = [
                { label: "Trip Length", ourValue: `${formData.numberOfDays}D${formData.numberOfNights}N`, compField: "tripLength" },
                { label: "Airline", ourValue: formData.airline || "N/A", compField: "airline" },
                { label: "Avg. Price (THB)", ourValue: formatNumberWithCommas(calculatedValues.finalSellingPricePerPerson), compField: "avgPrice", isNumeric: true },
                { label: "Total Meals", ourValue: formData.ourProduct_totalMeals || "N/A", compField: "totalMeals" },
                { label: "Commission (THB)", ourValue: formatNumberWithCommas(calculatedValues.sumCommissions), compField: "commission", isNumeric: true },
                { label: "Tip (THB)", ourValue: formatNumberWithCommas(formData.selling_tip_thb), compField: "additionalTip", isNumeric: true },
            ].map(row => {
                const rowData = [row.label, row.ourValue];
                competitors.forEach(comp => {
                    let val = comp[row.compField] || "N/A";
                    if (row.compField === "avgPrice") {
                        const min = parseFloat(comp.minPrice) || 0;
                        const max = parseFloat(comp.maxPrice) || 0;
                        val = (min > 0 || max > 0) ? formatNumberWithCommas((min+max)/2) : "N/A";
                    } else if (row.isNumeric) {
                         val = formatNumberWithCommas(parseFloat(comp[row.compField]) || 0);
                    }
                    rowData.push(val);
                });
                return rowData;
            });
            const wsComp = window.XLSX.utils.aoa_to_sheet([compHeader, ...compBody]);

            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, wsMain, "Main Costing");
            window.XLSX.utils.book_append_sheet(wb, wsCVP, "CVP Analysis");
            window.XLSX.utils.book_append_sheet(wb, wsComp, "Competitor Comparison");

            window.XLSX.writeFile(wb, `${formData.programName || "TourCosting"}_Export.xlsx`);
            displayNotification("Exported to Excel successfully!", "success");

        } catch (error) {
            console.error("Error exporting to Excel:", error);
            displayNotification("Error exporting to Excel. See console.", "error");
        }
    };

    const handleExportToPDF = () => {
        if (!window.jsPDF || !window.jsPDF.autoTable) {
            displayNotification("PDF export library (jsPDF & autoTable) not loaded.", "error");
            console.error("jsPDF or jsPDF.autoTable is not available. Make sure it's loaded via CDN.");
            return;
        }
        try {
            const { jsPDF } = window;
            const doc = new jsPDF();
            let yPos = 15;

            doc.setFontSize(18);
            doc.text(`Tour Costing: ${formData.programName || "N/A"}`, 14, yPos);
            yPos += 10;

            doc.setFontSize(12);
            doc.text(`General Information:`, 14, yPos); yPos +=6;
            doc.setFontSize(10);
            doc.text(`  Land Operator: ${formData.landOperator || "N/A"}`, 14, yPos); yPos +=5;
            doc.text(`  Airline: ${formData.airline || "N/A"}`, 14, yPos); yPos +=5;
            doc.text(`  Group Size: ${formData.groupSize} Pax`, 14, yPos); yPos +=5;
            doc.text(`  Duration: ${formData.numberOfDays} Days, ${formData.numberOfNights} Nights`, 14, yPos); yPos +=5;
            doc.text(`  Our Meals: ${formData.ourProduct_totalMeals || "N/A"}`, 14, yPos); yPos +=5;
            doc.text(`  Original Currency: ${formData.originalCurrency}, Exchange Rate to THB: ${formData.exchangeRate}`, 14, yPos); yPos +=8;

            // --- Main Costs Table ---
            doc.setFontSize(12);
            doc.text("Cost & Revenue Summary (Per Person in THB):", 14, yPos); yPos += 6;
            const summaryData = [
                ["Total Variable Costs", formatNumberWithCommas(calculatedValues.sumVarCosts)],
                ["Total Commissions", formatNumberWithCommas(calculatedValues.sumCommissions)],
                [`Shared Cost (for ${formData.groupSize} Pax)`, formatNumberWithCommas(calculatedValues.sharedCostPerPerson)],
                ["TOTAL COST PER PERSON", formatNumberWithCommas(calculatedValues.totalCostPerPerson)],
                ["Marketing Expense (%)", `${formData.marketingExpensePercentage}%`],
                ["Marketing Expense Amount", formatNumberWithCommas(calculatedValues.marketingExpenseAmount)],
                ["TOTAL COST WITH MARKETING", formatNumberWithCommas(calculatedValues.totalCostWithMarketingPerPerson)],
                ["Expected Margin (%)", `${formData.expectedMarginPercentage}%`],
                ["Recommended Selling Price (before tip)", formatNumberWithCommas(calculatedValues.recommendedSellingPrice_thb_before_tip)],
                ["Manual Selling Price (before tip)", formData.manualSellingPrice_thb !== "" ? formatNumberWithCommas(formData.manualSellingPrice_thb) : "N/A"],
                ["Customer Tip", formatNumberWithCommas(formData.selling_tip_thb)],
                ["FINAL SELLING PRICE", formatNumberWithCommas(calculatedValues.finalSellingPricePerPerson)],
                ["PROFIT / LOSS PER PERSON", formatNumberWithCommas(calculatedValues.profitLossPerPerson)],
                [`TOTAL PROFIT / LOSS FOR GROUP (${formData.groupSize} Pax)`, formatNumberWithCommas(calculatedValues.totalProfitLossForGroup)],
            ];
            doc.autoTable({
                startY: yPos,
                head: [['Item', 'Value (THB)']],
                body: summaryData,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [75, 0, 130] }, // Indigo
            });
            yPos = doc.lastAutoTable.finalY + 10;


            // --- CVP Matrix ---
            if (yPos > 260) { doc.addPage(); yPos = 15; } // Check for page break
            doc.setFontSize(12);
            doc.text("CVP Analysis Matrix (Total Group Profit in THB):", 14, yPos); yPos +=6;
            const cvpHead = ["Pax Size", ...calculatedValues.cvpMatrix[0].map(cell => `${formatNumberWithCommas(cell.sellingPrice)}`)];
            const cvpBody = calculatedValues.cvpMatrix.map((row, rowIndex) => {
                const paxSize = [10,15,20,25,30][rowIndex];
                return [paxSize, ...row.map(cell => formatNumberWithCommas(cell.totalProfit))];
            });
             doc.autoTable({
                startY: yPos,
                head: [cvpHead],
                body: cvpBody,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1 },
                headStyles: { fillColor: [75, 0, 130], halign: 'center' },
                bodyStyles: { halign: 'right' },
                columnStyles: { 0: {halign: 'center'} }
            });
            yPos = doc.lastAutoTable.finalY + 10;

            // --- Competitor Comparison Table ---
             if (competitors.length > 0 || formData.programName) {
                if (yPos > 250) { doc.addPage(); yPos = 15; }
                doc.setFontSize(12);
                doc.text("Side-by-Side Comparison:", 14, yPos); yPos +=6;
                const compTableHead = ["Feature", "Our Product", ...competitors.map((c, i) => c.name || `Competitor ${i+1}`)];
                const compTableBody = [
                    { label: "Trip Length", ourValue: `${formData.numberOfDays}D${formData.numberOfNights}N`, compField: "tripLength" },
                    { label: "Airline", ourValue: formData.airline || "N/A", compField: "airline" },
                    { label: "Avg. Price (THB)", ourValue: formatNumberWithCommas(calculatedValues.finalSellingPricePerPerson), compField: "avgPrice", isNumeric: true },
                    { label: "Total Meals", ourValue: formData.ourProduct_totalMeals || "N/A", compField: "totalMeals" },
                    { label: "Commission (THB)", ourValue: formatNumberWithCommas(calculatedValues.sumCommissions), compField: "commission", isNumeric: true },
                    { label: "Tip (THB)", ourValue: formatNumberWithCommas(formData.selling_tip_thb), compField: "additionalTip", isNumeric: true },
                ].map(row => {
                    const rowData = [row.label, row.ourValue];
                    competitors.forEach(comp => {
                        let val = comp[row.compField] || "N/A";
                        if (row.compField === "avgPrice") {
                            const min = parseFloat(comp.minPrice) || 0;
                            const max = parseFloat(comp.maxPrice) || 0;
                            val = (min > 0 || max > 0) ? formatNumberWithCommas((min+max)/2) : "N/A";
                        } else if (row.isNumeric) {
                            val = formatNumberWithCommas(parseFloat(comp[row.compField]) || 0);
                        }
                        rowData.push(val);
                    });
                    return rowData;
                });
                doc.autoTable({
                    startY: yPos,
                    head: [compTableHead],
                    body: compTableBody,
                    theme: 'striped',
                    styles: { fontSize: 8, cellPadding: 1 },
                    headStyles: { fillColor: [75, 0, 130], halign: 'center' },
                    columnStyles: { 
                        0: {halign: 'left', fontStyle: 'bold'},
                        1: {halign: 'center'}, 
                    },
                    alternateRowStyles: {fillColor: [240, 240, 255]}
                });
             }


            doc.save(`${formData.programName || "TourCosting"}_Export.pdf`);
            displayNotification("Exported to PDF successfully!", "success");
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            displayNotification("Error exporting to PDF. See console.", "error");
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 p-4 sm:p-6 md:p-8 font-sans">
            {showNotification && (
                <div className={`fixed top-5 right-5 p-4 rounded-md shadow-lg text-white z-[100] ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notificationMessage}
                </div>
            )}

            <header className="mb-8 p-6 bg-white rounded-xl shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-4xl font-bold text-indigo-800">Tour Costing & CVP Analysis</h1>
                </div>
                <p className="text-gray-600 mt-2">App Version: Local ({currentAppId})</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={handleNewCosting} icon={PlusCircle} variant="secondary">New Costing</Button>
                    <Button onClick={handleExportToExcel} icon={FileSpreadsheet} variant="success">Export Excel</Button>
                    <Button onClick={handleExportToPDF} icon={FileText} variant="success">Export PDF</Button>
                </div>
            </header>

            <main>
                <Section title="General Program Information" icon={Settings} gridCols="lg:grid-cols-4"> 
                    <InputField label="Program Name" type="text" name="programName" value={formData.programName} onChange={handleInputChange} placeholder="e.g., China Discovery 7D6N" />
                    <InputField label="Land Operator" type="text" name="landOperator" value={formData.landOperator} onChange={handleInputChange} placeholder="Name of land operator" />
                    <InputField label="Airline" type="text" name="airline" value={formData.airline} onChange={handleInputChange} placeholder="e.g., Air China" />
                    <InputField label="Our Product - Total Meals" type="text" name="ourProduct_totalMeals" value={formData.ourProduct_totalMeals} onChange={handleInputChange} placeholder="e.g., 10 / All B" />
                    <InputField label="Group Size (Pax)" type="number" name="groupSize" value={formData.groupSize} onChange={handleInputChange} placeholder="e.g., 15" step="1" min="1"/>
                    <InputField label="Number of Days" type="number" name="numberOfDays" value={formData.numberOfDays} onChange={handleInputChange} placeholder="e.g., 7" step="1" min="1"/>
                    <InputField label="Number of Nights" type="number" name="numberOfNights" value={formData.numberOfNights} onChange={handleInputChange} placeholder="e.g., 6" step="1" min="0"/>
                    <div>
                        <label htmlFor="originalCurrency" className="block text-sm font-medium text-gray-700 mb-1">Original Currency (for Air/Land)</label>
                        <select name="originalCurrency" id="originalCurrency" value={formData.originalCurrency} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="CNY">CNY (RMB)</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="JPY">JPY</option>
                            <option value="KRW">KRW</option>
                        </select>
                    </div>
                    <InputField 
                        label={`Exchange Rate (1 ${formData.originalCurrency || "CUR"} to THB)`} 
                        type="number" name="exchangeRate" 
                        value={formData.exchangeRate} 
                        onChange={handleInputChange} 
                        placeholder={isFetchingRate ? "Fetching..." : "Auto-fetches or input manually"}
                        disabled={isFetchingRate}
                        icon={RefreshCw}
                        onIconClick={() => formData.originalCurrency && fetchExchangeRate(formData.originalCurrency)}
                    />
                </Section>

                <Section title="1. Variable Costs (Per Person)" icon={Calculator}>
                    <InputField label="Air Ticket (Original Curr.)" name="var_airTicket_orig" value={formData.var_airTicket_orig} onChange={handleInputChange} currency={formData.originalCurrency} />
                    <InputField label="Air Ticket (THB)" name="var_airTicket_thb" value={formData.var_airTicket_thb} onChange={handleInputChange} currency="THB" placeholder="Auto or Manual Input" />
                    <InputField label="YQ / Add-on Tax (THB)" name="var_yqTax_thb" value={formData.var_yqTax_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="Land Fare (Original Curr.)" name="var_landFare_orig" value={formData.var_landFare_orig} onChange={handleInputChange} currency={formData.originalCurrency} />
                    <InputField label="Land Fare (THB)" name="var_landFare_thb" value={formData.var_landFare_thb} onChange={handleInputChange} currency="THB" placeholder="Auto or Manual Input" />
                    <InputField label="Insurance (THB)" name="var_insurance_thb" value={formData.var_insurance_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="Tip for Driver/Guide (THB)" name="var_tipDriverGuide_thb" value={formData.var_tipDriverGuide_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="Office Expense (THB)" name="var_officeExpense_thb" value={formData.var_officeExpense_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="Tip for Tour Leader (THB)" name="var_tipTourLeader_thb" value={formData.var_tipTourLeader_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="VAT (THB)" name="var_vat_thb" value={formData.var_vat_thb} onChange={handleInputChange} currency="THB" />
                    <CalculatedField label="SUM of Variable Costs (THB)" value={calculatedValues.sumVarCosts} currency="THB" isHighlighted/>
                </Section>

                <Section title="2. Commissions (Per Person)" icon={Calculator}>
                    <InputField label="Commission for Operation (THB)" name="comm_operation_thb" value={formData.comm_operation_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="Commission for Sales Agent (THB)" name="comm_salesAgent_thb" value={formData.comm_salesAgent_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="Commission for Agent Co. (THB)" name="comm_agentCo_thb" value={formData.comm_agentCo_thb} onChange={handleInputChange} currency="THB" />
                    <CalculatedField label="SUM of Commissions (THB)" value={calculatedValues.sumCommissions} currency="THB" isHighlighted/>
                </Section>

                <Section title="3. Shared Costs (Total for Group)" icon={Calculator}>
                    <CalculatedField label="Air Ticket for Tour Leader (THB)" value={calculatedValues.shared_airTicketTourLeader_thb} currency="THB" />
                    <CalculatedField label="Insurance for Tour Leader (THB)" value={calculatedValues.shared_insuranceTourLeader_thb} currency="THB" />
                    <InputField label="Airport Staff (THB)" name="shared_airportStaff_thb" value={formData.shared_airportStaff_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="Tour Leader Wage per Day (THB)" name="shared_tourLeaderWagePerDay_thb" value={formData.shared_tourLeaderWagePerDay_thb} onChange={handleInputChange} currency="THB" />
                    <CalculatedField label="Total Tour Leader Wage (THB)" value={calculatedValues.totalTourLeaderWage_thb} currency="THB" />
                    <InputField label="Taxi Expense (THB)" name="shared_taxiExpense_thb" value={formData.shared_taxiExpense_thb} onChange={handleInputChange} currency="THB" />
                    <InputField label="Etc. Expense (THB)" name="shared_etcExpense_thb" value={formData.shared_etcExpense_thb} onChange={handleInputChange} currency="THB" />
                    <CalculatedField label="SUM of Shared Costs (THB)" value={calculatedValues.sumSharedCosts} currency="THB" isHighlighted/>
                    <CalculatedField label={`Shared Cost Per Person (for ${formData.groupSize} Pax)`} value={calculatedValues.sharedCostPerPerson} currency="THB" />
                    
                    <div className="md:col-span-2 lg:col-span-3 mt-4 p-4 border border-dashed border-indigo-300 rounded-lg">
                        <h4 className="text-md font-semibold text-indigo-600 mb-2">Shared Cost Breakdown per Person (for CVP):</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {Object.entries(calculatedValues.sharedCostBreakdown || {}).map(([pax, cost]) => (
                                <CalculatedField key={pax} label={`For ${pax} Pax`} value={cost} currency="THB" />
                            ))}
                        </div>
                    </div>
                </Section>

                <Section title="4. Cost Summary (Per Person)" icon={BarChart3}>
                    <CalculatedField label="Total Variable Costs" value={calculatedValues.sumVarCosts} currency="THB" />
                    <CalculatedField label="Total Commissions" value={calculatedValues.sumCommissions} currency="THB" />
                    <CalculatedField label={`Shared Cost (for ${formData.groupSize} Pax)`} value={calculatedValues.sharedCostPerPerson} currency="THB" />
                    <CalculatedField label="TOTAL COST PER PERSON" value={calculatedValues.totalCostPerPerson} currency="THB" isHighlighted/>
                    <InputField label="Marketing Expense (%)" type="number" name="marketingExpensePercentage" value={formData.marketingExpensePercentage} onChange={handleInputChange} placeholder="e.g., 4" currency="%"/>
                    <CalculatedField label="Marketing Expense Amount" value={calculatedValues.marketingExpenseAmount} currency="THB" />
                    <CalculatedField label="TOTAL COST WITH MARKETING" value={calculatedValues.totalCostWithMarketingPerPerson} currency="THB" isHighlighted/>
                </Section>

                <Section title="5. Selling Price (Per Person)" icon={Calculator} gridCols="lg:grid-cols-4"> 
                    <InputField 
                        label="Expected Margin (%)" 
                        type="number" 
                        name="expectedMarginPercentage" 
                        value={formData.expectedMarginPercentage} 
                        onChange={handleInputChange} 
                        currency="%" 
                        placeholder="e.g., 20"
                    />
                    <CalculatedField label="Recommended Selling Price (THB, before tip)" value={calculatedValues.recommendedSellingPrice_thb_before_tip} currency="THB" />
                     <InputField 
                        label="Manual Selling Price (THB, before tip)" 
                        type="number" 
                        name="manualSellingPrice_thb" 
                        value={formData.manualSellingPrice_thb} 
                        onChange={handleInputChange} 
                        currency="THB"
                        placeholder="Override recommended"
                    />
                    <InputField label="Customer Tip (THB)" name="selling_tip_thb" value={formData.selling_tip_thb} onChange={handleInputChange} currency="THB" />
                    <CalculatedField label="FINAL SELLING PRICE (Used for Calcs)" value={calculatedValues.finalSellingPricePerPerson} currency="THB" isHighlighted/>
                </Section>

                <Section title="6. Revenue & Profit/Loss" icon={BarChart3}>
                    <CalculatedField label="Revenue per Person (Final Selling Price)" value={calculatedValues.finalSellingPricePerPerson} currency="THB" />
                    <CalculatedField label="Expense per Person (Total Cost w/ Marketing)" value={calculatedValues.totalCostWithMarketingPerPerson} currency="THB" />
                    <CalculatedField label="PROFIT / LOSS PER PERSON" value={calculatedValues.profitLossPerPerson} currency="THB" isHighlighted/>
                    <CalculatedField label={`TOTAL PROFIT / LOSS FOR GROUP (${formData.groupSize} Pax)`} value={calculatedValues.totalProfitLossForGroup} currency="THB" isHighlighted/>
                </Section>
                
                <Section title="CVP Analysis & AI Insights" icon={Brain} isCollapsible={true} defaultOpen={false}>
                    <div className="md:col-span-2 lg:col-span-3">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-4">Profit/Loss Matrix (Total Group Profit)</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Baseline Final Selling Price for CVP: <span className="font-bold">{formatNumberWithCommas(calculatedValues.finalSellingPricePerPerson)} THB</span>
                        </p>
                        <div className="overflow-x-auto bg-white p-4 rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                                <thead className="bg-indigo-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Pax Size</th>
                                        {(calculatedValues.cvpMatrix && calculatedValues.cvpMatrix.length > 0 && calculatedValues.cvpMatrix[0] ? calculatedValues.cvpMatrix[0] : []).map((cell, index) => (
                                            <th key={index} className="px-4 py-3 text-right text-xs font-medium text-indigo-600 uppercase tracking-wider">
                                                {formatNumberWithCommas(cell.sellingPrice)} THB
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(calculatedValues.cvpMatrix || []).map((paxRow, index) => (
                                        <tr key={index} className={index % 2 === 0 ? undefined : 'bg-indigo-50/30'}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{[10,15,20,25,30][index]} Pax</td>
                                            {paxRow.map((cell, cellIndex) => (
                                                <td key={cellIndex} className={`px-4 py-3 whitespace-nowrap text-sm text-right ${cell.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatNumberWithCommas(cell.totalProfit)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         <div className="mt-6">
                            <Button onClick={generateCVPInsight} icon={Brain} disabled={isGeneratingInsight || isFetchingRate}>
                                {isGeneratingInsight ? "Generating AI Insight..." : "Get AI CVP Insight"}
                            </Button>
                            {cvpAiInsight && (
                                <div className={`mt-4 p-4 rounded-lg ${cvpAiInsight.startsWith("Error") ? "bg-red-100 border-red-300 text-red-700" : "bg-indigo-50 border-indigo-200 text-indigo-700"} border`}>
                                    <h4 className="font-semibold mb-2">AI Generated Insight:</h4>
                                    <p className="text-sm whitespace-pre-wrap">{cvpAiInsight}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Section>

                {/* Competitive Analysis Section */}
                <Section title="Competitive Analysis" icon={Users} isCollapsible={true} defaultOpen={false} gridCols="lg:grid-cols-1">
                    <div className="col-span-full">
                        <Button onClick={addCompetitor} icon={PlusCircle} variant="secondary" disabled={competitors.length >= 8}>
                            Add Competitor ({competitors.length}/8)
                        </Button>
                    </div>

                    {competitors.map((competitor, index) => {
                        const minPrice = parseFloat(competitor.minPrice) || 0;
                        const maxPrice = parseFloat(competitor.maxPrice) || 0;
                        const averagePrice = (minPrice > 0 || maxPrice > 0) ? (minPrice + maxPrice) / 2 : 0;

                        return (
                            <div key={competitor.id} className="col-span-full bg-slate-50 p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative mb-4">
                                <h4 className="col-span-full text-lg font-semibold text-indigo-600 mb-2">Competitor {index + 1}</h4>
                                <InputField 
                                    label="Competitor Name" 
                                    type="text" 
                                    name="name" 
                                    value={competitor.name} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'name', e.target.value)} 
                                    placeholder="e.g., Awesome Tours Inc."
                                />
                                <InputField 
                                    label="Trip Length" 
                                    type="text" 
                                    name="tripLength" 
                                    value={competitor.tripLength} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'tripLength', e.target.value)} 
                                    placeholder="e.g., 7D6N"
                                />
                                <InputField 
                                    label="Airline" 
                                    type="text" 
                                    name="airline" 
                                    value={competitor.airline} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'airline', e.target.value)} 
                                    placeholder="e.g., Various / Specific Airline"
                                />
                                 <InputField 
                                    label="Hotel Level" 
                                    type="text" 
                                    name="hotelLevel" 
                                    value={competitor.hotelLevel} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'hotelLevel', e.target.value)} 
                                    placeholder="e.g., 4-star, Boutique"
                                />
                                <InputField 
                                    label="Min Price (THB)" 
                                    type="number" 
                                    name="minPrice" 
                                    value={competitor.minPrice} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'minPrice', e.target.value)} 
                                    currency="THB"
                                />
                                <InputField 
                                    label="Max Price (THB)" 
                                    type="number" 
                                    name="maxPrice" 
                                    value={competitor.maxPrice} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'maxPrice', e.target.value)} 
                                    currency="THB"
                                />
                                <CalculatedField label="Average Price (THB)" value={averagePrice} currency="THB" />
                                <InputField 
                                    label="Total Meals" 
                                    type="text" 
                                    name="totalMeals" 
                                    value={competitor.totalMeals} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'totalMeals', e.target.value)} 
                                    placeholder="e.g., 10 / All Breakfasts"
                                />
                                <InputField 
                                    label="Commission (THB)" 
                                    type="number" 
                                    name="commission" 
                                    value={competitor.commission} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'commission', e.target.value)} 
                                    currency="THB"
                                    placeholder="Flat amount"
                                />
                                <InputField 
                                    label="Additional Tip (THB)" 
                                    type="number" 
                                    name="additionalTip" 
                                    value={competitor.additionalTip} 
                                    onChange={(e) => handleCompetitorChange(competitor.id, 'additionalTip', e.target.value)} 
                                    currency="THB"
                                />
                                <div className="col-span-full flex justify-end mt-2">
                                    <Button onClick={() => removeCompetitor(competitor.id)} icon={Trash2} variant="danger" size="sm">
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Side-by-Side Comparison Table */}
                    { (competitors.length > 0 || formData.programName) && ( 
                        <div className="col-span-full mt-8">
                            <h3 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center">
                                <Columns className="mr-2 h-5 w-5 text-indigo-500" />
                                Side-by-Side Comparison
                            </h3>
                            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow">
                                <table className="min-w-full divide-y divide-gray-200 border">
                                    <thead className="bg-indigo-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Feature</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-indigo-600 uppercase tracking-wider">Our Product</th>
                                            {competitors.map((comp, index) => (
                                                <th key={comp.id} className="px-4 py-3 text-center text-xs font-medium text-indigo-600 uppercase tracking-wider truncate max-w-xs">
                                                    {comp.name || `Competitor ${index + 1}`}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {[
                                            // Name row removed as requested
                                            { label: "Trip Length", ourValue: `${formData.numberOfDays}D${formData.numberOfNights}N`, compField: "tripLength" },
                                            { label: "Airline", ourValue: formData.airline || "N/A", compField: "airline" },
                                            { label: "Avg. Price (THB)", ourValue: formatNumberWithCommas(calculatedValues.finalSellingPricePerPerson), compField: "avgPrice", isNumeric: true },
                                            { label: "Total Meals", ourValue: formData.ourProduct_totalMeals || "N/A", compField: "totalMeals" },
                                            { label: "Commission (THB)", ourValue: formatNumberWithCommas(calculatedValues.sumCommissions), compField: "commission", isNumeric: true },
                                            { label: "Tip (THB)", ourValue: formatNumberWithCommas(formData.selling_tip_thb), compField: "additionalTip", isNumeric: true },
                                        ].map(row => (
                                            <tr key={row.label}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">{row.label}</td>
                                                <td className={`px-4 py-3 whitespace-nowrap text-sm text-center ${row.isNumeric ? 'text-blue-600 font-semibold' : 'text-gray-900'}`}>{row.ourValue}</td>
                                                {competitors.map(comp => {
                                                    let val = comp[row.compField] || "N/A";
                                                    if (row.compField === "avgPrice") {
                                                        const min = parseFloat(comp.minPrice) || 0;
                                                        const max = parseFloat(comp.maxPrice) || 0;
                                                        val = (min > 0 || max > 0) ? formatNumberWithCommas((min+max)/2) : "N/A";
                                                    } else if (row.isNumeric) {
                                                        val = formatNumberWithCommas(parseFloat(comp[row.compField]) || 0);
                                                    }
                                                    return <td key={`${comp.id}-${row.label}`} className={`px-4 py-3 whitespace-nowrap text-sm text-center ${row.isNumeric ? '' : 'text-gray-800'}`}>{val}</td>;
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </Section>


            </main>

            <footer className="mt-12 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Tour Costing App. All calculations are estimates.</p>
                 <p>Exchange Rate API provided by <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ExchangeRate-API.com</a></p>
            </footer>
        </div>
    );
}

export default App;

