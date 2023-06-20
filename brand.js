// 1. Import all dependencies
const puppeteer = require("puppeteer");
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Load credentials from file
const credentials = require('./credentials.json');
require('dotenv').config();

const scrapeBrandNames = async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Navigate to the specific website and perform scraping
        const website = "https://www.lemail.jp/pro/bracol.html"
        await page.goto(website);
        console.log("Accessed:", website)
        
        // Wait for the brand-box2 section to load
    
        await page.waitForSelector('.brand-box2');

        // Get the alt text of images within the ul list in brand-box2 section
        const brandNames = await page.$$eval('.brand-box2 ul li img', (images) =>
            images.map((image) => image.alt)
        );

        console.log('Brand names:', brandNames);

        await browser.close();

        // Add the brand names to the spreadsheet
        const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
        await doc.useServiceAccountAuth(credentials);
        await doc.loadInfo();
        const sheet = doc.sheetsById[process.env.SHEET_ID];

        // const rows = await sheet.getRows();
        // const lastRow = rows.length + 1;

        for (const brandName of brandNames) {
            await sheet.addRow({ BrandName: brandName });
            console.log(`Added brand name '${brandName}' to the spreadsheet.`);
        }
    } catch (error) {
        console.log('An error occurred while scraping brand names or updating the spreadsheet:', error);
    }
};

scrapeBrandNames();