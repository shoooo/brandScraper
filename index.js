const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');
const { searchWebsitefromName, scrapeCompany } = require('./dataScraper');
const { getProductfromWebsite } = require('./api/scrapeProduct');
const { detectECcart } = require('./api/detectECcart');

async function scrape() {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['TANP'];
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
        const startRowNum = 571

        for (let i = startRowNum; i < rows.length; i++) {
            if (!rows[i].ブランドURL) {
                const name = rows[i].ブランド名;
                console.log(`Searching website for: ${name}`);
                const retrievedURL = await searchWebsitefromName(page, name);

                if (retrievedURL) {
                    rows[i].ブランドURL = retrievedURL;
                    await rows[i].save();
                    console.log(`URL retrieved: ${retrievedURL}`);
                } else {
                    console.log('No search results found.');
                }
            } else if (!rows[i].メール) {
                const url = rows[i].ブランドURL;
                await page.goto(url);
                const keyword = '特定商'

                const foundLink = await page.evaluate((keyword) => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const found = links.find((link) => link.innerText.toLowerCase().includes(keyword));
                    return found ? found.href : null;
                }, keyword.toLowerCase());

                if (foundLink) {
                    console.log(`Searching details at: ${foundLink}`);
                    const { email, companyName, instagramLink } = await scrapeCompany(page, foundLink);
                    const detectedCart = await detectECcart(url);
                    console.log("Cart detected: ", detectedCart)

                    rows[i].メール = email || null;
                    rows[i].会社名 = companyName || null;
                    rows[i].Instagram = instagramLink || null;
                    rows[i].カート = detectedCart[0] || null;
                    await rows[i].save();

                    console.log(rows[i]._rowNumber)
                } else {
                    console.log('特定商 not found.');
                }
            } else if (!rows[i].ギフト商品) {
                const websiteURL = rows[i].ブランドURL;
                console.log(`Searching products at: ${websiteURL}`);
                await page.goto(websiteURL);
                await page.waitForSelector('body');
                const bodyContent = await page.evaluate(() => document.body.textContent);

                // OpenAI APIが処理できるトークン数の制限
                if (bodyContent.length < 16000) {
                    const product = await getProductfromWebsite(bodyContent)

                    console.log(product)

                    rows[i].ギフト商品 = product.product;
                    await rows[i].save();
                } else {
                    console.log("Website too long!")
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