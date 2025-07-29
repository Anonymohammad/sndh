// Code.gs - Enhanced Restaurant Management System with Date Selection & PIN Protection

// Database structure definition
const REQUIRED_SHEETS = {
  // Core Ingredient Management
  Ingredients: {
    requiredHeaders: [
      'id', 'name', 'category', 'unit', 'cost_per_unit', 'quantity', 'min_stock', 'max_stock',
      'supplier_id', 'last_purchase_date', 'storage_location', 'created_at', 'updated_at'
    ]
  },
  
  // Menu Products
  Products: {
    requiredHeaders: [
      'id', 'name', 'category', 'description', 'selling_price', 'cost_price',
      'active', 'created_at', 'updated_at'
    ]
  },
  
  // Recipe Management
  Recipes: {
    requiredHeaders: [
      'id', 'product_id', 'ingredient_id', 'quantity_needed', 'unit',
      'created_at', 'updated_at'
    ]
  },
  
  // Order Management
  Orders: {
    requiredHeaders: [
      'id', 'order_number', 'order_date', 'order_time', 'customer_name', 
      'order_type', 'status', 'total_amount', 'payment_method',
      'employee_id', 'created_at', 'updated_at'
    ]
  },
  
  OrderItems: {
    requiredHeaders: [
      'id', 'order_id', 'product_id', 'quantity', 'unit_price', 'total_price',
      'created_at', 'updated_at'
    ]
  },
  
  // Updated Daily Tracking Tables
  DailyShawarmaStack: {
    requiredHeaders: [
      'id', 'date', 'starting_weight_kg', 'stack_cost_qar', 'shaving_weight_kg', 
      'staff_meals_weight_kg', 'orders_weight_kg', 'remaining_weight_kg', 
      'loss_weight_kg', 'loss_percentage', 'revenue_qar', 'profit_per_kg',
      'employee_id', 'created_at', 'updated_at'
    ]
  },
  
  DailyRawProteins: {
    requiredHeaders: [
      'id', 'count_date', 'frozen_chicken_breast_remaining', 'frozen_chicken_breast_received',
      'chicken_shawarma_remaining', 'chicken_shawarma_received', 'steak_remaining', 'steak_received',
      'employee_id', 'created_at', 'updated_at'
    ]
  },
  
  DailyMarinatedProteins: {
    requiredHeaders: [
      'id', 'count_date', 'fahita_chicken_remaining', 'fahita_chicken_received',
      'chicken_sub_remaining', 'chicken_sub_received', 'spicy_strips_remaining', 'spicy_strips_received',
      'original_strips_remaining', 'original_strips_received', 'employee_id', 'created_at', 'updated_at'
    ]
  },
  
  DailyBreadTracking: {
    requiredHeaders: [
      'id', 'count_date', 'saj_bread_remaining', 'saj_bread_received',
      'pita_bread_remaining', 'pita_bread_received', 'bread_rolls_remaining', 'bread_rolls_received',
      'employee_id', 'created_at', 'updated_at'
    ]
  },
  
  DailyHighCostItems: {
    requiredHeaders: [
      'id', 'count_date', 'cream_remaining', 'cream_received',
      'mayo_remaining', 'mayo_received', 'employee_id', 'created_at', 'updated_at'
    ]
  },
  
  DailySales: {
    requiredHeaders: [
      'id', 'sales_date', 'total_revenue', 'shawarma_revenue', 'total_food_cost', 
      'food_cost_percentage', 'total_orders', 'employee_id', 'created_at', 'updated_at'
    ]
  },
  
  // Legacy tables (keeping for compatibility)
  DailyInventoryCount: {
    requiredHeaders: [
      'id', 'count_date', 'ingredient_id', 'ingredient_name', 'opening_quantity', 'received_quantity',
      'closing_quantity', 'calculated_usage', 'waste_quantity', 'notes',
      'employee_id', 'created_at', 'updated_at'
    ]
  },
  
  DailyProductSales: {
    requiredHeaders: [
      'id', 'sales_date', 'product_name', 'quantity_sold', 'unit_price', 'total_revenue',
      'unit_cost', 'total_cost', 'profit_margin', 'created_at', 'updated_at'
    ]
  },
  
  // Employee Management
  Employees: {
    requiredHeaders: [
      'id', 'name', 'email', 'pin_hash', 'phone', 'role', 'hourly_rate', 'hire_date',
      'active', 'created_at', 'updated_at'
    ]
  },
  
  // Supplier Management
  Suppliers: {
    requiredHeaders: [
      'id', 'name', 'contact_person', 'phone', 'email', 'address',
      'payment_terms', 'active', 'created_at', 'updated_at'
    ]
  },
  
  // NEW: System Settings for PIN and configuration
  SystemSettings: {
    requiredHeaders: [
      'id', 'setting_name', 'setting_value', 'description', 'created_at', 'updated_at'
    ]
  }
};

// Entry point for web app
function doGet(e) {
  const userEmail = Session.getEffectiveUser().getEmail();

  // Initialize database on first access
  initializeDatabase();

  const cache = CacheService.getUserCache();
  const role = cache.get('userRole');

  var fileToServe;
  if (!role) {
    fileToServe = 'Login';
  } else if (role === 'employee') {
    fileToServe = 'EmployeeApp';
  } else {
    fileToServe = 'index';
  }

  return HtmlService.createTemplateFromFile(fileToServe)
    .evaluate()
    .setTitle('Restaurant Management System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Include HTML files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Initialize database structure
function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let isNewDatabase = false;
  
  // Create all required sheets
  Object.entries(REQUIRED_SHEETS).forEach(([sheetName, config]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      isNewDatabase = true;
      
      // Add headers
      sheet.getRange(1, 1, 1, config.requiredHeaders.length)
           .setValues([config.requiredHeaders])
           .setBackground('#E6E6E6')
           .setFontWeight('bold');
      sheet.setFrozenRows(1);
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, config.requiredHeaders.length);
    }
  });
  
  // Initialize default data if new database
  if (isNewDatabase) {
    initializeDefaultData();
  }
  
  return isNewDatabase;
}

// Initialize default restaurant data
function initializeDefaultData() {
  initializeIngredients();
  initializeProducts();
  initializeEmployees();
  initializeSuppliers();
  initializeSystemSettings(); // NEW: Initialize system settings
}

// Initialize ingredients from your Excel data
function initializeIngredients() {
  const ingredients = [
    {name: 'chicken shawarma', category: 'Proteins', unit: 'kg', cost_per_unit: 12.353, min_stock: 5, max_stock: 15},
    {name: 'chicken breast', category: 'Proteins', unit: 'kg', cost_per_unit: 15.294, min_stock: 3, max_stock: 10},
    {name: 'Steak', category: 'Proteins', unit: 'kg', cost_per_unit: 38.0, min_stock: 2, max_stock: 6},
    {name: 'Turkey', category: 'Proteins', unit: 'kg', cost_per_unit: 22.5, min_stock: 1, max_stock: 3},
    {name: 'lebanese bread', category: 'Breads', unit: 'pcs', cost_per_unit: 0.1, min_stock: 50, max_stock: 200},
    {name: 'saj bread', category: 'Breads', unit: 'pcs', cost_per_unit: 0.9, min_stock: 20, max_stock: 80},
    {name: 'bread roll', category: 'Breads', unit: 'pcs', cost_per_unit: 0.5, min_stock: 30, max_stock: 100},
    {name: 'Garlic sauce', category: 'Sauces', unit: 'kg', cost_per_unit: 3.874, min_stock: 2, max_stock: 5},
    {name: 'Sauce', category: 'Sauces', unit: 'kg', cost_per_unit: 12.29, min_stock: 1, max_stock: 3},
    {name: 'mayo', category: 'Sauces', unit: 'kg', cost_per_unit: 17.526, min_stock: 1, max_stock: 3},
    {name: 'cream', category: 'Dairy', unit: 'kg', cost_per_unit: 20.0, min_stock: 1, max_stock: 3},
    {name: 'mozzarella', category: 'Dairy', unit: 'kg', cost_per_unit: 5.978, min_stock: 2, max_stock: 6},
    {name: 'cheddar', category: 'Dairy', unit: 'kg', cost_per_unit: 4.375, min_stock: 2, max_stock: 6},
    {name: 'fries exp', category: 'Frozen', unit: 'kg', cost_per_unit: 8.5, min_stock: 5, max_stock: 20},
    {name: 'fries reg', category: 'Frozen', unit: 'kg', cost_per_unit: 5.5, min_stock: 5, max_stock: 20},
    {name: 'coleslaw', category: 'Vegetables', unit: 'kg', cost_per_unit: 6.115, min_stock: 2, max_stock: 6},
    {name: 'lettuce', category: 'Vegetables', unit: 'kg', cost_per_unit: 2.5, min_stock: 3, max_stock: 8},
    {name: 'corn', category: 'Vegetables', unit: 'kg', cost_per_unit: 6.373, min_stock: 2, max_stock: 6},
    {name: 'pickles', category: 'Vegetables', unit: 'kg', cost_per_unit: 6.0, min_stock: 2, max_stock: 6},
    {name: 'peppers', category: 'Vegetables', unit: 'kg', cost_per_unit: 5.5, min_stock: 2, max_stock: 6},
    {name: 'onion', category: 'Vegetables', unit: 'kg', cost_per_unit: 1.75, min_stock: 3, max_stock: 10},
    {name: 'mushroom', category: 'Vegetables', unit: 'kg', cost_per_unit: 4.988, min_stock: 2, max_stock: 6}
  ];
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ingredients');
  
  ingredients.forEach(ing => {
    const id = Utilities.getUuid();
    const row = [
      id, ing.name, ing.category, ing.unit, ing.cost_per_unit, 0, ing.min_stock, ing.max_stock,
      '', '', '', new Date(), new Date()
    ];
    sheet.appendRow(row);
  });
}

// Initialize products with your current pricing
function initializeProducts() {
  const products = [
    {name: 'Shawarma Reg', category: 'Shawarma', selling_price: 12, cost_price: 2.52},
    {name: 'Shawarma Arabi', category: 'Shawarma', selling_price: 19, cost_price: 4.41},
    {name: 'Shawarma Slices', category: 'Shawarma', selling_price: 23, cost_price: 4.09},
    {name: 'Shawarma Double', category: 'Shawarma', selling_price: 31, cost_price: 6.55},
    {name: 'Fahita Sandwich', category: 'Snack', selling_price: 11, cost_price: 2.13},
    {name: 'Chicken sub sandwich', category: 'Snack', selling_price: 12, cost_price: 2.54},
    {name: 'Crispy sandwich', category: 'Snack', selling_price: 13, cost_price: 2.59},
    {name: 'Chicken cream Sandwich', category: 'Snack', selling_price: 13, cost_price: 2.88},
    {name: 'Steak sandwich', category: 'Snack', selling_price: 14, cost_price: 3.14},
    {name: 'Steak cream sandwich', category: 'Snack', selling_price: 15, cost_price: 3.48},
    {name: 'Chicken Strips 3 pcs', category: 'Chicken Strips', selling_price: 19, cost_price: 4.23},
    {name: 'Chicken Strips 5 pcs', category: 'Chicken Strips', selling_price: 24, cost_price: 5.91}
  ];
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  
  products.forEach(prod => {
    const id = Utilities.getUuid();
    const row = [
      id, prod.name, prod.category, '', prod.selling_price, prod.cost_price,
      true, new Date(), new Date()
    ];
    sheet.appendRow(row);
  });
}

// Initialize default employees
function initializeEmployees() {
  const employees = [
    {name: 'Admin User', email: Session.getEffectiveUser().getEmail(), role: 'admin', hourly_rate: 0, pin: '1111'},
    {name: 'Manager', email: 'manager@restaurant.com', role: 'manager', hourly_rate: 25, pin: '2222'},
    {name: 'Staff Member', email: 'staff@restaurant.com', role: 'employee', hourly_rate: 15, pin: '3333'}
  ];
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employees');
  
  employees.forEach(emp => {
    const id = Utilities.getUuid();
    const row = [
      id,
      emp.name,
      emp.email,
      hashPin(emp.pin),
      '',
      emp.role,
      emp.hourly_rate,
      new Date(),
      true,
      new Date(),
      new Date()
    ];
    sheet.appendRow(row);
  });
}

// Initialize default suppliers
function initializeSuppliers() {
  const suppliers = [
    {name: 'Main Food Supplier', contact_person: 'Contact Name', phone: '+974-XXXX-XXXX'},
    {name: 'Bread Supplier', contact_person: 'Baker Contact', phone: '+974-YYYY-YYYY'},
    {name: 'Packaging Supplier', contact_person: 'Package Contact', phone: '+974-ZZZZ-ZZZZ'}
  ];
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Suppliers');
  
  suppliers.forEach(sup => {
    const id = Utilities.getUuid();
    const row = [
      id, sup.name, sup.contact_person, sup.phone, '', '',
      'Net 30', true, new Date(), new Date()
    ];
    sheet.appendRow(row);
  });
}

// NEW: Initialize system settings
function initializeSystemSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SystemSettings');
  
  const settings = [
    {
      setting_name: 'management_pin',
      setting_value: '1234', // Default PIN - change this!
      description: 'PIN required for updating existing daily entries'
    },
    {
      setting_name: 'allow_past_entries',
      setting_value: 'true',
      description: 'Allow creating entries for past dates'
    },
    {
      setting_name: 'max_days_back',
      setting_value: '30',
      description: 'Maximum days back allowed for entries'
    }
  ];
  
  settings.forEach(setting => {
    const id = Utilities.getUuid();
    const row = [
      id, setting.setting_name, setting.setting_value, setting.description,
      new Date(), new Date()
    ];
    sheet.appendRow(row);
  });
}

// Get all data for frontend with new structure
function getData() {
  try {
    const data = {
      ingredients: getSheetData('Ingredients'),
      products: getSheetData('Products'),
      recipes: getSheetData('Recipes'),
      orders: getSheetData('Orders'),
      orderItems: getSheetData('OrderItems'),
      employees: getSheetData('Employees'),
      suppliers: getSheetData('Suppliers'),
      dailyShawarmaStack: getSheetData('DailyShawarmaStack'),
      dailySales: getSheetData('DailySales'),
      dailyRawProteins: getSheetData('DailyRawProteins'),
      dailyMarinatedProteins: getSheetData('DailyMarinatedProteins'),
      dailyBreadTracking: getSheetData('DailyBreadTracking'),
      dailyHighCostItems: getSheetData('DailyHighCostItems'),
      dailyInventoryCount: getSheetData('DailyInventoryCount'),
      dailyProductSales: getSheetData('DailyProductSales')
    };
    
    return JSON.stringify(data);
  } catch (error) {
    Logger.log('Error getting data: ' + error.toString());
    throw new Error('Failed to retrieve data: ' + error.message);
  }
}

// Helper function to get sheet data
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  return data.slice(1).map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    return item;
  });
}

// NEW: System Settings Helper Functions
function getSystemSetting(settingName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SystemSettings');
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const nameIndex = headers.indexOf('setting_name');
    const valueIndex = headers.indexOf('setting_value');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][nameIndex] === settingName) {
        return data[i][valueIndex];
      }
    }
    return null;
  } catch (error) {
    Logger.log('Error getting system setting: ' + error.toString());
    return null;
  }
}

// NEW: Get management PIN
function getManagementPin() {
  const pin = getSystemSetting('management_pin');
  return pin || '1234'; // Fallback default PIN
}

// NEW: Validate management PIN
// Add this function to your Code.gs if it's missing
function validateManagementPin(inputPin) {
  try {
    console.log('PIN validation - Input:', inputPin);
    const correctPin = getManagementPin();
    console.log('PIN validation - Correct:', correctPin);
    
    const isValid = String(inputPin).trim() === String(correctPin).trim();
    console.log('PIN validation - Result:', isValid);
    
    return isValid;
  } catch (error) {
    console.log('PIN validation error:', error);
    return false;
  }
}

// Hash a PIN using SHA-256 and return Base64 string
function hashPin(pin) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(pin));
  return Utilities.base64Encode(digest);
}

// Authenticate employee credentials and cache role on success
function authenticateUser(email, pin) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  if (!sheet) return {success: false};

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var emailIdx = headers.indexOf('email');
  var pinIdx = headers.indexOf('pin_hash');
  var roleIdx = headers.indexOf('role');

  var hashed = hashPin(pin);

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailIdx] == email && data[i][pinIdx] == hashed) {
      var role = data[i][roleIdx];
      CacheService.getUserCache().put('userRole', role, 21600);
      return {success: true, role: role};
    }
  }
  return {success: false};
}

// Clear cached role for sign out
function logoutUser() {
  CacheService.getUserCache().remove('userRole');
  return {success: true};
}

// NEW: Check if entry exists for given date
function checkExistingEntry(dateString) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const targetDate = new Date(dateString).toDateString();
    
    // Check in DailyShawarmaStack sheet
    const shawarmaData = getSheetData('DailyShawarmaStack');
    
    const existingEntry = shawarmaData.find(row => {
      if (!row.date) return false;
      return new Date(row.date).toDateString() === targetDate;
    });
    
    if (existingEntry) {
      return JSON.stringify({
        exists: true,
        entry: existingEntry,
        entryDate: targetDate
      });
    }
    
    return JSON.stringify({
      exists: false,
      entryDate: targetDate
    });
    
  } catch (error) {
    Logger.log('Error checking existing entry: ' + error.toString());
    throw new Error('Failed to check existing entry: ' + error.message);
  }
}

// NEW: Delete existing entries for a specific date
function deleteExistingEntries(dateString) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const targetDate = new Date(dateString).toDateString();
    
    // List of sheets to clean up
    const sheetsToClean = [
      'DailyShawarmaStack',
      'DailyRawProteins', 
      'DailyMarinatedProteins',
      'DailyBreadTracking',
      'DailyHighCostItems',
      'DailySales'
    ];
    
    sheetsToClean.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const dateFieldName = sheetName === 'DailyShawarmaStack' ? 'date' : 
                           sheetName === 'DailySales' ? 'sales_date' : 'count_date';
      const dateIndex = headers.indexOf(dateFieldName);
      
      if (dateIndex === -1) return;
      
      // Find rows to delete (from bottom to top to maintain row indices)
      const rowsToDelete = [];
      for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][dateIndex] && new Date(data[i][dateIndex]).toDateString() === targetDate) {
          rowsToDelete.push(i + 1); // +1 because sheet rows are 1-indexed
        }
      }
      
      // Delete rows
      rowsToDelete.forEach(rowIndex => {
        sheet.deleteRow(rowIndex);
      });
    });
    
  } catch (error) {
    Logger.log('Error deleting existing entries: ' + error.toString());
    throw new Error('Failed to delete existing entries: ' + error.message);
  }
}

// ENHANCED: Save daily entry data with PIN validation and update support
function saveDailyEntry(entryData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const entryDate = entryData.date ? new Date(entryData.date).toDateString() : new Date().toDateString();
    const userEmail = Session.getEffectiveUser().getEmail();
    
    // Check if this is an update
    if (entryData.isUpdate) {
      // Validate management PIN
      if (!entryData.managementPin || !validateManagementPin(entryData.managementPin)) {
        return JSON.stringify({
          success: false,
          message: 'Invalid management PIN. Update not authorized.'
        });
      }
      
      // Delete existing entries for this date before creating new ones
      deleteExistingEntries(entryDate);
    }
    
    // Save Shawarma Stack Data (using ORIGINAL field names: loss_weight_kg, loss_percentage)
    if (entryData.shawarmaStack) {
      const shawarmaSheet = ss.getSheetByName('DailyShawarmaStack');
      const stackData = entryData.shawarmaStack;
      
      // Get all weights
      const startingWeight = parseFloat(stackData.starting_weight) || 0;
      const shavingWeight = parseFloat(stackData.shaving_weight) || 0;
      const staffMealsWeight = parseFloat(stackData.staff_meals_weight) || 0;
      const ordersWeight = parseFloat(stackData.orders_weight) || 0;
      const remainingWeight = parseFloat(stackData.remaining_weight) || 0;
      const stackCost = parseFloat(stackData.stack_cost) || 0;
      const revenue = parseFloat(stackData.revenue) || 0;
      
      // Calculate loss (using ORIGINAL field names: loss_weight_kg, loss_percentage)
      const lossWeight = startingWeight - (shavingWeight + staffMealsWeight + ordersWeight + remainingWeight);
      const lossPercentage = startingWeight > 0 ? (lossWeight / startingWeight) * 100 : 0;
      
      // Calculate profitability
      const revenuePerKg = ordersWeight > 0 ? revenue / ordersWeight : 0;
      const costPerKg = startingWeight > 0 ? stackCost / startingWeight : 0;
      const profitPerKg = revenuePerKg - costPerKg;
      
      const row = [
        Utilities.getUuid(), entryDate, startingWeight, stackCost, shavingWeight,
        staffMealsWeight, ordersWeight, remainingWeight, lossWeight, lossPercentage,
        revenue, profitPerKg, userEmail, new Date(), new Date()
      ];
      
      shawarmaSheet.appendRow(row);
    }
    
    // Save Raw Proteins Data
    if (entryData.inventory && Object.keys(entryData.inventory).length > 0) {
      const rawProteinsSheet = ss.getSheetByName('DailyRawProteins');

      const row = [
        Utilities.getUuid(), entryDate,
        parseFloat(entryData.inventory.chicken_breast_remaining) || 0,
        parseFloat(entryData.inventory.chicken_breast_received) || 0,
        parseFloat(entryData.inventory.chicken_shawarma_remaining) || 0,
        parseFloat(entryData.inventory.chicken_shawarma_received) || 0,
        parseFloat(entryData.inventory.steak_remaining) || 0,
        parseFloat(entryData.inventory.steak_received) || 0,
        userEmail, new Date(), new Date()
      ];

      rawProteinsSheet.appendRow(row);

      // Save Marinated Proteins Data
      const marinatedSheet = ss.getSheetByName('DailyMarinatedProteins');

      const marinatedRow = [
        Utilities.getUuid(), entryDate,
        parseFloat(entryData.inventory.fahita_chicken_remaining) || 0,
        parseFloat(entryData.inventory.fahita_chicken_received) || 0,
        parseFloat(entryData.inventory.chicken_sub_remaining) || 0,
        parseFloat(entryData.inventory.chicken_sub_received) || 0,
        parseFloat(entryData.inventory.spicy_strips_remaining) || 0,
        parseFloat(entryData.inventory.spicy_strips_received) || 0,
        parseFloat(entryData.inventory.original_strips_remaining) || 0,
        parseFloat(entryData.inventory.original_strips_received) || 0,
        userEmail, new Date(), new Date()
      ];

      marinatedSheet.appendRow(marinatedRow);
      
      // Save Bread Tracking Data
      const breadSheet = ss.getSheetByName('DailyBreadTracking');
      
      const breadRow = [
        Utilities.getUuid(), entryDate,
        parseInt(entryData.inventory.saj_bread_remaining) || 0,
        parseInt(entryData.inventory.saj_bread_received) || 0,
        parseInt(entryData.inventory.pita_bread_remaining) || 0,
        parseInt(entryData.inventory.pita_bread_received) || 0,
        parseInt(entryData.inventory.bread_roll_remaining) || 0,
        parseInt(entryData.inventory.bread_roll_received) || 0,
        userEmail, new Date(), new Date()
      ];
      
      breadSheet.appendRow(breadRow);
      
      // Save High-Cost Items Data
      const highCostSheet = ss.getSheetByName('DailyHighCostItems');
      
      const highCostRow = [
        Utilities.getUuid(), entryDate,
        parseFloat(entryData.inventory.cream_remaining) || 0,
        parseFloat(entryData.inventory.cream_received) || 0,
        parseFloat(entryData.inventory.mayo_remaining) || 0,
        parseFloat(entryData.inventory.mayo_received) || 0,
        userEmail, new Date(), new Date()
      ];
      
      highCostSheet.appendRow(highCostRow);
    }
    
    // Save Sales Data
    if (entryData.sales) {
      const salesSheet = ss.getSheetByName('DailySales');
      const salesData = entryData.sales;
      
      const totalRevenue = parseFloat(salesData.total_revenue) || 0;
      const shawarmaRevenue = parseFloat(salesData.shawarma_revenue) || 0;
      const totalOrders = parseInt(salesData.total_orders) || 0;
      
      // Calculate estimated food cost based on sales quantities
      const costs = {
        'shawarma_reg': 2.52, 'shawarma_arabi': 4.41, 'shawarma_slices': 4.09, 'shawarma_double': 6.55,
        'fahita_sandwich': 2.13, 'chicken_sub': 2.54, 'crispy_sandwich': 2.59,
        'chicken_cream': 2.88, 'steak_sandwich': 3.14, 'steak_cream': 3.48,
        'chicken_strips_3': 4.23, 'chicken_strips_5': 5.91
      };
      
      let calculatedFoodCost = 0;
      Object.entries(salesData).forEach(([product, quantity]) => {
        const qty = parseInt(quantity) || 0;
        if (costs[product] && qty > 0) {
          calculatedFoodCost += costs[product] * qty;
        }
      });
      
      const foodCostPercentage = totalRevenue > 0 ? (calculatedFoodCost / totalRevenue) * 100 : 0;
      
      const row = [
        Utilities.getUuid(), entryDate, totalRevenue, shawarmaRevenue, calculatedFoodCost,
        foodCostPercentage, totalOrders, userEmail, new Date(), new Date()
      ];
      
      salesSheet.appendRow(row);
      
      // Save individual product sales
      saveProductSales(salesData, entryDate);
    }
    
    const successMessage = entryData.isUpdate ? 
      `Daily entry for ${entryDate} updated successfully!` : 
      `Daily entry for ${entryDate} saved successfully!`;
    
    return JSON.stringify({success: true, message: successMessage});
    
  } catch (error) {
    Logger.log('Error saving daily entry: ' + error.toString());
    throw new Error('Failed to save daily entry: ' + error.message);
  }
}

// Save individual product sales
function saveProductSales(salesData, date) {
  const productSalesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DailyProductSales');
  
  // Product mapping with costs and prices
  const productInfo = {
    'shawarma_reg': {name: 'Shawarma Reg', price: 12, cost: 2.52},
    'shawarma_arabi': {name: 'Shawarma Arabi', price: 19, cost: 4.41},
    'shawarma_slices': {name: 'Shawarma Slices', price: 23, cost: 4.09},
    'shawarma_double': {name: 'Shawarma Double', price: 31, cost: 6.55},
    'fahita_sandwich': {name: 'Fahita Sandwich', price: 11, cost: 2.13},
    'chicken_sub': {name: 'Chicken sub sandwich', price: 12, cost: 2.54},
    'crispy_sandwich': {name: 'Crispy sandwich', price: 13, cost: 2.59},
    'chicken_cream': {name: 'Chicken cream Sandwich', price: 13, cost: 2.88},
    'steak_sandwich': {name: 'Steak sandwich', price: 14, cost: 3.14},
    'steak_cream': {name: 'Steak cream sandwich', price: 15, cost: 3.48},
    'chicken_strips_3': {name: 'Chicken Strips 3 pcs', price: 19, cost: 4.23},
    'chicken_strips_5': {name: 'Chicken Strips 5 pcs', price: 24, cost: 5.91}
  };
  
  Object.entries(salesData).forEach(([key, quantity]) => {
    if (productInfo[key] && quantity && parseInt(quantity) > 0) {
      const product = productInfo[key];
      const qty = parseInt(quantity);
      const totalRevenue = qty * product.price;
      const totalCost = qty * product.cost;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
      
      const row = [
        Utilities.getUuid(), date, product.name, qty, product.price, totalRevenue,
        product.cost, totalCost, profitMargin, new Date(), new Date()
      ];
      
      productSalesSheet.appendRow(row);
    }
  });
}

// ENHANCED: Generate management reports with better date filtering
// FIXED: Replace the generateDailyReport function in your Code.gs

// FIXED: Replace generateDailyReport function in Code.gs with proper date handling

// Helper to robustly parse a date string in either ISO (yyyy-mm-dd) or native formats
function parseInputDate(date) {
  if (typeof date !== 'string') {
    return new Date(date);
  }

  // ISO format (e.g. 2024-07-26)
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(date + 'T12:00:00');
  }

  // Fallback to default Date parsing
  return new Date(date);
}

function generateDailyReport(date) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let targetDateString;
    if (date) {
      const targetDate = parseInputDate(date);
      targetDateString = targetDate.toDateString();
    } else {
      targetDateString = new Date().toDateString();
    }
    
    console.log("=== FIXED DATE COMPARISON ===");
    console.log("Input date:", date);
    console.log("Target date string:", targetDateString);
    
    // Get all relevant data
    const shawarmaData = getSheetData('DailyShawarmaStack');
    const salesData = getSheetData('DailySales');
    const rawProteinsData = getSheetData('DailyRawProteins');
    const marinatedProteinsData = getSheetData('DailyMarinatedProteins');
    const breadData = getSheetData('DailyBreadTracking');
    const highCostData = getSheetData('DailyHighCostItems');
    
    // FIXED DATE FILTERING - Handle timezone properly
    const todayShawarma = shawarmaData.find(row => {
      if (!row.date) return false;
      const rowDate = new Date(row.date);
      const rowDateString = rowDate.toDateString();
      console.log("Comparing shawarma:", rowDateString, "vs", targetDateString);
      return rowDateString === targetDateString;
    });
    
    const todaySales = salesData.find(row => {
      if (!row.sales_date) return false;
      const rowDate = new Date(row.sales_date);
      const rowDateString = rowDate.toDateString();
      console.log("Comparing sales:", rowDateString, "vs", targetDateString);
      return rowDateString === targetDateString;
    });
    
    const todayRawProteins = rawProteinsData.find(row => {
      if (!row.count_date) return false;
      const rowDate = new Date(row.count_date);
      const rowDateString = rowDate.toDateString();
      return rowDateString === targetDateString;
    });
    
    const todayMarinatedProteins = marinatedProteinsData.find(row => {
      if (!row.count_date) return false;
      const rowDate = new Date(row.count_date);
      const rowDateString = rowDate.toDateString();
      return rowDateString === targetDateString;
    });
    
    const todayBread = breadData.find(row => {
      if (!row.count_date) return false;
      const rowDate = new Date(row.count_date);
      const rowDateString = rowDate.toDateString();
      return rowDateString === targetDateString;
    });
    
    const todayHighCost = highCostData.find(row => {
      if (!row.count_date) return false;
      const rowDate = new Date(row.count_date);
      const rowDateString = rowDate.toDateString();
      return rowDateString === targetDateString;
    });

    // Build consolidated inventory object
    const inventory = {};
    if (todayRawProteins) {
      inventory.frozen_chicken_breast_remaining = todayRawProteins.frozen_chicken_breast_remaining;
      inventory.frozen_chicken_breast_received  = todayRawProteins.frozen_chicken_breast_received;
      inventory.chicken_shawarma_remaining      = todayRawProteins.chicken_shawarma_remaining;
      inventory.chicken_shawarma_received       = todayRawProteins.chicken_shawarma_received;
      inventory.steak_remaining                 = todayRawProteins.steak_remaining;
      inventory.steak_received                  = todayRawProteins.steak_received;
    }
    if (todayMarinatedProteins) {
      inventory.fahita_chicken_remaining = todayMarinatedProteins.fahita_chicken_remaining;
      inventory.fahita_chicken_received  = todayMarinatedProteins.fahita_chicken_received;
      inventory.chicken_sub_remaining    = todayMarinatedProteins.chicken_sub_remaining;
      inventory.chicken_sub_received     = todayMarinatedProteins.chicken_sub_received;
      inventory.spicy_strips_remaining   = todayMarinatedProteins.spicy_strips_remaining;
      inventory.spicy_strips_received    = todayMarinatedProteins.spicy_strips_received;
      inventory.original_strips_remaining= todayMarinatedProteins.original_strips_remaining;
      inventory.original_strips_received = todayMarinatedProteins.original_strips_received;
    }
    if (todayBread) {
      inventory.saj_bread_remaining   = todayBread.saj_bread_remaining;
      inventory.saj_bread_received    = todayBread.saj_bread_received;
      inventory.pita_bread_remaining  = todayBread.pita_bread_remaining;
      inventory.pita_bread_received   = todayBread.pita_bread_received;
      inventory.bread_roll_remaining  = todayBread.bread_rolls_remaining || todayBread.bread_roll_remaining;
      inventory.bread_roll_received   = todayBread.bread_rolls_received  || todayBread.bread_roll_received;
    }
    if (todayHighCost) {
      inventory.cream_remaining = todayHighCost.cream_remaining;
      inventory.cream_received  = todayHighCost.cream_received;
      inventory.mayo_remaining  = todayHighCost.mayo_remaining;
      inventory.mayo_received   = todayHighCost.mayo_received;
    }
    
    console.log("RESULTS:");
    console.log("Found shawarma:", !!todayShawarma);
    console.log("Found sales:", !!todaySales);
    console.log("Found raw proteins:", !!todayRawProteins);
    console.log("Found bread:", !!todayBread);
    
    // Build response
    const report = {
      requested_date: date ? (typeof date === 'string' ? date : Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd')) : '',
      date: targetDateString,
      data_found: {
        shawarma: !!todayShawarma,
        sales: !!todaySales,
        rawProteins: !!todayRawProteins,
        bread: !!todayBread
      },
      shawarma: todayShawarma || null,
      sales: todaySales || null,
      rawProteins: todayRawProteins || null,
      marinatedProteins: todayMarinatedProteins || null,
      bread: todayBread || null,
      highCostItems: todayHighCost || null,
      inventory: Object.keys(inventory).length ? inventory : null,
      notes: '',
      alerts: []
    };
    
    console.log("Final report data_found:", report.data_found);
    console.log("=== END FIXED DATE COMPARISON ===");
    
    return JSON.stringify(report);
    
  } catch (error) {
    console.log('Error generating daily report:', error.toString());
    throw new Error('Failed to generate report: ' + error.message);
  }
}

// ADD THIS DEBUG FUNCTION TO YOUR Code.gs

function debugDataForDate(dateString) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const targetDate = dateString || new Date().toDateString();
    
    console.log("=== DEBUG DATA FOR DATE ===");
    console.log("Looking for date:", targetDate);
    
    // Check each sheet
    const sheets = ['DailyShawarmaStack', 'DailySales', 'DailyRawProteins', 'DailyBreadTracking'];
    const results = {};
    
    sheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        results[sheetName] = 'Sheet does not exist';
        return;
      }
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      results[sheetName] = {
        headers: headers,
        totalRows: data.length - 1,
        allDates: []
      };
      
      // Find date column
      const dateField = sheetName === 'DailyShawarmaStack' ? 'date' : 
                       sheetName === 'DailySales' ? 'sales_date' : 'count_date';
      const dateIndex = headers.indexOf(dateField);
      
      if (dateIndex === -1) {
        results[sheetName].error = 'Date field not found: ' + dateField;
        return;
      }
      
      // Get all dates and check for matches
      for (let i = 1; i < data.length; i++) {
        if (data[i][dateIndex]) {
          const rowDateString = new Date(data[i][dateIndex]).toDateString();
          results[sheetName].allDates.push({
            row: i,
            originalValue: data[i][dateIndex],
            convertedDate: rowDateString,
            matches: rowDateString === targetDate
          });
        }
      }
      
      const matchingRows = results[sheetName].allDates.filter(d => d.matches);
      results[sheetName].matchingRows = matchingRows.length;
      results[sheetName].matchingData = matchingRows;
    });
    
    console.log("Debug results:", results);
    return JSON.stringify(results, null, 2);
    
  } catch (error) {
    console.log("Debug error:", error.toString());
    return JSON.stringify({error: error.message});
  }
}

// SIMPLE TEST FUNCTION
function testDataExists() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shawarmaSheet = ss.getSheetByName('DailyShawarmaStack');
  
  if (!shawarmaSheet) {
    return "DailyShawarmaStack sheet does not exist";
  }
  
  const data = shawarmaSheet.getDataRange().getValues();
  const result = {
    sheetExists: true,
    totalRows: data.length - 1,
    headers: data[0],
    lastFewRows: data.slice(-3) // Last 3 rows
  };
  
  return JSON.stringify(result, null, 2);
}

// Generate management alerts using ORIGINAL field names
function generateAlerts(shawarmaData, salesData) {
  const alerts = [];
  
  // Shawarma waste alert (using waste_percentage from shawarmaData)
  if (shawarmaData && shawarmaData.waste_percentage > 28) {
    alerts.push({
      type: 'danger',
      title: 'High Shawarma Waste',
      message: `Waste is ${shawarmaData.waste_percentage.toFixed(1)}% (target: <28%)`,
      action: 'Review cutting techniques and order timing'
    });
  }
  
  // Staff meals alert (limit 400g = 0.4kg)
  if (shawarmaData && shawarmaData.staff_meals_weight_kg > 0.4) {
    alerts.push({
      type: 'warning',
      title: 'Staff Meals Over Limit',
      message: `${shawarmaData.staff_meals_weight_kg}kg used (limit: 0.4kg)`,
      action: 'Monitor staff meal portions'
    });
  }
  
  // Food cost percentage alert
  if (salesData && salesData.food_cost_percentage > 25) {
    alerts.push({
      type: 'danger',
      title: 'High Food Cost %',
      message: `Food cost is ${salesData.food_cost_percentage.toFixed(1)}% (target: <25%)`,
      action: 'Review portion sizes and waste'
    });
  }
  
  // Profit per kg alerts
  if (shawarmaData && shawarmaData.profit_per_kg < 5) {
    alerts.push({
      type: 'warning',
      title: 'Low Shawarma Profitability',
      message: `Profit per kg: ${shawarmaData.profit_per_kg.toFixed(2)} QAR`,
      action: 'Review pricing and costs'
    });
  }
  
  return alerts;
}