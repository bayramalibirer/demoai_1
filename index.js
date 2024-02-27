import express from 'express';
const app = express();
import cors from 'cors';
const PORT = process.env.PORT || 3000;
import * as tf from'@tensorflow/tfjs-node';
import fs from 'fs';
import { pipeline,BertTokenizer } from '@xenova/transformers';
import  router from './routes/router.js';
import BertModel from './bert.js';

async function createPipeline() {
    const modelPath = await loadModel();
     // Model dosya yolunu doğru bir şekilde belirtin
    const tokenizerPath = await loadTokenizer(); // Tokenizer dosya yolunu doğru bir şekilde belirtin

    const sentimentPipeline = await pipeline('sentiment-analysis', modelPath);

    return sentimentPipeline;
}
//const pip=createPipeline();

async function loadModel() {
    
        const modelPath = './models/tfjs_model/model.json'; // Modelin dosya yolunu doğru bir şekilde belirtin
        const model = await tf.loadGraphModel(tf.io.fileSystem(modelPath));
        //console.log(model);
        console.log("model yüklendi");

    
    return model;
}
function loadTokenizer() {
    const tokenizerPath = "./tokenizer/tokenizer.json";
    const specialTokensMapPath = "./tokenizer/special_tokens_map.json";
    const tokenizerConfigPath = "./tokenizer/tokenizer_config.json";
    const vocabPath = "./tokenizer/vocab.txt";

    const rawTokenizerData = fs.readFileSync(tokenizerPath);
    const tokenizerData = JSON.parse(rawTokenizerData);

    const rawSpecialTokensMap = fs.readFileSync(specialTokensMapPath);
    const specialTokensMap = JSON.parse(rawSpecialTokensMap);

    const rawTokenizerConfig = fs.readFileSync(tokenizerConfigPath);
    const tokenizerConfig = JSON.parse(rawTokenizerConfig);

    const rawVocab = fs.readFileSync(vocabPath, "utf-8");
    const vocab = rawVocab.split("\n");

    const tokenizer = new BertTokenizer(tokenizerData, specialTokensMap, tokenizerConfig, vocab);

    //console.log(tokenizer);
    console.log("tokenizer yüklendi");
    return tokenizer;
}


async function predictSentiment(text) {
    const token = await loadTokenizer();
    const model = await loadModel();

    var encodedText = token.encode(text);
    var input_ids = tf.tensor2d([encodedText], [1, encodedText.length], 'int32');
    var token_type_ids = tf.tensor2d([Array(input_ids.shape[1]).fill(0)], [1, input_ids.shape[1]], 'int32');
    var attention_mask = tf.tensor2d([Array(input_ids.shape[1]).fill(1)], [1, input_ids.shape[1]], 'int32');

    console.log(encodedText,input_ids, token_type_ids, attention_mask);
    var x = model.predict([input_ids, token_type_ids, attention_mask]);
    x = tf.mean(x);
    x = x.arraySync();

    return x;
}

//const pip = await createPipeline();
//const prediction =pip("Seni çok seviyorumm.bu gün seni çok özledim");
//console.log(prediction);

predictSentiment("Seni çok seviyorumm.bu gün seni çok özledim");

//const bertModel = new BertModel();
//await bertModel.setup();
//const preprocessedInput=await bertModel.preprocess("Seni çok seviyorumm");
//const predictions=await bertModel.predict(preprocessedInput);
//console.log(predictions);

app.use(express.json());
app.use(cors());

// add routes

app.use('/api', router);

// run server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));