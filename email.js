// 1. Import all dependencies
const puppeteer = require("puppeteer");
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Load credentials from file
const credentials = require('./credentials.json');
require('dotenv').config();

const scrapeRow = async (row, page) => {
    const brandLink = row['store link'];
    if (brandLink) {
        try {
            await page.goto(`${brandLink}`);

            const keywords = ['特定商取引', 'プライバシーポリシー', 'お問い合わせ'];
            let matchingLink = null;

            for (const keyword of keywords) {
                console.log(`Searching for keyword: ${keyword}`);
                try {
                    const foundLink = await page.evaluate((keyword) => {
                        const links = Array.from(document.querySelectorAll('a'));
                        const found = links.find((link) => link.innerText.toLowerCase().includes(keyword));
                        return found ? found.href : null;
                    }, keyword.toLowerCase());

                    if (foundLink) {
                        matchingLink = foundLink;
                        console.log(`Matching link found: ${matchingLink}`);
                        break;
                    }
                } catch (error) {
                    console.log(`An error occurred while searching for keyword "${keyword}":`, error);
                }
                // }

                if (matchingLink) {
                    console.log(`Navigating to matching link: ${matchingLink}`);
                    try {
                        await page.goto(matchingLink);
                        const email = await page.evaluate(() => {
                            const emailRegex = /(.+)@(.+){2,}\.(.+){2,}/;
                            const bodyText = document.querySelector('body')?.innerText || '';
                            const matches = bodyText.match(emailRegex);
                            return matches ? matches[0] : null;
                        });

                        row['checkedPage'] = matchingLink;
                        if (email) row['email'] = email;
                    } catch (error) {
                        console.log('An error occurred during navigation:', error);
                    }
                }

            }

        } catch (error) {
            console.log('An error occurred while processing row:', error);
        }
    }
};

const scrapeEmails = async () => {
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

    try {
        const browser = await puppeteer.launch(chromeOptions);
        const page = await browser.newPage();

        const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
        await doc.useServiceAccountAuth(credentials);
        await doc.loadInfo();
        const emailSheet = doc.sheetsById[process.env.LIST_ID];
        const rows = await emailSheet.getRows();

        console.log('Starting email scraping process...');
        let rowCount = 0;
        while (rowCount < rows.length) {
            const row = rows[rowCount];
            await scrapeRow(row, page);
            try {
                await row.save();
                console.log(`Row saved for brand: ${row['brandname']}`);
            } catch (error) {
                console.log('An error occurred while saving the row:', error);
            }
            rowCount++;

            if (row['checkedPage']) {
                console.log('Matching link found. Exiting the loop.');
                break;
            }
        }

        await browser.close();
        console.log('Email scraping process completed successfully.');
    } catch (error) {
        console.log('An error occurred in the main function:', error);
    }
};

// Start the email scraping process
(async () => {
    try {
        await scrapeEmails();
    } catch (error) {
        console.log('An error occurred during email scraping:', error);
    }
})();
