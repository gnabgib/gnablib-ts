import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { CShake256 } from '../../src/hash/CShake';

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
        expectHex:'D008828E2B80AC9D2218FFEE1D070C48B8E4C87BFF32C9699D5B6896EEE0EDD164020E2BE0560858D9C00C037E34A96937C561A74C412BB4C746469527281C8C'
    },
    {
        dataHex:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7',
        functionName:'',
        customization:'Email Signature',
        expectHex:'07DC27B11E51FBAC75BC7B3C1D983E8B4B85FB1DEFAF218912AC86430273091727F42B17ED1DF63E8EC118F04B23633C1DFB1574C8FB55CB45DA8E25AFB092BB'
    },
];

for (const test of tests) {
	const b = hex.toBytes(test.dataHex);
	tsts('cShake256:' + test.dataHex, () => {
		const hash=new CShake256(512/8,test.functionName,test.customization);
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), test.expectHex);
	});
}

tsts('cShake reset',()=>{
    const hash=new CShake256(512/8,'','Email Signature');
    hash.write(hex.toBytes('00010203'));
    const md1=hash.sum();
	assert.is(hex.fromBytes(md1), 'D008828E2B80AC9D2218FFEE1D070C48B8E4C87BFF32C9699D5B6896EEE0EDD164020E2BE0560858D9C00C037E34A96937C561A74C412BB4C746469527281C8C');
    
    //Continuation
    hash.write(hex.toBytes('0405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7'))
    const md2=hash.sum();
	assert.is(hex.fromBytes(md2), '07DC27B11E51FBAC75BC7B3C1D983E8B4B85FB1DEFAF218912AC86430273091727F42B17ED1DF63E8EC118F04B23633C1DFB1574C8FB55CB45DA8E25AFB092BB','Continuation was successful');
    
    //Reset
    hash.reset();
    hash.write(hex.toBytes('00010203'));
    const md3=hash.sum();
	assert.is(hex.fromBytes(md3), 'D008828E2B80AC9D2218FFEE1D070C48B8E4C87BFF32C9699D5B6896EEE0EDD164020E2BE0560858D9C00C037E34A96937C561A74C412BB4C746469527281C8C','Reset was successful');
    
});

tsts.run();
