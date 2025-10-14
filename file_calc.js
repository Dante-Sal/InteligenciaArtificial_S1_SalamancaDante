//command examples at the bottom...

const fs = require('fs');
const readline = require('readline');
const { encoding_for_model } = require('tiktoken');

function getArgument(name, abbreviation) {
    const args = process.argv.slice(2);

    const argumentByNameIdx = args.indexOf(`--${name}`);
    if (argumentByNameIdx !== -1) return args[argumentByNameIdx + 1];

    if (abbreviation) {
        const argumentByAbbrIdx = args.indexOf(`-${abbreviation}`);
        if (argumentByAbbrIdx !== -1) return args[argumentByAbbrIdx + 1];
    };

    return undefined;
};

async function summarize() {
    const filePath = getArgument('file', 'f');
    const model = getArgument('model', 'm') || 'gpt-4';
    const chunkSize = Number(getArgument('chksz', 'c') || 2000);
    let overlap = Number(getArgument('overlap', 'o') || 0);
    const pricePerMillion = Number(getArgument('ppm', 'p'));

    if (!filePath) {
        console.error('error: missing argument \'file\' (file path)');
        process.exit(1);
    };

    if (!Number.isFinite(pricePerMillion)) {
        console.error('error: missing argument \'ppm\' (price per million tokens)');
        process.exit(1);
    };

    const encoding = encoding_for_model(model);

    let totalTokens = 0;
    let chunksCount = 0;
    let textAccumulator = '';

    const txt = readline.createInterface({
        input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
        crlfDelay: Infinity
    });

    for await (const line of txt) {
        textAccumulator += (textAccumulator ? '\n' : '') + line;

        while (true) {
            const tokens = encoding.encode(textAccumulator);
            if (tokens.length < chunkSize) break;

            const chunkTokens = tokens.slice(0, chunkSize);
            chunksCount++;
            totalTokens += chunkTokens.length;

            overlap = Math.min(overlap, chunkSize);
            const overlapTokens = overlap > 0 ? chunkTokens.slice(chunkSize - overlap) : [];
            const leftoverTokens = tokens.slice(chunkSize);

            textAccumulator = (overlapTokens.length ? encoding.decode(overlapTokens) : '') + encoding.decode(leftoverTokens);
        };
    };

    const finalTokens = encoding.encode(textAccumulator);

    if (finalTokens.length > 0) {
        chunksCount++;
        totalTokens += finalTokens.length;
    };

    encoding.free();

    const cost = (pricePerMillion / 10**6) * totalTokens;

    console.log(`file: ${filePath}
model: ${model}
chunk size: ${chunkSize} tokens
overlap: ${overlap} tokens
generated chunks: ${chunksCount} chunks
total tokens (overlap included): ${totalTokens} tokens
price per million tokens: $${pricePerMillion} USD
estimated cost (input only): $${cost} USD`);
};

summarize();

//command examples:

  //direct execution:

    //manual:

    //node file_calc.js -- --file ./One_Hundred_Years_of_Solitude_djvu.txt --ppm 30
    //node file_calc.js -- --file ./One_Hundred_Years_of_Solitude_djvu.txt --model o3 --chksz 3000 --overlap 50 --ppm 2

    //auto:

    //nodemon file_calc.js -- --file ./One_Hundred_Years_of_Solitude_djvu.txt --ppm 30
    //nodemon file_calc.js -- --file ./One_Hundred_Years_of_Solitude_djvu.txt --model o3 --chksz 3000 --overlap 50 --ppm 2

  //execution by scripts:

    //manual:

    //npm run start_file_calc -- --file ./One_Hundred_Years_of_Solitude_djvu.txt --ppm 30
    //npm run start_file_calc -- --file ./One_Hundred_Years_of_Solitude_djvu.txt --model o3 --chksz 3000 --overlap 50 --ppm 2

    //auto:

    //npm run test_file_calc -- --file ./One_Hundred_Years_of_Solitude_djvu.txt --ppm 30
    //npm run test_file_calc -- --file ./One_Hundred_Years_of_Solitude_djvu.txt --model o3 --chksz 3000 --overlap 50 --ppm 2

// --file / -f : path of the file to be entered into the calculator
// --model / -m : AI model to be selected
// --chksz / -c : number of tokens in each "block"
// --overlap / -o : number of tokens from the previous "block" that will be repeated in the next one
// --ppm / -p : price per million tokens (in dollars)
