const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');

async function scrape() {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['MainSheet'];
    const rows = await sheet.getRows();

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
        const page = await browser.newPage();

        const rowNum = 0
        for (let i = rowNum; i < rows.length; i++) {
            if (!rows[i].website) {
                try {
                    const name = rows[i].brandname;
                    console.log(`Searching for name: ${name}`);

                    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(name)}+オンラインストア`);
                    await page.waitForSelector('#search a');

                    const topResult = await page.evaluate(() => {
                        const linkElement = document.querySelector('#search a');
                        return linkElement ? linkElement.href : null;
                    });

                    if (topResult) {
                        rows[i].website = topResult;
                        await rows[i].save();
                        console.log(`URL retrieved: ${topResult}`);
                    } else {
                        console.log('No search results found.');
                    }
                } catch (error) {
                    console.error('An error occurred:', error);
                }
            } else if (!rows[i].email) {
                try {
                    const url = rows[i].website;
                    console.log(`Scraping URL ${url}`);
                    await page.goto(url);
                    const keyword = '特定商'

                    const foundLink = await page.evaluate((keyword) => {
                        const links = Array.from(document.querySelectorAll('a'));
                        const found = links.find((link) => link.innerText.toLowerCase().includes(keyword));
                        return found ? found.href : null;
                    }, keyword.toLowerCase());

                    if (foundLink) {
                        await page.goto(foundLink);
                        console.log(`Navigating to matching link: ${foundLink}`);
                        await page.waitForSelector('a');

                        const email = await page.evaluate(() => {
                            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
                            const emailText = document.body.textContent;
                            const match = emailText.match(emailRegex);
                            return match ? match[0] : null;
                        });

                        // const company = await page.evaluate(() => {
                        //     const companyRegex = /株式会社/;
                        //     const companyText = document.body.textContent;
                        //     const match = companyText.match(companyRegex);
                        //     return match ? match[0].innerHTML : null;
                        // });

                        // const textContent = await page.evaluate(() => document.body.textContent);


                        // const company = await page.evaluate(() => {
                        //     const companyKeyword = '会社'
                        //     const companyRegex = new RegExp(`<tagname[^>]*>[^<]*${companyKeyword}[^<]*<\/tagname>`, 'i');
                        //     const companyText = document.body.textContent;
                        //     const match = companyText.match(companyRegex);
                        //     return match ? match : null;
                        // });

                        if (email) {
                            rows[i].email = email;
                            await rows[i].save();
                            console.log(`Email found: ${email}`);
                        } else {
                            console.log('No email found.');
                        }

                        // if (company) {
                        //     const company = company[0].replace(/<\/?tagname[^>]*>/g, '');
                        //     rows[i].company = company;
                        //     await rows[i].save();
                        //     console.log(`Company found: ${company}`);
                        // } else {
                        //     console.log('No company found.');
                        // }
                    } else {
                        console.log('Target tag not found.');
                    }
                } catch (error) {
                    console.error('An error occurred:', error);
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