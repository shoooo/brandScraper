const searchWebsitefromName = async (page, name) => {
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(name)}+オンラインストア`);
    await page.waitForSelector('#search a');

    return topResult = await page.evaluate(() => {
        const linkElement = document.querySelector('#search a');
        return linkElement ? linkElement.href : null;
    });
}

const scrapeCompany = async (page, foundLink) => {
    await page.goto(foundLink);
    console.log(`Navigating to matching link: ${foundLink}`);
    await page.waitForSelector('a');

    const email = await page.evaluate(() => {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
        const emailText = document.body.textContent;
        const match = emailText.match(emailRegex);
        return match ? match[0] : null;
    });

    const companyName = await page.evaluate(() => {
        const companyKeyword = '会社'
        const companyRegex = new RegExp(`<tagname[^>]*>[^<]*${companyKeyword}[^<]*<\/tagname>`, 'i');
        const companyText = document.body.textContent;
        const match = companyText.match(companyRegex);
        return match ? match : null;
    });

    return company = {
        email: email,
        companyName: companyName,
    }
}

module.exports = { searchWebsitefromName, scrapeCompany }