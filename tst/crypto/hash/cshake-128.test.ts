import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { CShake128 } from '../../../src/crypto';

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

tsts('cShake reset',()=>{
    const hash=new CShake128(256/8,'','Email Signature');
    hash.write(hex.toBytes('00010203'));
    const md1=hash.sum();
	assert.is(hex.fromBytes(md1), 'C1C36925B6409A04F1B504FCBCA9D82B4017277CB5ED2B2065FC1D3814D5AAF5');
    
    //Continuation
    hash.write(hex.toBytes('0405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7'))
    const md2=hash.sum();
	assert.is(hex.fromBytes(md2), 'C5221D50E4F822D96A2E8881A961420F294B7B24FE3D2094BAED2C6524CC166B','Continuation was successful');
    
    //Reset
    hash.reset();
    hash.write(hex.toBytes('00010203'));
    const md3=hash.sum();
	assert.is(hex.fromBytes(md3), 'C1C36925B6409A04F1B504FCBCA9D82B4017277CB5ED2B2065FC1D3814D5AAF5','Reset was successful'); 
});

tsts(`cShake with giant customization`,()=>{
    //bug #3
    const hash=new CShake128(32,'I am a giant function name for the purposes of testing','AES-CMAC uses the Advanced Encryption Standard [NIST-AES] as a building block.  To generate a MAC, AES-CMAC takes a secret key, a message of variable length, and the length of the message in octets as inputs and returns a fixed-bit string called a MAC');
    hash.write(Uint8Array.of(0,1,2,3));
    const md=hash.sum();
    assert.is(hex.fromBytes(md),'1C33613631E058E96D6A5693B74986A4CB1C6CA72A06CD1238262E7F2E62FA35');
})

tsts(`newEmpty`,()=>{
    const hash=new CShake128(32);
    assert.is(hex.fromBytes(hash.sum()),'7F9C2BA4E88F827D616045507605853ED73B8093F6EFBC88EB1A6EACFA66EF26');
    hash.write(Uint8Array.of(0,1,2,3));
    assert.is(hex.fromBytes(hash.sum()),'0B0CC28E60E37698B411234B1158A5D42636440432A28E8B8DF5BE04208878F9');

    const h2=hash.newEmpty();
    assert.is(hex.fromBytes(h2.sum()),'7F9C2BA4E88F827D616045507605853ED73B8093F6EFBC88EB1A6EACFA66EF26');
});

tsts(`blockSize`,()=>{
    const hash=new CShake128(11);
    assert.is(hash.blockSize,168);
});

tsts.run();
