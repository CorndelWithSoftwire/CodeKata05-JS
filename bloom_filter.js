const assert = require("assert");
const crypto = require('crypto');

class Bitmap {
    static getPositionAndOffset(key) {
        const position = Math.floor(key / 8);
        const offset = key % 8;

        return [position, offset];
    }

    constructor(length) {
        this.length = length;
        // You could substitute Uint8Array for Array, and the solution will still work, but Uint8Array is faster.
        this.underlyingArray = new Uint8Array(Math.ceil(length / 8));
    }

    set(key) {
        assert(key < this.length);
        const [position, offset] = Bitmap.getPositionAndOffset(key);
        this.underlyingArray[position] = this.underlyingArray[position] | (1 << offset);
    }

    get(key) {
        assert(key < this.length);
        const [position, offset] = Bitmap.getPositionAndOffset(key);
        return (this.underlyingArray[position] & (1 << offset)) !== 0;
    }

    density() {
        let total = 0;
        this.underlyingArray.forEach(elem => {
            for (let i = 0; i < 8; i++) {
                total += (elem >> i) & 0x1;
            }
        });
        return total / this.length;
    }
}

function getHashes(word, hashCount, hashLength) {
    const longHash = crypto.createHash('md5').update(word).digest();

    const shortHashes = [];
    let workingHash = 0;
    let workingHashLength = 0;

    for (let hashByte of longHash) {
        workingHash = (workingHash << 8);
        workingHash = (workingHash | hashByte);
        workingHashLength += 8;

        if (workingHashLength >= hashLength) {
            shortHashes.push(workingHash >>> (workingHashLength - hashLength));

            if (shortHashes.length >= hashCount) {
                break;
            }

            workingHash = 0;
            workingHashLength = 0;
        }
    }

    if (shortHashes.length < hashCount) {
        throw new Error("Unable to generate enough hashes for word");
    }

    return shortHashes;
}

class BloomFilter {
    constructor(hashLength, hashCount, words) {
        this.hashLength = hashLength;
        this.hashCount = hashCount;

        this.bitmap = new Bitmap(Math.pow(2, hashLength));

        words.forEach(word =>
            getHashes(word, this.hashCount, this.hashLength)
                .forEach(hash => this.bitmap.set(hash)));
    }

    checkWord(word) {
        return getHashes(word, this.hashCount, this.hashLength)
            .every(hash => this.bitmap.get(hash));
    }

    density() {
        return this.bitmap.density();
    }
}

module.exports = {BloomFilter, Bitmap};
