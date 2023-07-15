const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');
const { searchWebsitefromName, scrapeCompany } = require('./dataScraper');
const { getProductfromWebsite } = require('./api/scrapeProduct');
// const { detectECcart } = require('./api/detectECcart');

async function scrape() {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['お中元2'];
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
        const startRowNum = 139

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
                    // const pageContent = await page.content();
                    // const detectedCart = await detectECcart(url, pageContent);
                    // console.log(detectedCart)

                    rows[i].email = email || null;
                    rows[i].company = companyName || null;
                    rows[i].instagram = instagramLink || null;
                    await rows[i].save();

                    console.log(rows[i])
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

                    rows[i].product = product;
                    // rows[i].price = product.price;
                    await rows[i].save();
                }
            }
            await page.waitForTimeout(1500);
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

scrape()