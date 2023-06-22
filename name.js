const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();
const credentials = require('./credentials.json');

async function getWebsite(rows, i, browser) {
    try {        
        const name = rows[i].brandname;
        console.log(`Searching for name: ${name}`);
        
        const page = await browser.newPage();
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(name)}`);
        await page.waitForSelector('#search a');

        const topResult = await page.evaluate(() => {
            const linkElement = document.querySelector('#search a');
            return linkElement ? linkElement.href : null;
          });

          console.log(topResult);
        if (topResult) {
            rows[i].website = url;
            await rows[i].save();
            console.log(`URL retrieved: ${url}`);
        } else {
            console.log('No search results found.');
        }

        await page.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = { getWebsite }