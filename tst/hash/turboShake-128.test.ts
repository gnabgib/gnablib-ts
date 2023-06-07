import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import { TurboShake128 } from '../../src/hash/TurboShake';

const tsts = suite('TurboShake (128)');

const tests:{
    data:Uint8Array,
    size:number,
    domainSep?:number,
    expect:string
}[]=[
    //https://www.ietf.org/archive/id/draft-irtf-cfrg-kangarootwelve-10.html#name-test-vectors
    {
        data:new Uint8Array(0),
        size:32,
        domainSep:7,
        expect:'5A223AD30B3B8C66A243048CFCED430F54E7529287D15150B973133ADFAC6A2F'
    },
    {
        data:new Uint8Array(0),
        size:64,
        domainSep:0x07,
        expect:'5A223AD30B3B8C66A243048CFCED430F54E7529287D15150B973133ADFAC6A2FFE2708E73061E09A4000168BA9C8CA1813198F7BBED4984B4185F2C2580EE623'
    },
    {
        data:Hex.toBytes('00'),
        size:32,
        domainSep:0x07,
        expect:'1AC2D450FC3B4205D19DA7BFCA1B37513C0803577AC7167F06FE2CE1F0EF39E5'
    },
    {
        data:Hex.toBytes('000102030405060708090A0B0C0D0E0F10'),
        size:32,
        domainSep:0x07,
        expect:'ACBD4AA57507043BCEE55AD3F48504D815E707FE82EE3DAD6D5852C8920B905E'
    },
    {
        data:Hex.toBytes('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FA000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425'),
        size:32,
        domainSep:0x07,
        expect:'7A4DE8B1D927A682B929610103F0E964559BD74542CFAD740EE3D9B036469E0A'
    },
    //TurboSHAKE128(M=ptn(17**3 bytes), D=`07`, 32):
    //TurboSHAKE128(M=ptn(17**4 bytes), D=`07`, 32):
    //TurboSHAKE128(M=ptn(17**5 bytes), D=`07`, 32):
    //TurboSHAKE128(M=ptn(17**6 bytes), D=`07`, 32):
    {
        data:new Uint8Array(0),
        size:32,
        domainSep:6,
        expect:'C79029306BFA2F17836A3D6516D5566340FEA6EB1A1139AD900B41243C494B37'
    },
    {
        data:new Uint8Array(0),
        size:32,
        domainSep:0x0b,
        expect:'8B035AB8F8EA7B410217167458332E46F54BE4FF8354BAF3687104A6D24B0EAB'
    },
    //Oops dupe: TurboSHAKE128(M=`00`^0, D=`06`, 32)
    {
        data:Hex.toBytes('FF'),
        size:32,
        domainSep:6,
        expect:'8EC9C66465ED0D4A6C35D13506718D687A25CB05C74CCA1E42501ABD83874A67'
    },
    {
        data:Hex.toBytes('FFFFFF'),
        size:32,
        domainSep:6,
        expect:'3D03988BB59E681851A192F429AE03988E8F444BC06036A3F1A7D2CCD758D174'
    },
    {
        data:Hex.toBytes('FFFFFFFFFFFFFF'),
        size:32,
        domainSep:6,
        expect:'05D9AE673D5F0E48BB2B57E88021A1A83D70BA85923AA04C12E8F65BA1F94595'
    },
];


let count=0;
for (const test of tests) {
    tsts(`TurboShake[${count++}]`,()=>{
		const hash=new TurboShake128(test.size,test.domainSep);
		hash.write(test.data);
		const md=hash.sum();
		assert.is(Hex.fromBytes(md), test.expect);
	});
}

tsts(`TurboShake(size=10032):last32`,()=>{
    const hash=new TurboShake128(10032,7);
    hash.write(new Uint8Array(0));
    const md=hash.sum();
    assert.is(Hex.fromBytes(md.subarray(md.length-32)), '7593A28020A3C4AE0D605FD61F5EB56ECCD27CC3D12FF09F78369772A460C55D');
})

tsts.run();
