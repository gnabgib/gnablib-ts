import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Speck128_128 } from '../../../src/crypto/sym/Speck128';

const tsts = suite('Speck128/128');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['000102030405060708090A0B0C0D0E0F','206D616465206974206571756976616C','180D575CDFFE60786532787951985DA6'],
    //https://github.com/weidai11/cryptopp/blob/master/TestVectors/speck.txt
    //From Crypto++6 gen
    ['75289E33D18BDFC9C689B29A43CBF3F2','51C16CD9AFAB4F1D326658F89C06C940','C003C0497684789B3A6CCBE8E7F98D9E'],
    ['BBEE81640C2194E06814569B246E7E9A','E8CB363862043F53548FFDF037AB5FB5','914724FF30F732A320240D2336259C98'],
    ['5CFBC43DAB5862A9053C32464EB91A0D','07CE381B1D27A5A47E9296C55BA5EB93','F77DA7F35C455FCED97F1DD14EE15B32'],
    ['1CBC65B1737E70E878ECB98486FC1F01','D25B7EF7EBB2E872C51E40081647230A','3410E3292E3752A1C9BE3730678A64C3'],
    ['E8E210ADF85A987684FB9C987A8FA89E','2C16DB0493F23A1C054271CCE217773B','ECC6DFDA4C35036DD2A43A0BA3B778FA'],
    ['7C2F99004989C8E29A8DED86745C5472','41ACAD710F64CD2016E2D80EB91852E3','AAE11D7BD4EFE2D3B6FE49BA4B54FE68'],
    ['4D5073F3673B3972F4D9F81B92EDC373','6F742232E2F86EB3B7A94304DC42C580','06390114161E73BED7E476302D71DA9E'],
];
for (const [key, plain, enc] of tests) {
	const c = new Speck128_128(hex.toBytes(key));
	tsts(`Speck128/128(${key}).encrypt(${plain})`, () => {
		//Set found equal to plain-source-bytes
		const found = hex.toBytes(plain);
		//Encrypt a block (note the test vectors are all one block)
		c.encryptBlock(found);
		assert.is(hex.fromBytes(found), enc);
	});
	tsts(`Speck128/128(${key}).decrypt(${enc})`, () => {
		//Set found equal to encoded-source-bytes
		const found = hex.toBytes(enc);
		//Decrypt a block (note the test vectors are all one block)
		c.decryptBlock(found);
		assert.is(hex.fromBytes(found), plain);
	});
}

tsts.run();
