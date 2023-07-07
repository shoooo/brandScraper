const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set up OpenAI API credentials
const openai = new OpenAIApi(configuration);
const model = 'gpt-3.5-turbo-16k';
require('dotenv').config();

const getProductfromWebsite = async () => {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['TEST'];
    const rows = await sheet.getRows();

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].website) {
                try {
                    const website = rows[i].website;
                    console.log(`Getting contents for: ${website}`);

                    await page.goto(`${website}`);
                    await page.waitForSelector('body');
                    const content = await page.evaluate(() => document.body.innerText);

                    const product = await getProductfromWebsite(content)
                    console.log(product)

                    rows[i].product = product.productName;
                    rows[i].price = product.price;
                    await rows[i].save();
                } catch (error) {
                    console.error('An error occurred:', error);
                }
            }
            // await page.waitForTimeout(1000);
        }
        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

getProductTest()

module.exports = { getProductfromWebsite }