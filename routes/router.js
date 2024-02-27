import express from 'express';
const router = express.Router();

router.get('/users', (req, res, next) => {
    res.send('This is the secret content. Only logged in users can see that!');
});

export default router;