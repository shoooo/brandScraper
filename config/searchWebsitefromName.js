const searchWebsitefromName = async (page, name) => {
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(name)}+オンラインストア`);
    await page.waitForSelector('#search a');

    return topResult = await page.evaluate(() => {
        const linkElement = document.querySelector('#search a');
        return linkElement ? linkElement.href : null;
    });
}

module.exports = { searchWebsitefromName }