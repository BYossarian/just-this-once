 
// ref: https://tools.ietf.org/html/rfc3548#section-5

'use strict';

const BASE32_TO_INT = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, i: 8, j: 9, k: 10, 
                        l: 11, m: 12, n: 13, o: 14, p: 15, q: 16, r: 17, s: 18, t: 19, u: 20, 
                        v: 21, w: 22, x: 23, y: 24, z: 25, '2': 26, '3': 27, '4': 28, '5': 29, '6': 30, '7': 31 };

function base32ToBuffer(base32String) {

    if (typeof base32String !== 'string') {
        throw new Error('Invalid base32 string passed to base32ToBuffer.');
    }

    // base32 strings should have a length that is a multiple of 8
    if (base32String.length % 8 !== 0) {
        throw new Error('Invalid base32 string passed to base32ToBuffer.');
    }

    // this will test for the correct amount of padding, and that the 
    // remaining characters are from the base32 alphabet. that there are
    // the right number of base32 characters will work out as a consequence
    // of checking the padding and the string length:
    // NB: the character padding at the end can only be either 1, 3, 4, or 6 (see spec for reasoning):
    if (!/^[a-z2-7]*(?:=|={3}|={4}|={6})?$/i.test(base32String)) {
        throw new Error('Invalid base32 string passed to base32ToBuffer.');
    }

    // remove character padding, and convert to lower case:
    base32String = base32String.replace(/=*$/, '').toLowerCase();

    const numBytes = Math.floor((base32String.length * 5) / 8);
    const buffer = Buffer.alloc(numBytes);
    let char = '';
    let charValue = 0;
    let bitsAsInt = 0;
    let bitsInInt = 0;
    let bufferIndex = 0;

    for (let i = 0, l = base32String.length; i < l; i++) {

        // get the current character and it's decoded base32 value:
        char = base32String[i];
        charValue = BASE32_TO_INT[char];

        // sanity check:
        if (typeof charValue !== 'number') {
            throw new Error(`Invalid character in base32 string: ${char}`);
        }

        // build bitsAsInt by merging the current base32 character value:
        bitsAsInt = (bitsAsInt << 5) | charValue;
        bitsInInt += 5;

        // since JS bitshift can't handle numbers bigger than 32-bits
        // we need to consume the bits as soon as we have whole bytes:
        // (doing this also automatically takes care of ignoring the 
        // 0s added as padding as part of the base32 encoding process)
        while (bitsInInt > 7) {
            // we're going to consume a byte so:
            bitsInInt -= 8;
            // put highest 8-bits into buffer
            buffer[bufferIndex] = bitsAsInt >> bitsInInt;
            bufferIndex++;
            // discard highest 8-bits
            bitsAsInt = bitsAsInt & (~(0xff << bitsInInt));
        }

    }

    return buffer;

}

module.exports = {
    base32ToBuffer
};
