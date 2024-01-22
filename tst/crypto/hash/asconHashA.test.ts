import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { AsconHashA } from '../../../src/crypto/hash';
import { IKat } from './IKat';


const tsts = suite('Ascon-HashA');

const katTests:IKat[]= [
    {
        descr:'LWC_HASH_KAT_256 1',
        msg:'',
        md:'AECD027026D0675F9DE7A8AD8CCF512DB64B1EDCF0B20C388A0C7CC617AAA2C4'
    },
    {
        descr:'LWC_HASH_KAT_256 2',
        msg:'00',
        md:'5A55F0367763D334A3174F9C17FA476EB9196A22F10DAF29505633572E7756E4'
    },
    {
        descr:'LWC_HASH_KAT_256 3',
        msg:'0001',
        md:'4243FD3B872E1ED4013711382CBA032FECB4147D840DDF8436172AC62D129BC4'
    },
    {
        descr:'LWC_HASH_KAT_256 17',
        msg:'000102030405060708090A0B0C0D0E0F',
        md:'EA1CB73639BFA0C6DE4E60960F4F73510FE4481340F1D956A59E9DD2166F9A99'
    },
    {
        descr:'LWC_HASH_KAT_256 18',
        msg:'000102030405060708090A0B0C0D0E0F10',
        md:'AC3C9C02679819CFC8A482ED6F57BEC790DC8054C5B4F55EECAC466844DD389B'
    },
    {
        descr:'LWC_HASH_KAT_256 34',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F20',
        md:'B2E4EE021A20B30A84E14060A894602F3F53942EDC19266BE6DFDC90EDE518B2'
    },
    {
        descr:'LWC_HASH_KAT_256 35',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F2021',
        md:'7BDF06DAEDB204452F43E3C5F806F4267DBCA2A1D4A2313551FFEAD68B214222'
    },
    {
        descr:'LWC_HASH_KAT_256 67',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F4041',
        md:'025AD44AC35E29E7699867276E8C46458093A812CCC6BC6496FE26F31F8314E2'
    },
    {
        descr:'LWC_HASH_KAT_256 68',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142',
        md:'223DCFFB5C8869927A175494BEB9812FC70F6B14D58B8230612F7EEAB744757C'
    },
    {
        descr:'LWC_HASH_KAT_256 174',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABAC',
        md:'C0FD1F8B668FAEF7F32928FC619D6880002518C892E3BABA2445175DAE83F71E'
    },
    {
        descr:'LWC_HASH_KAT_256 600',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F50515253545556',
        md:'FB93604E81C739086C2109953C0CBA5AE1062539ECB4AE5B0CAA75E010105F37'
    },
    {
        descr:'LWC_HASH_KAT_256 1000',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6',
        md:'77A7D4E1F2B7787131EBA366C8471FA81CFFEFD1169618072A69C65A2653E14F'
    },
];
for (const {descr,msg,md} of katTests) {
	const b = hex.toBytes(msg);
	tsts('hash ' + descr, () => {
		const hash=new AsconHashA();
		hash.write(b);
		const foundMd=hash.sum();
		assert.is(hex.fromBytes(foundMd), md);
	});
}

// tsts(`newEmpty`,()=>{
// 	const hash=new Blake32(Uint32Array.of(5,6,7,8));
// 	const sumEmpty='8ADE178EB05A97E397619C8AF465E37787A0C1AE5061A74539D1CC34C5288A09';
// 	const sum0123='E3FA9270A34427889BE47B59185D098D4734EC676021856249012BBC1C388E21';

// 	assert.is(hex.fromBytes(hash.sum()),sumEmpty);
// 	hash.write(Uint8Array.of(0,1,2,3));
// 	assert.is(hex.fromBytes(hash.sum()),sum0123);
// 	const hash2=hash.newEmpty();
// 	assert.is(hex.fromBytes(hash.sum()),sum0123);
// 	assert.is(hex.fromBytes(hash2.sum()),sumEmpty);
// 	hash2.write(Uint8Array.of(0,1,2,3));
// 	assert.is(hex.fromBytes(hash2.sum()),sum0123);
// })

tsts.run();
