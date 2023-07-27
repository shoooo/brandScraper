const Wappalyzer = require('wappalyzer')
const wappalyzer = new Wappalyzer()

// navigationをよく考えずに作ってしまったので、挙動見ないと
const detectECcart = async (url) => {
    try {
        await wappalyzer.init();
        const site = await wappalyzer.open(url)
        const detectedTech = await site.analyze()
        const detectedCart = detectedTech.technologies.filter(tech => {
            return tech.categories.some(category => category.slug === 'ecommerce')
        }).map(filteredTech => filteredTech.name);

        console.log(detectedCart)

        if (detectedCart[0] == "Cart Functionality") {
            return null
        } else {
            return detectedCart[0]
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = { detectECcart }