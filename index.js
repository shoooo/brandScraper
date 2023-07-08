const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');
const { searchWebsitefromName, scrapeCompany } = require('./dataScraper');

async function scrape() {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['TEST'];
    const rows = await sheet.getRows();

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
    const page = await browser.newPage();

    try {
        const rowNum = 7

        for (let i = rowNum; i < rows.length; i++) {
            if (!rows[i].website) {
                const name = rows[i].brandname;
                console.log(`Searching for name: ${name}`);
                const retrievedURL = await searchWebsitefromName(page, name);

                if (retrievedURL) {
                    rows[i].website = retrievedURL;
                    await rows[i].save();
                    console.log(`URL retrieved: ${retrievedURL}`);
                } else {
                    console.log('No search results found.');
                }
            } else if (!rows[i].email) {
                const url = rows[i].website;
                await page.goto(url);
                const keyword = '特定商'

                const foundLink = await page.evaluate((keyword) => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const found = links.find((link) => link.innerText.toLowerCase().includes(keyword));
                    return found ? found.href : null;
                }, keyword.toLowerCase());

                if (foundLink) {
                    const scrapedCompany = await scrapeCompany(page, foundLink)
                    console.log(scrapedCompany)

                    if (scrapedCompany.email) {
                        rows[i].email = scrapedCompany.email;
                        await rows[i].save();
                        console.log(`Email found: ${scrapedCompany.email}`);
                    } else {
                        console.log('No email found.');
                    }

                    if (scrapedCompany.companyName) {
                        const companyName = scrapedCompany.companyName[0].replace(/<\/?tagname[^>]*>/g, '');
                        rows[i].company = companyName;
                        await rows[i].save();
                        console.log(`Company found: ${companyName}`);
                    } else {
                        console.log('No company found.');
                    }
                } else {
                    console.log('Target tag not found.');
                }
            }
            // await page.waitForTimeout(1000);
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

scrape()