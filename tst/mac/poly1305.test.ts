// import { suite } from 'uvu';
// import * as assert from 'uvu/assert';
// import { hex } from '../../src/encoding/Hex';
// import { Poly1305 } from '../../src/mac/Poly1305';

// const tsts = suite('Poly1305');

// const tests:[string,string,string][]=[
//     //https://datatracker.ietf.org/doc/html/rfc7539#section-2.5.2
//     [
//         '85D6BE7857556D337F4452FE42D506A80103808AFB0DB2FD4ABFF6AF4149F51B',
//         '43727970746F6772617068696320466F72756D2052657365617263682047726F7570',
//         'A8061DC1305136C6C22B8BAF0C0127A9'
//     ],
//     // //https://cs.opensource.google/go/x/crypto/+/master:internal/poly1305/vectors_test.go 1
//     // [
//     //     '3B3A29E93B213A5C5C3B3B053A3A8C0D00000000000000000000000000000000',
//     //     '81D8B2E46A25213B58FEE4213A2A28E921C12A9632516D3B73272727BECF2129',
//     //     '6DC18B8C344CD79927118BBE84B7F314'
//     // ],
    
// ];
// let count=0;
// for(const [key,input,expect] of tests) {
//     tsts(`mac[${count++}]`,()=>{
//         const mac=new Poly1305(hex.toBytes(key));
//         mac.write(hex.toBytes(input));
//         const found=mac.sum();
//         assert.is(hex.fromBytes(found),expect);
//     });
// }

// // tsts('reset',()=>{
// //     const mac=new Poly1305(hex.toBytes('3b3a29e93b213a5c5c3b3b053a3a8c0d00000000000000000000000000000000'));
// //     mac.write(Uint8Array.of(0));
// //     assert.is(hex.fromBytes(mac.sum()),'2BECEAA81BBD0F09A26BC4AD28B7DD18','original sum');
// //     mac.reset();
// //     assert.is(hex.fromBytes(mac.sum()),'BB1D6929E95937287FA37D129B756746','reset sum');
// // });

// // tsts('newEmpty',()=>{
// //     const mac=new Poly1305(hex.toBytes('3b3a29e93b213a5c5c3b3b053a3a8c0d00000000000000000000000000000000'));
// //     mac.write(Uint8Array.of(0));
// //     assert.is(hex.fromBytes(mac.sum()),'2BECEAA81BBD0F09A26BC4AD28B7DD18','original sum');

// //     const other=mac.newEmpty();
// //     //Note it doesn't have any written data
// //     assert.is(hex.fromBytes(other.sum()),'BB1D6929E95937287FA37D129B756746','clone sum');
// // });

// tsts.run();
