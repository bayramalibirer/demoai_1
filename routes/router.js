import express from 'express';
const router = express.Router();

router.get('/users', (req, res, next) => {
    res.send('This is the secret content. Only logged in users can see that!');
});

router.post('/model', (req, res, next) => {
    res.send(req.body);//Predict metodundan döndürülen değer gönderilecek
    
});

export default router;