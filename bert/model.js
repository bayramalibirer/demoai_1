import * as tf from "@tensorflow/tfjs-node"
import fs from 'fs';
import { BertTokenizer} from '@xenova/transformers';
//import {loadTokenizer}  from "./tokenizer.js";



class BertModel {
    constructor(inputSize) {
        this.inputSize = inputSize;
        this.url = `file://./models/tfjs_model/model.json`;
        
    }
    
    async setup() {
        const setupCalls = [];

        if (this.model === undefined) {
            setupCalls.push(this.loadBertModel());
        }

        if (this.tokenizer === undefined) {
            setupCalls.push(this.loadTokenizer());
        }

        try {
            await Promise.all(setupCalls);
            console.log(`Setup completed`);
        } catch (e) {
            console.log(`Setup error: ${e}`);
        }
    }

    preprocess(input) {
        const inputs = [input];
        const processedInputs = this.batchPreprocess(inputs);
        return processedInputs[0];
    }

    // Preprocess dataset
    batchPreprocess(inputExamples, inputLabels) {
        const Inputs = inputExamples.toString()
        const tokenizedInputs = this.tokenizer.encode(Inputs);
        const a=tokenizedInputs
        const b=Array(tokenizedInputs.length).fill(0)
        const c=Array(tokenizedInputs.length).fill(1)
        const bertInput = {
            inputIds: a,
            segmentIds: b,
            inputMask: c
        };
       
        return bertInput;
    }

    async train(input, batchSize = 32) {
        console.log("Start training...");
        const inputs= this.batchPreprocess(input);
        const bertOutput = await this.bertLayerInference(inputs);
        const x = tf.tensor2d(
            bertOutput,
            [inputs.length, this.inputSize ],
            "int32"
        );

        const labels = inputs.map((input) => input.labels);
        const y = tf.tensor2d(labels, [inputs.length, 1], "int32");

        const model = this.createClassificationLayer();
        const history = await model.fit(x, y, {
            batchSize,
            epochs: 10,
            verbose: 1,
        });
        console.log(
            `Trained with accuracy of: ${
                history.history.acc[history.history.acc.length - 1]
            }`
        );

        this.model = model;
    }

    async predict(inputText) {
        const processedInput = this.batchPreprocess(inputText);
        const predictions = await this.batchPredict(processedInput);
        return predictions[0];
    }

    async batchPredict(inputs) {
        const bertOutput = await this.bertLayerInference(inputs);
        const x = tf.tensor2d(
            bertOutput,
            [1, this.inputSize],
            "int32"
        );
        return bertOutput;
    }

    // Get raw results from bert layer
    async bertLayerInference(inputs) {
        const inputIds = inputs.inputIds;
        const segmentIds = inputs.segmentIds;
        const inputMask = inputs.inputMask;
        const rawResult = tf.tidy(() => {
            const tfInputIds = tf.tensor2d(
                inputIds,
                [1, inputIds.length],
                "int32"
            );
            const tfSegmentIds = tf.tensor2d(
                segmentIds,
                [1, segmentIds.length],
                "int32"
            );
            const tfInputMask = tf.tensor2d(
                inputMask,
                [1, inputMask.length],
                "int32"
            );
            return this.bertModel.execute({
                input_ids: tfInputIds,
                token_type_ids: tfSegmentIds,
                attention_mask: tfInputMask,
            });
        });
        const bertOutput = await rawResult.array();
        rawResult.dispose();
        return bertOutput;
    }

    // Add the classification layer
    createClassificationLayer() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.inputSize],
                    units: 1,
                    activation: "sigmoid",
                }),
            ],
        });

        model.compile({
            optimizer: tf.train.adam(0.0001),
            loss: "binaryCrossentropy",
            metrics: ["accuracy"],
        });

        return model;
    }

    // Load converted bert model
    async loadBertModel() {
        try {
            console.log("Loading model...");
            this.bertModel = await tf.loadGraphModel(this.url);
            console.log("Model loaded");
        } catch (e) {
            console.error('Model yüklenirken hata: ', e);
            throw e;
        }
    }

    // Load tokenizer for bert input
    async loadTokenizer() {
        try {
            console.log("Loading tokenizer...");
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

            this.tokenizer = new BertTokenizer(tokenizerData, specialTokensMap, tokenizerConfig, vocab);
            console.log("Tokenizer loaded");
        } catch (e) {
            console.error('Tokenizer yüklenirken hata: ', e);
            throw e;
        }
    }
}


class BertInput {
    constructor(inputIds, token_type_ids, attention_mask) {
        this.input_ids = inputIds;
        this.token_type_ids = token_type_ids;
        this.attention_mask = attention_mask;
        
    }
}

export { BertModel, BertInput };
