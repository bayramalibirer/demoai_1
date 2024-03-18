import express from 'express';
import {BertModel} from '../bert/model.js';

const router = express.Router();

async function loadModel() {
    const model = new BertModel(6);
    await model.setup();
    return model;
}

async function trainModel(model) {
    const trainInput=["iğrenç"];
    await model.train(trainInput);
    return model;
}

async function predictModel(predictInput,model) {
    try {
        const result = await model.predict(predictInput);
        return result;
    } catch (error) {
        console.error('Error during prediction:', error);
        return null;
    }
}
const model = await loadModel();







router.get('/users', (req, res, next) => {
    res.send('This is the secret content. Only logged in users can see that!');
});

router.post('/model', async (req, res, next) => {
    const predictInput = req.body.text.toString()
    const prediction = await predictModel(predictInput, model);
    res.send(prediction);
    
});

export default router;