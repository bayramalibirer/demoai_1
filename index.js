import express from 'express';
const app = express();
import cors from 'cors';
const PORT = process.env.PORT || 3000;
import fs from 'fs';
import  router from './routes/router.js';


async function txt_to_json(){
    fs.readFile('./tokenizer/vocab.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Dosya okunurken bir hata oluştu:', err);
            return;
        }
    
        // Metni boşluklarla veya satır satır ayırarak bir diziye depolayın
        const vocabArray = data.split(/\s+/).filter(word => word.trim() !== '');
    
        // Diziyi bir JSON nesnesine dönüştürün
        const vocabJson = JSON.stringify(vocabArray, null, 4);
    
        // JSON dosyasına yazın
        fs.writeFile('./bert/vocab.json', vocabJson, 'utf8', (err) => {
            if (err) {
                console.error('JSON dosyasına yazılırken bir hata oluştu:', err);
                return;
            }
            console.log('JSON dosyası başarıyla oluşturuldu: vocab.json');
        });
    });
}

app.use(express.json());
app.use(cors());

// add routes

app.use('/api', router);

// run server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));