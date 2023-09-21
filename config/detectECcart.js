const Wappalyzer = require('wappalyzer')
const wappalyzer = new Wappalyzer()

// navigationをよく考えずに作ってしまったので、挙動見ないと
const detectECcart = async (url) => {
    try {
        await wappalyzer.init();
        const site = await wappalyzer.open(url)
        const detectedTech = await site.analyze()
        const detectedCarts = detectedTech.technologies.filter(tech => {
            return tech.categories.some(category => category.slug === 'ecommerce')
        }).map(filteredTech => filteredTech.name);

        const detectedCart = detectedCarts.filter(carts => carts !== "Cart Functionality");
        return detectedCart[0]
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = { detectECcart }