import * as tf from'@tensorflow/tfjs-node';
import fs from 'fs';

class MyClassificationPipeline {
  static model = undefined;
  static task = 'sentiment-analysis';
  static instance = null;

  static async getInstance(progress_callback = null, ) {
    this.model =await tf.loadGraphModel(tf.io.fileSystem('./models/tfjs_model/model.json'));
    if (this.instance === null) {
      // Dynamically import the Transformers.js library
      let { pipeline, env } = await import('@xenova/transformers');
  
      // NOTE: Uncomment this to change the cache directory
      env.cacheDir = './.cache';
  
      this.instance = pipeline(this.task, this.model, { progress_callback: typeof progress_callback === 'function' ? progress_callback : null });
    }
  
    return this.instance;
  }
}

export default MyClassificationPipeline;