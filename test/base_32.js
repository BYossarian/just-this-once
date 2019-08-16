
/* eslint-env mocha */

'use strict';

// test data:
const INVALID_BASE32_STRINGS = [ 'abcdabdcd', '1dfecjsh', 'sdncej!j', 'asdasddedor=====', 'iuoiun&^c33ff', 0, null, {}, [], () => {} ];
const BASE32_TO_HEX = {
    '': '',
    'ufsgy43e': 'a1646c7364',
    'onqwizq=': '73616466',
    'eqwwy===': '242d6c',
    'fb2a====': '2874',
    '5u======': 'ed',
    'kuvs2ll6mavd6===': '552b2d2d7e602a3f',
    'hmucwpkmkpbkgtl5': '3b282b3d4c53c2a34d7d',
    'ykruk6dteexcyzdxo7bkgndsoq2q====': 'c2a3457873212e2c647777c2a334727435',
    'vcxwy4deyo7ttwnzzr5bbmx2hsld235eg33s5chrly======': 'a8af6c7064c3bf39d9b9cc7a10b2fa3c963d6fa436f72e88f15e',
    'vcxwy4deyo7ttwnzzr5bbmx2hsld235eg33s5chrl2uk63dqmtb36oozxhghuefs7i6jmplpuq3polui6fpkrl3mobsmhpzz3g44y6qqwl5dzfr5n6sdn5zordyv4===': 'a8af6c7064c3bf39d9b9cc7a10b2fa3c963d6fa436f72e88f15ea8af6c7064c3bf39d9b9cc7a10b2fa3c963d6fa436f72e88f15ea8af6c7064c3bf39d9b9cc7a10b2fa3c963d6fa436f72e88f15e'
};

const expect = require('chai').expect;

const { base32ToBuffer } = require('../lib/base_32.js');


describe('base32ToBuffer', function() {

    it('converts base32 strings into Buffers', function() {

        Object.keys(BASE32_TO_HEX).forEach((base32String) => {

            const hexString = BASE32_TO_HEX[base32String];

            expect(base32ToBuffer(base32String).toString('hex')).to.equal(hexString);

        });

    });

    it('throws an error when given invalid base32 strings', function() {

        expect(base32ToBuffer.bind(null)).to.throw('Invalid base32 string passed to base32ToBuffer.');

        INVALID_BASE32_STRINGS.forEach((invalidBase32String) => {

            expect(base32ToBuffer.bind(null, invalidBase32String)).to.throw('Invalid base32 string passed to base32ToBuffer.');

        });

    });

});
