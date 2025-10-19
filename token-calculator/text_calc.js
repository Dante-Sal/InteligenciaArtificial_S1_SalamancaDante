const { encoding_for_model } = require('tiktoken');

async function countTokens() {
    const encoding = encoding_for_model('gpt-4');

    const text = 'Hola ¿cómo estás? Espero que muy bien.';
    const generatedTokens = encoding.encode(text);

    console.log('Tokens: ' + generatedTokens);
    console.log('Cantidad de tokens: ' + generatedTokens.length);

    const costPerThousandTokens = 0.03;
    const cost = ((costPerThousandTokens/1000) * generatedTokens.length).toFixed(5);

    console.log('Costo estimado: $' + cost + ' USD');
};

countTokens();