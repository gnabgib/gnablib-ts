import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { KangarooTwelve } from '../../src/hash/KangarooTwelve';

const tsts = suite('KangarooTwelve');

// const tests:{
//     data:Uint8Array,//m
//     size:number,//l
//     customize?:string,
//     expect:string
// }[]=[
//     //17 = 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F 10
//     //https://www.ietf.org/archive/id/draft-irtf-cfrg-kangarootwelve-10.html#name-test-vectors
//     {
//         data:new Uint8Array(0),
//         size:32,
//         expect:'1AC2D450FC3B4205D19DA7BFCA1B37513C0803577AC7167F06FE2CE1F0EF39E5'
//     },
//     {
//         data:new Uint8Array(0),
//         size:64,
//         expect:'1AC2D450FC3B4205D19DA7BFCA1B37513C0803577AC7167F06FE2CE1F0EF39E54269C056B8C82E48276038B6D292966CC07A3D4645272E31FF38508139EB0A71'
//     },
//     {
//         data:Uint8Array.of(0),
//         size:32,
//         expect:'2BDA92450E8B147F8A7CB629E784A058EFCA7CF7D8218E02D345DFAA65244A1F'

//     },
//     {
//         data:hex.toBytes('000102030405060708090A0B0C0D0E0F10'),
//         size:32,
//         expect:'6BF75FA2239198DB4772E36478F8E19B0F371205F6A9A93A273F51DF37122888'
//     },
//     {
//         data:hex.toBytes('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7C8C9CACBCCCDCECFD0D1D2D3D4D5D6D7D8D9DADBDCDDDEDFE0E1E2E3E4E5E6E7E8E9EAEBECEDEEEFF0F1F2F3F4F5F6F7F8F9FA000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425'),
//         size:32,
//         expect:'0C315EBCDEDBF61426DE7DCF8FB725D1E74675D7F5327A5067F367B108ECB67C'
//     },
//     //KangarooTwelve(M=ptn(17**3 bytes), D=`07`, 32):
//     //KangarooTwelve(M=ptn(17**4 bytes), D=`07`, 32):
//     //KangarooTwelve(M=ptn(17**5 bytes), D=`07`, 32):
//     //KangarooTwelve(M=ptn(17**6 bytes), D=`07`, 32):
//     {
//         data:new Uint8Array(0),
//         size:32,
//         customize:'00',
//         expect:'FAB658DB63E94A246188BF7AF69A133045F46EE984C56E3C3328CAAF1AA1A583'
//     },
//     {
//         data:Uint8Array.of(0xff),
//         size:32,
//         customize:'000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728',
//         expect:'D848C5068CED736F4462159B9867FD4C20B808ACC3D5BC48E0B06BA0A3762EC4'
//     },
//     //KangarooTwelve(M='FFFFFF', C=ptn 41**2, 32):
//     //KangarooTwelve(M='FFFFFFFFFFFFFF', C=ptn 41**2, 32):
// ];


// let count=0;
// for (const test of tests) {
//     tsts(`KangarooTwelve[${count++}]`,()=>{
// 		const hash=new KangarooTwelve(test.size,test.customize);
// 		hash.write(test.data);
// 		const md=hash.sum();
// 		assert.is(hex.fromBytes(md), test.expect);
// 	});
// }

// tsts(`KangarooTwelve(size=10032):last32`,()=>{
//     const hash=new KangarooTwelve(10032);
//     hash.write(new Uint8Array(0));
//     const md=hash.sum();
//     assert.is(hex.fromBytes(md.subarray(md.length-32)), 'E8DC563642F7228C84684C898405D3A834799158C079B12880277A1D28E2FF6D');
// })

tsts.run();
