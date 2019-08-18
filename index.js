
'use strict';

// DEFAULTS are based on Google Authenticator
const DEFAULTS = {
    codeLength: 6,
    hashFunction: 'sha1',
    startTime: 0,
    timeStep: 30000,
    encoding: 'base32'
};
// according to the spec HOTP uses SHA1, whilst TOTP can also use 
// SHA256 and SHA512. The HOTP restriction that it use SHA1 is 
// enforced in generateHOTP.
const ALLOWED_HASH_FUNCTIONS = new Set([ 'sha1', 'sha256', 'sha512' ]);

const crypto = require('crypto');

const { bufferToBase32, base32ToBuffer } = require('./lib/base_32.js');

function _calcDigestBuffer(secret, counter, hashFunction) {

    // HOTP/TOTP uses an 8 byte (= 16 hex chars) int for it's counter so need to pad 
    // with 0s (this shouldn't ever truncate counterInt/counterHexString since any 
    // values that would get truncated have already been rejected by Number.isSafeInteger() 
    // in _generateOTP) to get an 8-byte Buffer:
    const counterHexString = ('0000000000000000' + counter.toString(16)).slice(-16);

    return crypto.createHmac(hashFunction, secret)
                    .update(Buffer.from(counterHexString, 'hex'))
                    .digest();

}

function _generateOTP(secret, counter, hashFunction, codeLength) {

    // since this is being used for security, we want to be strict 
    // about what we accept so as to avoid unintended consequences 
    // and/or attack vectors, so let's validate everything strictly:
    if (!Buffer.isBuffer(secret)) {
        throw new Error('secret should be a Buffer.');
    }

    // spec requires a secret of at least 128 bits:
    if (secret.length < 16) {
        throw new Error('secret should be at least 128 bits.');
    }

    // isSafeInteger checks that the value is a Number, has an integer 
    // value, and is between Number.MIN_SAFE_INTEGER and Number.MAX_SAFE_INTEGER
    // NB: this means we don't fully conform to the HOTP spec, since that requires 
    // us to be able to handle 8-bytes ints for the counter, which is larger than 
    // Number.MAX_SAFE_INTEGER.
    if (!Number.isSafeInteger(counter) || counter < 0) {
        throw new Error('counter should be a safe, positive integer.');
    }

    if (!ALLOWED_HASH_FUNCTIONS.has(hashFunction)) {
        throw new Error('hashFunction must be one of [ \'sha1\', \'sha256\', \'sha512\' ].');
    }

    // the spec requires a codeLength of at least 6:
    if (!Number.isSafeInteger(codeLength) || codeLength < 6) {
        throw new Error('codeLength should be a safe, positive integer that is a minimum of 6.');
    }

    // so we calculate a HMAC-SHA1 digest using the counter 
    // and secret, and take the last 4 bits as an offset. We then 
    // truncate the digest to 4 bytes starting at offset:
    const digestBuffer = _calcDigestBuffer(secret, counter, hashFunction);
    const offset = digestBuffer[digestBuffer.length - 1] & 0xf;
    let truncatedDigest = digestBuffer.readUIntBE(offset, 4);

    // next, we set most signifcant bit to zero:
    truncatedDigest = truncatedDigest & 0x7fffffff;

    // then, convert to required number of digits using modulo, and 
    // cast to a string:
    truncatedDigest = (truncatedDigest % Math.pow(10, codeLength)).toString();

    // and finally, pad with zeros if required, and return:
    return '0'.repeat(codeLength - truncatedDigest.length) + truncatedDigest;

}

function _decodeSecret(secret, encoding) {

    if (Buffer.isBuffer(secret)) {
        return secret;
    }

    if (!secret || typeof secret !== 'string') {
        throw new Error('secret should be a string, or a Buffer object.');
    }

    let buffer = null;

    if (encoding === 'base32') {
        buffer = base32ToBuffer(secret);
    } else if (encoding === 'urlsafe-base64') {
        // convert urlsafe-base64 string to base64 string, and then get Buffer:
        secret = secret.replace(/-/g, '+').replace(/_/g, '/');
        buffer = Buffer.from(secret, 'base64');
    } else {
        buffer = Buffer.from(secret, encoding || 'ascii');
    }

    return buffer;

}

// https://tools.ietf.org/html/rfc4226#section-5
function generateHOTP(secret, counter, options) {

    options = options || {};

    const secretBuffer = _decodeSecret(secret, options.encoding || DEFAULTS.encoding);

    // per the spec HOTP codes have to use HMAC-SHA1:
    return _generateOTP(secretBuffer, counter, 'sha1', options.codeLength || DEFAULTS.codeLength);

}

// https://tools.ietf.org/html/rfc6238#section-4
function generateTOTP(secret, time, options) {

    options = options || {};

    const secretBuffer = _decodeSecret(secret, options.encoding || DEFAULTS.encoding);
    const timeCounter = Math.floor((time - (options.startTime || DEFAULTS.startTime)) / (options.timeStep || DEFAULTS.timeStep));

    return _generateOTP(secretBuffer, timeCounter, options.hashFunction || DEFAULTS.hashFunction, options.codeLength || DEFAULTS.codeLength);

}

function verifyHOTP(candidate, secret, counter, options) {

    if (!candidate) {
        return false;
    }

    return candidate === generateHOTP(secret, counter, options);

}

function verifyTOTP(candidate, secret, time, options) {

    if (!candidate) {
        return false;
    }

    options = options || {};

    const secretBuffer = _decodeSecret(secret, options.encoding || DEFAULTS.encoding);
    const timeCounter = Math.floor((time - (options.startTime || DEFAULTS.startTime)) / (options.timeStep || DEFAULTS.timeStep));
    const hashFunction = options.hashFunction || DEFAULTS.hashFunction;
    const codeLength = options.codeLength || DEFAULTS.codeLength;

    // due to the possibility of the server clock and client clock being out of
    // sync, it's standard to accept codes that are +/- one timeStep (effectively
    // this means that TOTP codes are valid for 3 * timeStep):
    if (candidate === _generateOTP(secretBuffer, timeCounter, hashFunction, codeLength)) {
        return true;
    } else if (candidate === _generateOTP(secretBuffer, timeCounter + 1, hashFunction, codeLength)) {
        return true;
    }

    return candidate === _generateOTP(secretBuffer, timeCounter - 1, hashFunction, codeLength);

}

function generateSecret(numBytes, encoding = 'base32') {

    return new Promise((resolve, reject) => {

        crypto.randomBytes(numBytes, (err, buffer) => {
            
            if (err) { return reject(err); }
        
            if (encoding === 'base32') {
                resolve(bufferToBase32(buffer));
            } else if (encoding === 'urlsafe-base64') {
                const base64String = buffer.toString('base64').toLowerCase();
                resolve(base64String.replace(/\+/g, '-').replace(/\//g, '_'));
            } else {
                resolve(buffer.toString(encoding).toLowerCase());
            }

        });

    });

}

module.exports = {
    generateHOTP,
    generateTOTP,
    verifyHOTP,
    verifyTOTP,
    generateSecret
};
