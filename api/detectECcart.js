const Wappalyzer = require('wappalyzer')
const wappalyzer = new Wappalyzer()

// navigationをよく考えずに作ってしまったので、挙動テスト必要
const detectECcart = async (url) => {
    try {
        await wappalyzer.init();
        const site = await wappalyzer.open(url)
        const detectedTech = await site.analyze()
        const detectedCart = detectedTech.technologies.filter(tech => {
            return tech.categories.some(category => category.slug === 'ecommerce')
        }).map(filteredTech => filteredTech.name);

        if (detectedCart[0] != "Cart Functionality") {
            return detectedCart
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = { detectECcart }