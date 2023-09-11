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
    //     const bodyContent = document.body.textContent;
    //     const foundName = bodyContent.find((bodyContent) => bodyContent.innerText.includes("会社"));
    //     return foundName ? foundName : null;

    //     for (const element of elements) {
    //         if (element.textContent.includes(keyword)) {
    //             return element.textContent;
    //         }
    //     }
    //     return null;
    // });

    // const companyName = await page.evaluate(() => {
    //     const regex = /会社[^A-Za-z0-9]+(.+?)(?:[^\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ァ-ヴーａ-ｚ０-９々〆〤]+)/u; // Regex to capture the company name
    //     const textContent = document.body.textContent || '';
    //     const match = textContent.match(regex);
    //     return match ? match[1].trim() : null; // Extract and trim the matched company name
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

module.exports = { scrapeCompany }