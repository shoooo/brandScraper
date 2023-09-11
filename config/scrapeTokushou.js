const scrapeCompany = async (page, foundLink) => {
    await page.goto(foundLink);
    await page.waitForSelector('a');

    const email = await page.evaluate(() => {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
        const emailText = document.body.textContent;
        const match = emailText.match(emailRegex);
        return match ? match[0] : null;
    });

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
        instagramLink: instagramLink
    }
}

module.exports = { scrapeCompany }