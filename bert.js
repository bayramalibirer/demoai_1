import * as tf from "@tensorflow/tfjs-node";
import fs from 'fs';
import { BertTokenizer} from "@xenova/transformers";


export default class BertModel {
    constructor(inputSize) {
        this.inputSize = inputSize;
        
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

    batchPreprocess(inputExamples, inputLabels) {
        const validInputExamples = inputExamples.filter(input => typeof input === 'string' && input !== undefined);
    
        const tokenizedInputs = validInputExamples.map((input) =>
            this.tokenizer.encode(input, this.inputSize)
        );
    
        const bertInputs = tokenizedInputs.map(
            (tokenized, index) => {
                const bertInput = {
                    inputIds: tokenized.inputIds,
                    inputMask: tokenized.inputMask,
                    segmentIds: tokenized.segmentIds,
                    labels: inputLabels?.[index],
                };
                return bertInput;
            }
        );
    
        return bertInputs;
    }

    async train(inputs, batchSize = 32) {
        console.log("Start training...");

        const bertOutput = await this.bertLayerInference(inputs);
        const x = tf.tensor2d(
            bertOutput,
            [inputs.length, this.inputSize * this.inputSize],
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
        const processedInput = this.preprocess(inputText);
        const predictions = await this.batchPredict([processedInput]);
        return predictions[0];
    }

    async batchPredict(inputs) {
        const bertOutput = await this.bertLayerInference(inputs);
        const x = tf.tensor2d(
            bertOutput,
            [inputs.length, this.inputSize * this.inputSize],
            "int32"
        );

        const predTensor = this.model.predict(x);
        const predictions = await predTensor.array();
        return predictions;
    }

    async bertLayerInference(inputs) {
        const batchSize = inputs.length;
        const inputIds = inputs.map((value) => {
            if (value && value.inputIds) {
                console.log(value.inputIds);
                return value.inputIds;
            } else {
                console.log(value.inputIds);

                throw new Error('Invalid input: missing inputIds');
            }
        });
        const segmentIds = inputs.map((value) => value.segmentIds);
        const inputMask = inputs.map((value) => value.inputMask);

        const rawResult = tf.tidy(() => {
            const tfInputIds = tf.tensor2d(
                inputIds,
                [batchSize, this.inputSize],
                "int32"
            );
            const tfSegmentIds = tf.tensor2d(
                segmentIds,
                [batchSize, this.inputSize],
                "int32"
            );
            const tfInputMask = tf.tensor2d(
                inputMask,
                [batchSize, this.inputSize],
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

    createClassificationLayer() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.inputSize * this.inputSize],
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

    async loadBertModel() {
        const modelPath = 'models/tfjs_model/model.json'; // Modelin dosya yolunu doğru bir şekilde belirtin
        this.bertModel = await tf.loadGraphModel(tf.io.fileSystem(modelPath));
        //console.log(model);
        console.log("model yüklendi");


    }

    async loadTokenizer() {
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

        //console.log(tokenizer);
        console.log("tokenizer yüklendi");
       
    }
}


