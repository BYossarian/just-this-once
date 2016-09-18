
'use strict';

const expect = require('chai').expect;

const justThisOnce = require('../index.js');
const generateHOTP = justThisOnce.generateHOTP;
const generateTOTP = justThisOnce.generateTOTP;
const verifyHOTP = justThisOnce.verifyHOTP;
const verifyTOTP = justThisOnce.verifyTOTP;

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
    INCORRECT_DATA: [
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

describe('generateHOTP', function() {

    it('generates HOTP codes', function() {

        HOTP_TEST_DATA.CODES.forEach((code, i) => {

            expect(generateHOTP(HOTP_TEST_DATA.SECRET, i)).to.equal(code);

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

});

describe('verifyTOTP', function() {

    it('verifies candidate TOTP codes', function() {

        TOTP_TEST_DATA.DATA.forEach((testData) => {

            expect(verifyTOTP(testData.CODE, TOTP_TEST_DATA.SECRETS[testData.HASH_FUNCTION], testData.TIME_IN_SECS * 1000, {
                hashFunction: testData.HASH_FUNCTION,
                codeLength: TOTP_TEST_DATA.CODE_LENGTH
            })).to.equal(true);

        });

        TOTP_TEST_DATA.INCORRECT_DATA.forEach((incorrectData) => {

            expect(verifyTOTP(incorrectData.CODE, TOTP_TEST_DATA.SECRETS[incorrectData.HASH_FUNCTION], incorrectData.TIME_IN_SECS * 1000, {
                hashFunction: incorrectData.HASH_FUNCTION,
                codeLength: TOTP_TEST_DATA.CODE_LENGTH
            })).to.equal(false);

        });

    });

});
