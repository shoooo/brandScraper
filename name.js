const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');

async function getWebsite(rows, i) {
    try {

        const chromeOptions = {
            headless: true,
            defaultViewport: null,
            args: [
                "--incognito",
                "--no-sandbox",
                "--single-process",
                "--no-zygote"
            ],
        };

        const browser = await puppeteer.launch(chromeOptions);
        const name = rows[i].brandname;
        console.log(`Searching for name: ${name}`);

        const page = await browser.newPage();
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(name)}`);

        const resultSelector = '#search a';
        await page.waitForSelector(resultSelector);

        const topResult = await page.$(resultSelector);

        if (topResult) {
            const url = await page.evaluate(element => element.href, topResult);
            rows[i].website = url;
            await rows[i].save();
            console.log(`URL retrieved: ${url}`);
        } else {
            console.log('No search results found.');
        }

        await page.close();
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

module.exports = { getWebsite }