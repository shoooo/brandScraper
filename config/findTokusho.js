const findTokusho = async (page, url) => {
    await page.goto(url);
    const keyword = '特定商'

    return foundLink = await page.evaluate((keyword) => {
        const links = Array.from(document.querySelectorAll('a'));
        const found = links.find((link) => link.innerText.toLowerCase().includes(keyword));
        return found ? found.href : null;
    }, keyword.toLowerCase());
}

module.exports = { findTokusho }