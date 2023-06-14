// 1. Import all dependencies
const puppeteer = require("puppeteer");
const { GoogleSpreadsheet } = require('google-spreadsheet');

// The credentials are for OAuth2 from Google
const credentials = require('./credentials.json');
require('dotenv').config();

const scrapeEmail = async () => {
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

        for (const row of rows) {
            try {
                const brandname = row['brandname'];
                await page.goto(`https://www.google.com/search?q=${encodeURIComponent(brandname)}`);
                await page.waitForSelector('#search');
                const websiteURL = await page.$eval('#search a', (element) => element.href);

                const navigationPromise = page.waitForNavigation();
                await Promise.all([
                    page.click('#search a'), // Click on the link
                    navigationPromise, // Wait for navigation to complete
                ]);

                await page.waitForTimeout(2000); // Adjust the delay as needed

                const keywords = ['特定商取引', 'プライバシーポリシー', 'お問い合わせ'];

                let matchingLink = null;
                for (const keyword of keywords) {
                    try {
                        matchingLink = await page.evaluate((keyword) => {
                            const links = Array.from(document.querySelectorAll('a'));
                            const foundLink = links.find((link) => link.innerText.toLowerCase().includes(keyword));
                            return foundLink ? foundLink.href : null;
                        }, keyword.toLowerCase());

                        if (matchingLink) {
                            await page.goto(`${matchingLink}`)
                            const email = await page.evaluate(() => (document.querySelector('body')?.innerText.match(/(.+)@(.+){2,}\.(.+){2,}/) ?? null));
                            console.log(matchingLink)
                            row['checked page'] = matchingLink;
                            if (email != null) row['email'] = email[0];
                            break;
                        }
                    } catch (error) {
                        console.log('An error occurred while evaluating the page:', error);
                    }
                }

                row['website'] = websiteURL;

            } catch (e) {
                console.log('An error occurred while processing row:', e);
            }

            try {
                // Update the spreadsheet with the website URL and additional info
                await row.save(); // Save the updated row
            } catch (error) {
                console.log('An error occurred while saving the row:', error);
            }
        }

        await browser.close();
    } catch (error) {
        console.log('An error occurred in the main function:', error);
    }
};

// Start the scraping process
(async () => {
    try {
        await scrapeEmail();
    } catch (error) {
        console.log('An error occurred during scraping:', error);
    }
})();