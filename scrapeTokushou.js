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
    await page.waitForSelector('a');

    const email = await page.evaluate(() => {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
        const emailText = document.body.textContent;
        const match = emailText.match(emailRegex);
        return match ? match[0] : null;
    });

    // const companyName = await page.evaluate(() => {
    //     const links = Array.from(document.querySelectorAll('a'));
    //     const foundName = links.find((link) => link.innerText.toLowerCase().includes("会社"));
    //     return foundName ? foundName.href : null;
    // });
    // console.log(companyName)

    const instagramLink = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const instagramLink = links.find((link) => {
            const href = link.getAttribute('href');
            return href && href.includes('instagram.com');
        });
        return instagramLink ? instagramLink.href : null;
    });

    return company = {
        email: email,
        // companyName: companyName,
        instagramLink: instagramLink
    }
}

module.exports = { searchWebsitefromName, scrapeCompany }