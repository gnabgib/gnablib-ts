// import { suite } from 'uvu';
// import * as assert from 'uvu/assert';
// import { hex } from '../../../src/encoding/Hex';
// import { hSalsa20 } from '../../../src/crypt/sym/Salsa';


// const tsts = suite('HSalsa20');

// const hsalsaTests:[string,string,string][]=[
//     [
//         '0000000000000000000000000000000000000000000000000000000000000000',
//         '00000000000000000000000000000000',
//         '351F86FAA3B988468A850122B65B0ACECE9C4826806AEEE63DE9C0DA2BD7F91E'
//     ],
//     [
//         '0000000000000000000000000000000000000000000000000000000000000000',
//         '80000000000000000000000000000000',
//         'C541CD62360146F5140FA1C76CE1270883FF6605673D6C3E29F1D3510DFC0405'
//     ],
//     [
//         '8000000000000000000000000000000000000000000000000000000000000000',
//         '00000000000000000000000000000000',
//         '7E461F7C9B153C059990DD6A0A8C81ACD23B7A5FAD9F6844B22C97559E2723C7'
//     ],
//     //https://github.com/jedisct1/libsodium/
//     //libsodium: core2
//     [
//         '1B27556473E985D462CD51197A9A46C76009549EAC6474F206C4EE0844F68389',
//         '69696EE955B62B73CD62BDA875FC73D6',
//         'DC908DDA0B9344A953629B733820778880F3CEB421BB61B91CBD4C3E66256CE4'
//     ],
//     //libsodium: core5
//     [
//         'EE304FCA27008D8C126F90027901D80F7F1D8B8DC936CF3B9F819692827E5777',
//         '81918EF2A5E0DA9B3E9060521E4BB352',
//         'BC1B30FC072CC14075E4BAA731B5A845EA9B11E9A5191F94E18CBA8FD821A7CD'
//     ],
//     //stablelib https://github.com/StableLib/stablelib
//     [
//         '000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F',
//         'FFFEFDFCFBFAF9F8F7F6F5F4F3F2F1F0',
//         'C6CB53882782B5B86DF1AB2ED9B810EC8A88C0A7F29211E693F0019FE0728858'
//     ],
// ];
// for(const [key,input,output] of hsalsaTests) {
//     tsts('hSalsa20',()=>{
//         const o=new Uint8Array(32);
//         hSalsa20(o,hex.toBytes(key),hex.toBytes(input));
//         assert.equal(hex.fromBytes(o),output);
//     })
// }

// tsts.run();