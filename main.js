const fs = require("fs");
const {BloomFilter} = require('./bloom_filter');

const wordList = fs.readFileSync('wordlist.txt', 'utf8').toString().split("\n");

function printTableRow(elems) {
    console.log(elems.map(s => s.toString().padEnd(15)).join(" | "));
}

function testBloomFilter(hashCount, hashLength) {
    function randomWord() {
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        return Array.from(new Array(5), i => alphabet.charAt(Math.floor(Math.random() * alphabet.length))).join('');
    }

    function runTest(filter, wordList) {
        let validWords = 0;
        let falsePositives = 0;
        let totalWords = 5000;

        for (let possibleWord of Array.from(new Array(totalWords), i => randomWord())) {
            if (filter.checkWord(possibleWord)) {
                if (wordList.includes(possibleWord)) {
                    validWords++;
                }
                else {
                    falsePositives++;
                }
            } else if (wordList.includes(possibleWord)) {
                throw new Error("Bloom Filter missed a match! " + possibleWord);
            }
        }
        return {validWords, falsePositives, totalWords};
    }

    const filter = new BloomFilter(hashLength, hashCount, wordList);
    const {validWords, falsePositives, totalWords} = runTest(filter, wordList);
    printTableRow([hashLength, hashCount, filter.density().toFixed(3), falsePositives, `${validWords} / ${totalWords}`]);
}


printTableRow(["HashLength", "Hash Count", "Density", "False +ves", "Valid Words"]);

testBloomFilter(1, 26);

// We will run into issues with twos complement if we try and use hashLengths over 2^30 as all bit shift operators use
// signed 32 bit integers.
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
for (let hashLength = 16; hashLength < 31; hashLength += 2) {
    // MD5 hash is 128 bits
    for (let hashCount = 1; hashCount < 128 / (8 * Math.ceil(hashLength / 8.0)); hashCount += 2) {
        testBloomFilter(hashCount, hashLength);
    }
}
