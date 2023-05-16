import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { CShake128 } from '../../src/hash/CShake';

const tsts = suite('cShake (128)');

const tests:{
    dataHex:string,
    functionName:string,
    customization:string,
    expectHex:string
}[] = [
	//https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/cshake_samples.pdf
    {
        dataHex:'00010203',
        functionName:'',
        customization:'Email Signature',
        expectHex:'C1C36925B6409A04F1B504FCBCA9D82B4017277CB5ED2B2065FC1D3814D5AAF5'
    },
    {
        dataHex:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7',
        functionName:'',
        customization:'Email Signature',
        expectHex:'C5221D50E4F822D96A2E8881A961420F294B7B24FE3D2094BAED2C6524CC166B'
    },
];

for (const test of tests) {
	const b = hex.toBytes(test.dataHex);
	tsts('cShake128:' + test.dataHex, () => {
		const hash=new CShake128(256/8,test.functionName,test.customization);
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), test.expectHex);
	});
}

tsts.run();
