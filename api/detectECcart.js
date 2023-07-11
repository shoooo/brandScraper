const Wappalyzer = require('wappalyzer')
const wappalyzer = new Wappalyzer()

// navigationをよく考えずに作ってしまったので、挙動テスト必要
const detectECcart = async (url) => {
    try {
        await wappalyzer.init();
        const site = await wappalyzer.open(url)
        const detectedCart = await site.analyze()

        return detectedCart.technologies[0].categories[0]
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = { detectECcart }