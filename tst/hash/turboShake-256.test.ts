import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { TurboShake256 } from '../../src/hash/TurboShake';

const tsts = suite('TurboShake (256)');

const tests:{
    data:Uint8Array,
    size:number,
    domainSep?:number,
    expect:string
}[]=[
    //https://www.ietf.org/archive/id/draft-irtf-cfrg-kangarootwelve-10.html#name-test-vectors
    {
        data:new Uint8Array(0),
        size:64,
        domainSep:7,
        expect:'4A555B06ECF8F1538CCF5C9515D0D04970181563A62381C7F0C807A6D1BD9E8197804BFDE2428BF72961EB52B4189C391CEF6FEE663A3C1CE78B88255BC1ACC3'
    },
    {
        data:hex.toBytes('000102030405060708090A0B0C0D0E0F10'),
        size:64,
        domainSep:0x07,
        expect:'66D378DFE4E902AC4EB78F7C2E5A14F02BC1C849E621BAE665796FB3346E6C7975705BB93C00F3CA8F83BCA479F06977AB3A60F39796B136538AAAE8BCAC8544'
    },
    {
        data:hex.toBytes('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FA000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425'),
        size:64,
        domainSep:0x07,
        expect:'C52174ABF28295E15DFB37B946AC36BD3A6BCC98C074FC25199E0530425CC5EDD4DFD43DC3E7E6491A13179830C3C750C9237E83FD9A3FEC4603FF57E4222EF2'
    },
    // //TurboSHAKE128(M=ptn(17**3 bytes), D=`07`, 32):
    // //TurboSHAKE128(M=ptn(17**4 bytes), D=`07`, 32):
    // //TurboSHAKE128(M=ptn(17**5 bytes), D=`07`, 32):
    // //TurboSHAKE128(M=ptn(17**6 bytes), D=`07`, 32):
    {
        data:new Uint8Array(0),
        size:64,
        domainSep:0x0b,
        expect:'C749F7FB23644A021D35653D1BFDF747CECE5F9739F9A344AD169F10906C6817C8EE12784E42FF57814EFC1C898789D5E415DB49052EA43A09901D7A82A2145C'
    },
    {
        data:new Uint8Array(0),
        size:64,
        domainSep:6,
        expect:'FF23DCCD62168F5A44465249A86DC10E8AAB4BD26A22DEBF2348020A831CDBE12CDD36A7DDD31E71C01F7C97A0D4C3A0CC1B2121E6B7CEAB3887A4C9A5AF8B03'
    },
    {
        data:hex.toBytes('FF'),
        size:64,
        domainSep:6,
        expect:'738D7B4E37D18B7F22AD1B5313E357E3DD7D07056A26A303C433FA3533455280F4F5A7D4F700EFB437FE6D281405E07BE32A0A972E22E63ADC1B090DAEFE004B'
    },
    {
        data:hex.toBytes('FFFFFF'),
        size:64,
        domainSep:6,
        expect:'E5538CDD28302A2E81E41F65FD2A4052014D0CD463DF671D1E510A9D95C37D7135EF2728430A9E317004F836C9A238EF35370280D03DCE7F0612F0315B3CBF63'
    },
    {
        data:hex.toBytes('FFFFFFFFFFFFFF'),
        size:64,
        domainSep:6,
        expect:'B38B8C15F4A6E80CD3EC645F999F6498AAD7A59A489C1DEE29708B4F8A59E12499A96F89372256FE522B1B97472ADD736915BD4DF93B21FFE597217EB3C2C6D9'
    },
];


let count=0;
for (const test of tests) {
    tsts(`TurboShake[${count++}]`,()=>{
		const hash=new TurboShake256(test.size,test.domainSep);
		hash.write(test.data);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), test.expect);
	});
}

tsts(`TurboShake256(size=10032):last32`,()=>{
    const hash=new TurboShake256(10032,7);
    hash.write(new Uint8Array(0));
    const md=hash.sum();
    assert.is(hex.fromBytes(md.subarray(md.length-32)), '40221AD734F3EDC1B106BAD50A72949315B352BA39AD98B5B3C2301163ADAAD0');
})

tsts.run();
