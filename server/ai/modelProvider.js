const { ChatOllama } = require('@langchain/ollama');

const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://golem:11434';

/*
 * createChatModel — returns a ChatOllama instance with the provided tools bound.
 * The model is configured for tool-calling; temperature is set slightly higher
 * (0.8) to encourage creative copy output while tools are called at 0.0 internally.
 */
function createChatModel(tools) {
    const model = new ChatOllama({
        model: DEFAULT_MODEL,
        baseUrl: OLLAMA_HOST,
        temperature: 0.7
    });
    return model.bindTools(tools);
}

module.exports = { createChatModel };
