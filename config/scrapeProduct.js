const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

// Set up OpenAI API credentials
const openai = new OpenAIApi(configuration);
const model = 'gpt-3.5-turbo-16k';

const getProductfromWebsite = async (page, url) => {
    try {
        await page.goto(url);
        await page.waitForSelector('body');
        const bodyContent = await page.evaluate(() => document.body.textContent);
        const trimmedContent = bodyContent.trim();

        // OpenAI APIが処理できるトークン数の制限
        if (trimmedContent.length < 16000) {
            const prompt = `
            与えられたウェブサイトのボディのコンテンツから、1つの商品名を抽出してください。
            商品が見つからない場合は空欄で出力してください。

            #Body Content
            ${bodyContent}
                `;

            const response = await openai.createChatCompletion({
                model: model,
                messages: [{ role: "assistant", content: prompt }],
                functions: [
                    {
                        "name": "convertToJSON",
                        "description": "抽出された特徴をJSONとして処理します。",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "product": {
                                    "type": "string",
                                    "description": "商品の名前です",
                                }
                            },
                        },
                    }
                ],
                function_call: { "name": "convertToJSON" },
                max_tokens: 256,
                n: 1,
                temperature: 1,
            });

            const product = response.data.choices[0].message.function_call.arguments
            const productJSON = JSON.parse(product);
            return productJSON
        } else {
            console.log("Website too long!")
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = { getProductfromWebsite }