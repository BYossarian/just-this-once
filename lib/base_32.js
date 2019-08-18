 
// ref: https://tools.ietf.org/html/rfc3548#section-5

'use strict';

const BASE32_TO_INT = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, i: 8, j: 9, k: 10, 
                        l: 11, m: 12, n: 13, o: 14, p: 15, q: 16, r: 17, s: 18, t: 19, u: 20, 
                        v: 21, w: 22, x: 23, y: 24, z: 25, '2': 26, '3': 27, '4': 28, '5': 29, '6': 30, '7': 31 };
const INT_TO_BASE32 = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
                        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 
                        '2', '3', '4', '5', '6', '7' ];


function bufferToBase32(buffer) {

    if (!Buffer.isBuffer(buffer)) {
        throw new Error('bufferToBase32 requires a Buffer as input.');
    }

    const characterArray = [];
    let upperTwentyBitInt = 0;
    let lowerTwentyBitInt = 0;
    let mask = 0;
    let characterArrayIndex = 0;
    let bitsToShift = 0;
    let numPadding = 0;

    // base32 takes groups of 40 bits (5 bytes) and maps them each to 
    // groups of 8 characters, with each character representing 5 bits.
    // therefore, start by iterating over the 40-bit groups of buffer:
    for (let i = 0, l = buffer.length; i < l; i = i + 5) {

        // since base32 works in groups of 40-bits/8-characters, and buffers will be 
        // multiples of 8-bits, there's obviously the possibility that the input buffer 
        // can't be split evenly into 40-bit groups. in that case, pad bits with 0s on 
        // the right to make a whole number of 5-bit groups (since base32 uses 5-bit 
        // characters), and then pad with '=' on the right to make up a complete 
        // 40-bit/8 character group.
        // e.g. 4-byte buffer = 32-bits. padding with 0s to get 35-bits, to make 7 
        // (5-bit) base32 characters, and then pad the characters with '=' to make a 
        // complete 8-character group.
        // here, we'll use the fact that the operands of bitwise operators will be cast 
        // to ints with (undefined) mapping to 0. therefore, the last group of bits in 
        // buffer will automatically be padded with 0s to make up a whole 40-bit group.
        // we'll then add in the '=' padding after.

        // JS bitshift operators are only well defined when shifting less than 
        // 32 bits, therefore going to split 40-bit group into lower and upper parts:
        upperTwentyBitInt = (buffer[i] << 12) | (buffer[i + 1] << 4) | ((buffer[i + 2] & 0xf0) >> 4);
        lowerTwentyBitInt = ((buffer[i + 2] & 0x0f) << 16) | (buffer[i + 3] << 8) | (buffer[i + 4]);

        // now split 40-bit group into 5-bit ints and map to base32 character.
        // start with bitmask for top 5 bits:
        mask = 0xf8000;

        // iterate over the 4 5-bit groups in upperTwentyBitInt and lowerTwentyBitInt:
        for (let j = 0; j < 4; j++) {

            characterArrayIndex = (i * 8) + j;
            bitsToShift = 15 - (j * 5);

            // grab the appropriate 5 bits from upperTwentyBitInt and lowerTwentyBitInt using a combination 
            // of mask and shifting, then map to the appropriate character:
            characterArray[characterArrayIndex] = INT_TO_BASE32[(upperTwentyBitInt & mask) >> bitsToShift];
            characterArray[characterArrayIndex + 4] = INT_TO_BASE32[(lowerTwentyBitInt & mask) >> bitsToShift];

            // shift mask to next 5-bit group
            mask = mask >> 5;

        }

    }

    // now add in any required character padding
    // (buffer.length * 8) % 40 is the number of bits in the last group
    // so Math.ceil(((buffer.length * 8) % 40) / 5) is the number of 
    // 5-bit characters in the last group (rememebering that we pad the bits
    // with 0 to make a whole number of 5-bit characters) so:
    numPadding = (8 - Math.ceil(((buffer.length * 8) % 40) / 5)) % 8;

    while (numPadding > 0) {
        characterArray[characterArray.length - numPadding] = '=';
        numPadding--;
    }

    return characterArray.join('');

}

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
    bufferToBase32,
    base32ToBuffer
};
