import * as tf from "@tensorflow/tfjs-node"
import fs from 'fs';
import util from 'util';

/**
 * Source: https://github.com/tensorflow/tfjs-models/blob/master/qna/src/bert_tokenizer.ts
 */


const SEPERATOR = "\u2581";
const UNK_INDEX = 100;
const CLS_INDEX = 101;
const CLS_TOKEN = "[CLS]";
const SEP_INDEX = 102;
const SEP_TOKEN = "[SEP]";
const NFKC_TOKEN = "NFKC";

const readFile = util.promisify(fs.readFile);

class TrieNode {
    constructor(key) {
        this.key = key;
        this.children = {};
        this.end = false;
    }

    getWord() {
        const output = [];
        let node = this;

        while (node != null) {
            if (node.key != null) {
                output.unshift(node.key);
            }
            node = node.parent;
        }

        return [output, this.score, this.index];
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode(null);
    }

    insert(word, score, index) {
        let node = this.root;

        const symbols = [];
        for (const symbol of word) {
            symbols.push(symbol);
        }

        for (let i = 0; i < symbols.length; i++) {
            if (node.children[symbols[i]] == null) {
                node.children[symbols[i]] = new TrieNode(symbols[i]);
                node.children[symbols[i]].parent = node;
            }

            node = node.children[symbols[i]];

            if (i === symbols.length - 1) {
                node.end = true;
                node.score = score;
                node.index = index;
            }
        }
    }

    find(token) {
        let node = this.root;
        let iter = 0;

        while (iter < token.length && node != null) {
            node = node.children[token[iter]];
            iter++;
        }

        return node;
    }
}

function isWhitespace(ch) {
    return /\s/.test(ch);
}

function isInvalid(ch) {
    return ch.charCodeAt(0) === 0 || ch.charCodeAt(0) === 0xfffd;
}

const punctuations = "[~`!@#$%^&*(){}[];:\"'<,.>?/\\|-_+=";

function isPunctuation(ch) {
    return punctuations.indexOf(ch) !== -1;
}

class BertTokenizer {
    constructor() {
        this.vocab = [];
        this.trie = new Trie();
    }

    async load() {
        this.vocab = await this.loadVocab();

        for (
            let vocabIndex = 999;
            vocabIndex < this.vocab.length;
            vocabIndex++
        ) {
            const word = this.vocab[vocabIndex];
            this.trie.insert(word, 1, vocabIndex);
        }
    }

    encodeText(inputText, inputSize) {
        inputText = inputText.toString();
        inputText = inputText.replace(/\?/g, "");
        inputText = inputText.trim();

        const queryTokens = this.tokenize(inputText);

        const tokens = [];
        const segmentIds = [];
        tokens.push(CLS_INDEX);
        segmentIds.push(0);
        for (let i = 0; i < queryTokens.length; i++) {
            const queryToken = queryTokens[i];
            tokens.push(queryToken);
            segmentIds.push(0);
        }
        tokens.push(SEP_INDEX);
        segmentIds.push(0);

        const inputIds = tokens;
        const inputMask = inputIds.map(() => 1);
        while (inputIds.length < inputSize) {
            inputIds.push(0);
            inputMask.push(0);
            segmentIds.push(0);
        }

        return { inputIds, inputMask, segmentIds };
    }

    async loadVocab() {
        const vocabpath="./bert/tokenizer/vocab.json"
        const vocab = await readFile(vocabpath, "utf-8");
        return JSON.parse(vocab);}

    processInput(text) {
        const charOriginalIndex = [];
        const cleanedText = this.cleanText(text, charOriginalIndex);
        const origTokens = cleanedText.split(" ");

        let charCount = 0;
        const tokens = origTokens.map((token) => {
            token = token.toLowerCase();
            const tokens = this.runSplitOnPunc(
                token,
                charCount,
                charOriginalIndex
            );
            charCount += token.length + 1;
            return tokens;
        });

        let flattenTokens = [];
        for (let index = 0; index < tokens.length; index++) {
            flattenTokens = flattenTokens.concat(tokens[index]);
        }
        return flattenTokens;
    }

    cleanText(text, charOriginalIndex) {
        const stringBuilder = [];
        let originalCharIndex = 0,
            newCharIndex = 0;
        for (const ch of text) {
            if (isInvalid(ch)) {
                originalCharIndex += ch.length;
                continue;
            }
            if (isWhitespace(ch)) {
                if (
                    stringBuilder.length > 0 &&
                    stringBuilder[stringBuilder.length - 1] !== " "
                ) {
                    stringBuilder.push(" ");
                    charOriginalIndex[newCharIndex] = originalCharIndex;
                    originalCharIndex += ch.length;
                } else {
                    originalCharIndex += ch.length;
                    continue;
                }
            } else {
                stringBuilder.push(ch);
                charOriginalIndex[newCharIndex] = originalCharIndex;
                originalCharIndex += ch.length;
            }
            newCharIndex++;
        }
        return stringBuilder.join("");
    }

    runSplitOnPunc(text, count, charOriginalIndex) {
        const tokens = [];
        let startNewWord = true;
        for (const ch of text) {
            if (isPunctuation(ch)) {
                tokens.push({ text: ch, index: charOriginalIndex[count] });
                count += ch.length;
                startNewWord = true;
            } else {
                if (startNewWord) {
                    tokens.push({ text: "", index: charOriginalIndex[count] });
                    startNewWord = false;
                }
                tokens[tokens.length - 1].text += ch;
                count += ch.length;
            }
        }
        return tokens;
    }

    tokenize(text) {
        let outputTokens = [];

        const words = this.processInput(text);
        words.forEach((word) => {
            if (word.text !== CLS_TOKEN && word.text !== SEP_TOKEN) {
                word.text = `${SEPERATOR}${word.text.normalize(NFKC_TOKEN)}`;
            }
        });

        for (let i = 0; i < words.length; i++) {
            const chars = [];
            for (const symbol of words[i].text) {
                chars.push(symbol);
            }

            let isUnknown = false;
            let start = 0;
            const subTokens = [];

            const charsLength = chars.length;

            while (start < charsLength) {
                let end = charsLength;
                let currIndex;

                while (start < end) {
                    const substr = chars.slice(start, end).join("");

                    const match = this.trie.find(substr);
                    if (match != null && match.end != null) {
                        currIndex = match.getWord()[2];
                        break;
                    }

                    end = end - 1;
                }

                if (currIndex == null) {
                    isUnknown = true;
                    break;
                }

                subTokens.push(currIndex);
                start = end;
            }

            if (isUnknown) {
                outputTokens.push(UNK_INDEX);
            } else {
                outputTokens = outputTokens.concat(subTokens);
            }
        }

        return outputTokens;
    }
}

export async function loadTokenizer() {
    const tokenizer = new BertTokenizer();
    await tokenizer.load();
    return tokenizer;
}

