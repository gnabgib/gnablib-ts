import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Threefish256 } from '../../../src/crypto/sym/Threefish';

const tsts = suite('Threefish256');

// prettier-ignore
const tests:[string,string,string,string][]=[
    //https://web.archive.org/web/20190221194501/https://sites.google.com/site/bartoszmalkowski/threefish
    [
        '0000000000000000000000000000000000000000000000000000000000000000',

        '00000000000000000000000000000000',

        '0000000000000000000000000000000000000000000000000000000000000000',

        '84DA2A1F8BEAEE947066AE3E3103F1AD536DB1F4A1192495116B9F3CE6133FD8'],
    [
        '101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F',

        '000102030405060708090A0B0C0D0E0F',

        'FFFEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EFEEEDECEBEAE9E8E7E6E5E4E3E2E1E0',
		
        'E0D091FF0EEA8FDFC98192E62ED80AD59D865D08588DF476657056B5955E97DF'],
];
for (const [key, tweak, plain, enc] of tests) {
	const c = new Threefish256(hex.toBytes(key), hex.toBytes(tweak));
	tsts(`Threefish256(${key},${tweak}).encrypt(${plain})`, () => {
		//Set found equal to plain-source-bytes
		const found = hex.toBytes(plain);
		//Encrypt a block (note the test vectors are all one block)
		c.encryptBlock(found);
		assert.is(hex.fromBytes(found), enc);
	});
	tsts(`Threefish256(${key},${tweak}).decrypt(${enc})`, () => {
		//Set found equal to encoded-source-bytes
		const found = hex.toBytes(enc);
		//Decrypt a block (note the test vectors are all one block)
		c.decryptBlock(found);
		assert.is(hex.fromBytes(found), plain);
	});
}

tsts.run();
