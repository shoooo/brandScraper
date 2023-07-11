const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');
const { searchWebsitefromName, scrapeCompany } = require('./dataScraper');
const { getProductfromWebsite } = require('./api/gpt');

async function scrape() {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['MainSheet'];
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

    try {
        // row number to start scraping from
        const startRowNum = 1395

        for (let i = startRowNum; i < rows.length; i++) {
            if (!rows[i].website) {
                const name = rows[i].brandname;
                console.log(`Searching website for: ${name}`);
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
                    const { email, companyName, instagramLink } = await scrapeCompany(page, foundLink);

                    if (email) {
                        rows[i].email = email;
                        await rows[i].save();
                        console.log(`Email found: ${email}`);
                    } else {
                        console.log('No email found.');
                    }

                    if (companyName) {
                        // const companyName = companyName[0].replace(/<\/?tagname[^>]*>/g, '');
                        rows[i].company = companyName;
                        await rows[i].save();
                        console.log(`Company found: ${companyName}`);
                    } else {
                        console.log('No company found.');
                    }

                    if (instagramLink) {
                        rows[i].instagram = instagramLink;
                        await rows[i].save();
                        console.log(`Instagram found: ${instagramLink}`);
                    } else {
                        console.log('No Instagram found.');
                    }

                } else {
                    console.log('Target tag not found.');
                }
            } else if (!rows[i].product) {
                const websiteURL = rows[i].website;
                await page.goto(websiteURL);
                await page.waitForSelector('body');
                const bodyContent = await page.evaluate(() => document.body.textContent);

                // OpenAI APIが処理できるトークン数の制限
                if (bodyContent.length < 16000) {
                    const product = await getProductfromWebsite(bodyContent)

                    console.log(product)
                    console.log(product.productName)

                    rows[i].product = product.productName;
                    rows[i].price = product.price;
                    await rows[i].save();
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