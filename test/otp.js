
/* eslint-env mocha */

'use strict';

// test data taken from https://tools.ietf.org/html/rfc4226#appendix-D
const HOTP_TEST_DATA = {
    SECRET: Buffer.from('3132333435363738393031323334353637383930', 'hex'),
    CODES: [ '755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489' ],
    INCORRECT_CODES: [ '', '28708', 'sdfsdd', 'sdf3f3', '123456', '287082', '254676', 'nooooooooooooope' ]
};
// test data taken from https://tools.ietf.org/html/rfc6238#appendix-B
const TOTP_TEST_DATA = {
    SECRETS: {
        'sha1': Buffer.from('3132333435363738393031323334353637383930', 'hex'),
        'sha256': Buffer.from('3132333435363738393031323334353637383930313233343536373839303132', 'hex'),
        'sha512': Buffer.from('31323334353637383930313233343536373839303132333435363738393031323334353637383930313233343536373839303132333435363738393031323334', 'hex')
    },
    CODE_LENGTH: 8,
    DATA: [
        { TIME_IN_SECS: 59, CODE: '94287082', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 59, CODE: '46119246', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 59, CODE: '90693936', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 1111111109, CODE: '07081804', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 1111111109, CODE: '68084774', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 1111111109, CODE: '25091201', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 1111111111, CODE: '14050471', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 1111111111, CODE: '67062674', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 1111111111, CODE: '99943326', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 1234567890, CODE: '89005924', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 1234567890, CODE: '91819424', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 1234567890, CODE: '93441116', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 2000000000, CODE: '69279037', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 2000000000, CODE: '90698825', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 2000000000, CODE: '38618901', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 20000000000, CODE: '65353130', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 20000000000, CODE: '77737706', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 20000000000, CODE: '47863826', HASH_FUNCTION: 'sha512' }
    ],
    INCORRECT_PASSCODES_DATA: [
        { TIME_IN_SECS: 59, CODE: '', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 59, CODE: '', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 59, CODE: '', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 1111111109, CODE: '0781804', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 1111111109, CODE: '6084774', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 1111111109, CODE: '5091201', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 1111111111, CODE: '140450471', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 1111111111, CODE: '670652674', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 1111111111, CODE: '999437326', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 1234567890, CODE: '89125924', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 1234567890, CODE: '91129424', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 1234567890, CODE: '93121116', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 2000000000, CODE: '69df9037', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 2000000000, CODE: '90df8825', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 2000000000, CODE: '38df8901', HASH_FUNCTION: 'sha512' },
        { TIME_IN_SECS: 20000000000, CODE: '653fdgs3fd353130', HASH_FUNCTION: 'sha1' },
        { TIME_IN_SECS: 20000000000, CODE: '777erfew337706', HASH_FUNCTION: 'sha256' },
        { TIME_IN_SECS: 20000000000, CODE: '478fewerwf32qf63826', HASH_FUNCTION: 'sha512' }
    ]
};
// additional test data:
const TOTP_TIMESTEP_DATA = {
    SECRET: Buffer.from('31323334353637f83930313233e4353637383930', 'hex'),
    CODE: '358636',
    TIME_IN_MILLISECS: 59000,
    TIMESTEP_IN_MILLISECS: 30000
};
const ENCODINGS_TEST_DATA = {
    SECRETS: {
        buffer: Buffer.from('31323334353637f83930313233e4353637383930', 'hex'),
        hex: '31323334353637f83930313233e4353637383930',
        base32: 'gezdgnbvgy37qojqgezdhzbvgy3tqojq',
        base64: 'MTIzNDU2N/g5MDEyM+Q1Njc4OTA=',
        'urlsafe-base64': 'MTIzNDU2N_g5MDEyM-Q1Njc4OTA='
    },
    COUNTER: 1,
    TIME_IN_SECS: 59,
    CODE: '358636'
};
const MALFORMED_SECRETS = {
    hex: 'zqw',
    base32: '089',
    base64: '+((',
    'urlsafe-base64': 'MTIzNDU2N/g5MDEyM+Q1Njc4OTA='  // <- this is base64; not urlsafe-base64
};


const expect = require('chai').expect;

const { generateHOTP, generateTOTP, verifyHOTP, verifyTOTP, generateSecret } = require('../index.js');


describe('generateHOTP', function() {

    it('generates HOTP codes', function() {

        HOTP_TEST_DATA.CODES.forEach((code, i) => {

            expect(generateHOTP(HOTP_TEST_DATA.SECRET, i)).to.equal(code);

        });

    });

    it('accepts the secret in various encodings', function() {

        Object.keys(ENCODINGS_TEST_DATA.SECRETS).forEach((encoding) => {

            const secret = ENCODINGS_TEST_DATA.SECRETS[encoding];

            expect(generateHOTP(secret, ENCODINGS_TEST_DATA.COUNTER, { encoding: encoding })).to.equal(ENCODINGS_TEST_DATA.CODE);

        });

    });

    it('throws when either the secret or the counter is missing', function() {

        expect(generateHOTP.bind(null)).to.throw();

        const secret = ENCODINGS_TEST_DATA.SECRETS.buffer;

        expect(generateHOTP.bind(null, secret)).to.throw();

        // incorrect type for counter
        expect(generateHOTP.bind(null, secret, '')).to.throw();
        expect(generateHOTP.bind(null, secret, NaN)).to.throw();

    });

    it('throws when passed malformed secrets', function() {

        Object.keys(MALFORMED_SECRETS).forEach((encoding) => {

            const secret = MALFORMED_SECRETS[encoding];

            expect(generateHOTP.bind(null, secret, 0, { encoding: encoding })).to.throw();

        });

    });

});

describe('verifyHOTP', function() {

    it('verifies candidate HOTP codes', function() {

        HOTP_TEST_DATA.CODES.forEach((code, i) => {

            expect(verifyHOTP(code, HOTP_TEST_DATA.SECRET, i)).to.equal(true);

        });

        HOTP_TEST_DATA.INCORRECT_CODES.forEach((incorrectCode, i) => {

            expect(verifyHOTP(incorrectCode, HOTP_TEST_DATA.SECRET, i)).to.equal(false);

        });

    });

    it('accepts the secret in various encodings', function() {

        Object.keys(ENCODINGS_TEST_DATA.SECRETS).forEach((encoding) => {

            const secret = ENCODINGS_TEST_DATA.SECRETS[encoding];

            expect(verifyHOTP(ENCODINGS_TEST_DATA.CODE, secret, ENCODINGS_TEST_DATA.COUNTER, { encoding: encoding })).to.equal(true);

        });

    });

    it('returns false if no candidate passcode is passed in', function() {

        expect(verifyHOTP()).to.equal(false);

    });

    it('throws when either the secret or the counter is missing', function() {

        expect(verifyHOTP.bind(null, '123456')).to.throw();

        const secret = ENCODINGS_TEST_DATA.SECRETS.buffer;

        expect(verifyHOTP.bind(null, '123456', secret)).to.throw();

        // incorrect type for counter
        expect(verifyHOTP.bind(null, '123456', secret, '')).to.throw();
        expect(verifyHOTP.bind(null, '123456', secret, NaN)).to.throw();

    });

    it('throws when passed malformed secrets', function() {

        Object.keys(MALFORMED_SECRETS).forEach((encoding) => {

            const secret = MALFORMED_SECRETS[encoding];

            expect(verifyHOTP.bind(null, '123456', secret, 0, { encoding: encoding })).to.throw();

        });

    });

});

describe('generateTOTP', function() {

    it('generates TOTP codes', function() {

        TOTP_TEST_DATA.DATA.forEach((testData) => {

            expect(generateTOTP(TOTP_TEST_DATA.SECRETS[testData.HASH_FUNCTION], testData.TIME_IN_SECS * 1000, {
                hashFunction: testData.HASH_FUNCTION,
                codeLength: TOTP_TEST_DATA.CODE_LENGTH
            })).to.equal(testData.CODE);

        });

    });

    it('accepts the secret in various encodings', function() {

        Object.keys(ENCODINGS_TEST_DATA.SECRETS).forEach((encoding) => {

            const secret = ENCODINGS_TEST_DATA.SECRETS[encoding];

            expect(generateTOTP(secret, ENCODINGS_TEST_DATA.TIME_IN_SECS * 1000, { encoding: encoding })).to.equal(ENCODINGS_TEST_DATA.CODE);

        });

    });

    it('throws when either the secret or the time parameters are missing', function() {

        expect(generateTOTP.bind(null)).to.throw();

        const secret = ENCODINGS_TEST_DATA.SECRETS.buffer;

        expect(generateTOTP.bind(null, secret)).to.throw();

        // incorrect type for time parameter:
        expect(generateTOTP.bind(null, secret, '')).to.throw();
        expect(generateTOTP.bind(null, secret, NaN)).to.throw();
        expect(generateTOTP.bind(null, secret, new Date())).to.throw();

    });

    it('throws when passed malformed secrets', function() {

        Object.keys(MALFORMED_SECRETS).forEach((encoding) => {

            const secret = MALFORMED_SECRETS[encoding];

            expect(generateTOTP.bind(null, secret, 0, { encoding: encoding })).to.throw();

        });

    });

});

describe('verifyTOTP', function() {

    it('verifies candidate TOTP codes', function() {

        TOTP_TEST_DATA.DATA.forEach((testData) => {

            expect(verifyTOTP(testData.CODE, TOTP_TEST_DATA.SECRETS[testData.HASH_FUNCTION], testData.TIME_IN_SECS * 1000, {
                hashFunction: testData.HASH_FUNCTION,
                codeLength: TOTP_TEST_DATA.CODE_LENGTH
            })).to.equal(true);

        });

        TOTP_TEST_DATA.INCORRECT_PASSCODES_DATA.forEach((incorrectData) => {

            expect(verifyTOTP(incorrectData.CODE, TOTP_TEST_DATA.SECRETS[incorrectData.HASH_FUNCTION], incorrectData.TIME_IN_SECS * 1000, {
                hashFunction: incorrectData.HASH_FUNCTION,
                codeLength: TOTP_TEST_DATA.CODE_LENGTH
            })).to.equal(false);

        });

    });

    it('optionally, allows for some leeway in the time interval used to verify', function() {

        const { CODE, SECRET, TIME_IN_MILLISECS, TIMESTEP_IN_MILLISECS } = TOTP_TIMESTEP_DATA;

        expect(verifyTOTP(CODE, SECRET, TIME_IN_MILLISECS, { timeStep: TIMESTEP_IN_MILLISECS })).to.equal(true);

        expect(verifyTOTP(CODE, SECRET, TIME_IN_MILLISECS + TIMESTEP_IN_MILLISECS, { timeStep: TIMESTEP_IN_MILLISECS })).to.equal(true);

        expect(verifyTOTP(CODE, SECRET, TIME_IN_MILLISECS - TIMESTEP_IN_MILLISECS, { timeStep: TIMESTEP_IN_MILLISECS })).to.equal(true);

        // if we now turn the option off, the codes should be rejected:
        expect(verifyTOTP(CODE, SECRET, TIME_IN_MILLISECS + TIMESTEP_IN_MILLISECS, {
            timeStep: TIMESTEP_IN_MILLISECS, 
            verifyWithOneTimeStep: true
        })).to.equal(false);

        expect(verifyTOTP(CODE, SECRET, TIME_IN_MILLISECS + TIMESTEP_IN_MILLISECS, {
            timeStep: TIMESTEP_IN_MILLISECS, 
            verifyWithOneTimeStep: true
        })).to.equal(false);

    });

    it('accepts the secret in various encodings', function() {

        Object.keys(ENCODINGS_TEST_DATA.SECRETS).forEach((encoding) => {

            const secret = ENCODINGS_TEST_DATA.SECRETS[encoding];

            expect(verifyTOTP(ENCODINGS_TEST_DATA.CODE, secret, ENCODINGS_TEST_DATA.TIME_IN_SECS * 1000, { encoding: encoding })).to.equal(true);

        });

    });

    it('returns false if no candidate passcode is passed in', function() {

        expect(verifyTOTP()).to.equal(false);

    });

    it('throws when either the secret or the time parameters are missing', function() {

        expect(verifyTOTP.bind(null, '123456')).to.throw();

        const secret = ENCODINGS_TEST_DATA.SECRETS.buffer;

        expect(verifyTOTP.bind(null, secret)).to.throw();

        // incorrect type for time parameter:
        expect(verifyTOTP.bind(null, '123456', secret, '')).to.throw();
        expect(verifyTOTP.bind(null, '123456', secret, NaN)).to.throw();
        expect(verifyTOTP.bind(null, '123456', secret, new Date())).to.throw();

    });

    it('throws when passed malformed secrets', function() {

        Object.keys(MALFORMED_SECRETS).forEach((encoding) => {

            const secret = MALFORMED_SECRETS[encoding];

            expect(verifyTOTP.bind(null, secret, 0, { encoding: encoding })).to.throw();

        });

    });

});

describe('generateSecret', function() {

    it('generates base32 encoded random strings by default', async function() {

        const [ secretWith32Bytes, secretWith64Bytes, secretWith128Bytes ] 
                    = await Promise.all([32, 64, 128].map((numBytes) => { return generateSecret(numBytes); }));

        expect(secretWith32Bytes).to.match(/^[a-z2-7]{52}={4}$/);
        expect(secretWith64Bytes).to.match(/^[a-z2-7]{103}={1}$/);
        expect(secretWith128Bytes).to.match(/^[a-z2-7]{205}={3}$/);

    });

    it('can also generate secrets in hex, base64, and urlsafe-base64', async function() {

        const [ hexSecret, base64Secret, urlsafeBase64Secret ] 
                    = await Promise.all(['hex', 'base64', 'urlsafe-base64'].map((encoding) => { return generateSecret(64, encoding); }));

        expect(hexSecret).to.match(/^[0-9a-f]{128}$/);
        expect(base64Secret).to.match(/^[a-z0-9+/]{86}={2}$/);
        expect(urlsafeBase64Secret).to.match(/^[a-z0-9\-_]{86}={2}$/);

    });

});
