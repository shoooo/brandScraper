const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');
const { scrapeCompany } = require('./config/scrapeTokushou');
const { searchWebsitefromName } = require('./config/searchWebsitefromName');
const { getProductfromWebsite } = require('./config/scrapeProduct');
const { findTokusho } = require('./config/findTokusho');
const { detectECcart } = require('./config/detectECcart');

const scrape = async () => {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[process.env.SHEET_TITLE];
    const rows = await sheet.getRows();

    const puppeteerOptions = {
        headless: true,
        defaultViewport: null,
        args: [
            "--incognito",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
    };

    const browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();

    // row number to start scraping from
    const startRow = 1330
    const startRowNum = startRow - 2

    for (let i = startRowNum; i < rows.length; i++) {
        try {
            if (!rows[i].ブランドURL) {
                const name = rows[i].ブランド名;
                console.log(`Searching website for: ${name}`);
                const retrievedURL = await searchWebsitefromName(page, name);
                rows[i].ブランドURL = retrievedURL;
                await rows[i].save();
            } else if (!rows[i].メール) {
                const url = rows[i].ブランドURL;
                const foundLink = await findTokusho(page, url)

                if (foundLink) {
                    console.log(`Scraping information for: ${rows[i].ブランド名}`);
                    const { email, companyName, instagramLink } = await scrapeCompany(page, foundLink);
                    const detectedCart = await detectECcart(url);
                    const product = await getProductfromWebsite(page, url)

                    rows[i].メール = email || null;
                    rows[i].会社名 = companyName || null;
                    rows[i].Instagram = instagramLink || null;
                    rows[i].カート = detectedCart || null;
                    rows[i].ギフト商品 = product || null;
                    await rows[i].save();

                }
            }
            await page.waitForTimeout(2000);
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
    await browser.close();
}

scrape()