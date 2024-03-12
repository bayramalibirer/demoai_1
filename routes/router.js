import express from 'express';
import MyClassificationPipeline from '../MyClassificationPipeline.js';
import {BertModel,BertInput} from '../bert/model.js';
const router = express.Router();

async function loadModel() {
    const model = new BertModel(128);
    await model.setup();
    return model;
}

async function trainModel() {
    const trainInput=[];
    await model.train(trainInput);
}

async function predictModel(predictInput,model) {
    const result = await model.predict(predictInput);
    return result;
}

const model = await loadModel();
console.log(1);
const result = await predictModel("Yürümeyi severim ve yürümekten keyif alırım",model);
console.log(2);
console.log(result);






router.get('/users', (req, res, next) => {
    res.send('This is the secret content. Only logged in users can see that!');
});

router.post('/model', (req, res, next) => {
    res.send(createres(req.body));//Predict metodundan döndürülen değer gönderilecek
    
});

export default router;