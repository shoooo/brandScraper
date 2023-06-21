const { GoogleSpreadsheet } = require('google-spreadsheet');
const puppeteer = require('puppeteer');
require('dotenv').config();
const credentials = require('./credentials.json');

async function getEmails(keyword, rows, i) {
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
        const url = rows[i].website;
        console.log(`Scraping URL ${url}`);

        const page = await browser.newPage();
        await page.goto(url);

        const foundLink = await page.evaluate((keyword) => {
            const links = Array.from(document.querySelectorAll('a'));
            const found = links.find((link) => link.innerText.toLowerCase().includes(keyword));
            return found ? found.href : null;
        }, keyword.toLowerCase());

        if (foundLink) {
            await page.goto(foundLink);
            console.log(`Navigating to matching link: ${foundLink}`);

            const email = await page.evaluate(() => {
                const emailRegex = /(.+)@(.+){2,}\.(.+){2,}/; // Replace with your email regex pattern
                const emailText = document.body.textContent;
                const match = emailText.match(emailRegex);
                return match ? match[0] : null;
            });

            if (email) {
                rows[i].email = email;
                await rows[i].save();
                console.log(`Email found: ${email}`);
            } else {
                console.log('No email found.');
            }
        } else {
            console.log('Target tag not found.');
        }

        await page.close();
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

module.exports = { getEmails }