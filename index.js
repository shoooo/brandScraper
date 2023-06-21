const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');
const { getWebsite } = require("./name");
const { getEmails } = require("./email");

async function scrape() {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['MainSheet'];
    const rows = await sheet.getRows();

    try {
        for (let i = 0; i < rows.length; i++) {
            if (!rows[i].website) {
                getWebsite(rows, i)
            } else if (!rows[i].email) {
                getEmails('特定商取引', rows, i)
            }
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

scrape()