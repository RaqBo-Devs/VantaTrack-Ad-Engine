import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { Readable } from 'stream';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Download Google Ads CSV template
router.get('/template/google', (req, res) => {
  const template = `Campaign ID,Campaign Name,Campaign Type,Status,Budget USD,Start Date,End Date,Impressions,Clicks,Conversions,Cost USD,CTR,CPC USD
12345,Sample Google Campaign,Search,Active,1000.00,2024-01-01,2024-12-31,50000,2500,125,800.00,5.00,0.32
67890,Display Campaign Example,Display,Active,1500.00,2024-01-15,2024-12-31,75000,1875,94,1200.00,2.50,0.64`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="google_ads_template.csv"');
  res.send(template);
});

// Download Facebook Ads CSV template
router.get('/template/facebook', (req, res) => {
  const template = `Campaign ID,Campaign Name,Campaign Objective,Status,Budget USD,Start Date,End Date,Impressions,Clicks,Conversions,Cost USD,CTR,CPC USD
fb123,Sample Facebook Campaign,CONVERSIONS,Active,800.00,2024-01-01,2024-12-31,60000,3000,180,700.00,5.00,0.23
fb456,Brand Awareness Campaign,REACH,Active,1200.00,2024-01-15,2024-12-31,100000,2000,80,950.00,2.00,0.48`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="facebook_ads_template.csv"');
  res.send(template);
});

// Parse CSV data
function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const readable = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });

    readable
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Parse Excel data
function parseExcel(buffer) {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw new Error('Failed to parse Excel file');
  }
}

// Validate Google Ads data
function validateGoogleData(data) {
  const errors = [];
  const required = ['Campaign Name'];
  
  data.forEach((row, index) => {
    required.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Row ${index + 2}: ${field} is required`);
      }
    });
    
    // Validate numeric fields
    const numericFields = ['Budget USD', 'Impressions', 'Clicks', 'Conversions', 'Cost USD', 'CTR', 'CPC USD'];
    numericFields.forEach(field => {
      if (row[field] && row[field] !== '' && isNaN(parseFloat(row[field]))) {
        errors.push(`Row ${index + 2}: ${field} must be a valid number`);
      }
    });
    
    // Validate date fields
    const dateFields = ['Start Date', 'End Date'];
    dateFields.forEach(field => {
      if (row[field] && row[field] !== '' && isNaN(Date.parse(row[field]))) {
        errors.push(`Row ${index + 2}: ${field} must be a valid date (YYYY-MM-DD)`);
      }
    });
  });
  
  return errors;
}

// Validate Facebook Ads data
function validateFacebookData(data) {
  const errors = [];
  const required = ['Campaign Name'];
  
  data.forEach((row, index) => {
    required.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Row ${index + 2}: ${field} is required`);
      }
    });
    
    // Validate numeric fields
    const numericFields = ['Budget USD', 'Impressions', 'Clicks', 'Conversions', 'Cost USD', 'CTR', 'CPC USD'];
    numericFields.forEach(field => {
      if (row[field] && row[field] !== '' && isNaN(parseFloat(row[field]))) {
        errors.push(`Row ${index + 2}: ${field} must be a valid number`);
      }
    });
    
    // Validate date fields
    const dateFields = ['Start Date', 'End Date'];
    dateFields.forEach(field => {
      if (row[field] && row[field] !== '' && isNaN(Date.parse(row[field]))) {
        errors.push(`Row ${index + 2}: ${field} must be a valid date (YYYY-MM-DD)`);
      }
    });
    
    // Validate campaign objectives
    const validObjectives = ['CONVERSIONS', 'REACH', 'TRAFFIC', 'ENGAGEMENT', 'APP_INSTALLS', 'VIDEO_VIEWS', 'LEAD_GENERATION'];
    if (row['Campaign Objective'] && !validObjectives.includes(row['Campaign Objective'].toUpperCase())) {
      errors.push(`Row ${index + 2}: Campaign Objective must be one of: ${validObjectives.join(', ')}`);
    }
  });
  
  return errors;
}

// Transform Google Ads data for database
function transformGoogleData(data) {
  return data.map(row => ({
    googleCampaignId: row['Campaign ID'] || null,
    campaignName: row['Campaign Name'],
    campaignType: row['Campaign Type'] || 'Search',
    status: row['Status'] || 'Active',
    budgetUsd: row['Budget USD'] ? parseFloat(row['Budget USD']) : null,
    startDate: row['Start Date'] ? new Date(row['Start Date']) : null,
    endDate: row['End Date'] ? new Date(row['End Date']) : null,
    impressions: row['Impressions'] ? parseInt(row['Impressions']) : 0,
    clicks: row['Clicks'] ? parseInt(row['Clicks']) : 0,
    conversions: row['Conversions'] ? parseInt(row['Conversions']) : 0,
    costUsd: row['Cost USD'] ? parseFloat(row['Cost USD']) : 0,
    ctr: row['CTR'] ? parseFloat(row['CTR']) : null,
    cpcUsd: row['CPC USD'] ? parseFloat(row['CPC USD']) : null
  }));
}

// Transform Facebook Ads data for database
function transformFacebookData(data) {
  return data.map(row => ({
    facebookCampaignId: row['Campaign ID'] || null,
    campaignName: row['Campaign Name'],
    campaignObjective: row['Campaign Objective'] || 'CONVERSIONS',
    status: row['Status'] || 'Active',
    budgetUsd: row['Budget USD'] ? parseFloat(row['Budget USD']) : null,
    startDate: row['Start Date'] ? new Date(row['Start Date']) : null,
    endDate: row['End Date'] ? new Date(row['End Date']) : null,
    impressions: row['Impressions'] ? parseInt(row['Impressions']) : 0,
    clicks: row['Clicks'] ? parseInt(row['Clicks']) : 0,
    conversions: row['Conversions'] ? parseInt(row['Conversions']) : 0,
    costUsd: row['Cost USD'] ? parseFloat(row['Cost USD']) : 0,
    ctr: row['CTR'] ? parseFloat(row['CTR']) : null,
    cpcUsd: row['CPC USD'] ? parseFloat(row['CPC USD']) : null
  }));
}

// Upload and process file
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { platform, clientId } = req.body;
    
    if (!platform || !clientId) {
      return res.status(400).json({ error: 'Platform and client ID are required' });
    }

    if (!['google', 'facebook'].includes(platform)) {
      return res.status(400).json({ error: 'Platform must be either google or facebook' });
    }

    let data;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Parse file based on extension
    if (fileExtension === '.csv') {
      data = await parseCSV(req.file.buffer);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      data = parseExcel(req.file.buffer);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'File is empty or invalid' });
    }

    // Validate data based on platform
    let validationErrors;
    let transformedData;
    
    if (platform === 'google') {
      validationErrors = validateGoogleData(data);
      transformedData = transformGoogleData(data);
    } else {
      validationErrors = validateFacebookData(data);
      transformedData = transformFacebookData(data);
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.json({
      success: true,
      fileName: req.file.originalname,
      platform,
      recordsFound: data.length,
      data: transformedData,
      message: `Successfully processed ${data.length} records`
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process file',
      details: error.message 
    });
  }
});

export default router;