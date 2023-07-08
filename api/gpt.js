const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

// Set up OpenAI API credentials
const openai = new OpenAIApi(configuration);
const model = 'gpt-3.5-turbo-16k';

const getProductfromWebsite = async (bodyContent) => {
        try {
            const prompt = `
            与えられたウェブサイトのボディのコンテンツから、1つ人気の商品名とその価格を抽出して、フォーマットを"{productName,price}"で、JSON形式で出力せよ。
            商品が見つからない場合は空欄で出力してください。

            #Body Content
            ${bodyContent}
              `;
            const response = await openai.createChatCompletion({
                model: model,
                messages: [{ role: "assistant", content: prompt }],
                max_tokens: 256,
                n: 1,
                temperature: 1,
            });

            const productJSON = response.data.choices[0].message.content
            const product = JSON.parse(productJSON)
            return product
        } catch (error) {
            console.error('An error occurred:', error);
        }
}

module.exports = { getProductfromWebsite }