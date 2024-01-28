import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { AsconXof } from '../../../src/crypto/xof';
import { IKat } from '../hash/IKat';


const tsts = suite('Ascon-Xof');

const katTests:IKat[]= [
    {
        descr:'LWC_HASH_KAT_256 1',
        msg:'',
        md:'5D4CBDE6350EA4C174BD65B5B332F8408F99740B81AA02735EAEFBCF0BA0339E'
    },
    {
        descr:'LWC_HASH_KAT_256 2',
        msg:'00',
        md:'B2EDBB27AC8397A55BC83D137C151DE9EDE048338FE907F0D3629E717846FEDC'
    },
    {
        descr:'LWC_HASH_KAT_256 3',
        msg:'0001',
        md:'D196461C299DB714D78C267924B5786EE26FC43B3E640DAA5397E38E39D39DC6'
    },
    {
        descr:'LWC_HASH_KAT_256 17',
        msg:'000102030405060708090A0B0C0D0E0F',
        md:'C861A89CFB1335F278C96CF7FFC9753C290CBE1A4E186D2923B496BB4EA5E519'
    },
    {
        descr:'LWC_HASH_KAT_256 18',
        msg:'000102030405060708090A0B0C0D0E0F10',
        md:'604419F916E9EF78D037E624614FD5988185C6C2AA8AD9C4A35C4B9D9E15B360'
    },
    {
        descr:'LWC_HASH_KAT_256 34',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F20',
        md:'12E2593FBB8A733B79B7A54C2D99C9523A126F32A1D198DDC5DB3F8D98673FD9'
    },
    {
        descr:'LWC_HASH_KAT_256 35',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F2021',
        md:'F00768C4F0FE9C2CDF434DAE4E107B24439EEE15A5AFE8003807FE3C99E454B7'
    },
    {
        descr:'LWC_HASH_KAT_256 67',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F4041',
        md:'839629BE40797F36C2C56DFA3523D1DEC0A62CFCC1B70C4CD21B40BF89C7AD89'
    },
    {
        descr:'LWC_HASH_KAT_256 68',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142',
        md:'093B45B9067246BD3B3C593B697D036B4E8E196DA86295B841C02EF305D2B017'
    },
    {
        descr:'LWC_HASH_KAT_256 174',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABAC',
        md:'ECFCC16712111E063E6D1EC05A1090CFDC1B1498CF00D513DB4FB37240BB0DF3'
    },
    {
        descr:'LWC_HASH_KAT_256 600',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F50515253545556',
        md:'FF4BFE01FE2453166D5FAEAB8B5E8ECED677B974C94D2864BF128F46FDEA74FA'
    },
    {
        descr:'LWC_HASH_KAT_256 1000',
        msg:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6',
        md:'502A4A04AA050CA7EFFE814B8C9AF23E17EDD532D571C72BBCFCD2F3CE37D6BC'
    },
];
for (const {descr,msg,md} of katTests) {
	const b = hex.toBytes(msg);
	tsts('hash ' + descr, () => {
		const hash=new AsconXof(32);
		hash.write(b);
		const foundMd=hash.sum();
		assert.is(hex.fromBytes(foundMd), md);
	});
}

tsts.run();