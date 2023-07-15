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
            与えられたウェブサイトのボディのコンテンツから、1つの商品名とその価格を抽出してください。
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
                            },
                            "price": {
                                "type": "number",
                                "description": "商品の値段です",
                            },
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
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = { getProductfromWebsite }