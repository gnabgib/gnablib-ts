import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Lea128 } from '../../../src/crypto/sym/Lea';


const tsts = suite('LEA-128');

// prettier-ignore
const tests:[string,string,string][]=[
    //https://en.wikipedia.org/wiki/LEA_(cipher)
    ['0F1E2D3C4B5A69788796A5B4C3D2E1F0','101112131415161718191A1B1C1D1E1F','9FC84E3528C6C6185532C7A704648BFD'],
    //LEA128(ECB)KAT.txt (subset) | https://github.com/chearin/LEA/blob/main/LEA128(ECB)KAT.txt
    //zero key, varying plain
    ['00000000000000000000000000000000','80000000000000000000000000000000','CE8DCF04DD60982B1D8F5035FD534DE2'],
    ['00000000000000000000000000000000','C0000000000000000000000000000000','196D7D801A91C862CB9FC739BB42EFB7'],
    ['00000000000000000000000000000000','E0000000000000000000000000000000','9AD0A3385AF3D8A2062B67E0B162F47D'],
    ['00000000000000000000000000000000','F0000000000000000000000000000000','825426C40976FB0E0DBEF135BE25CC25'],
    ['00000000000000000000000000000000','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF','5311E9CF5A38D30FFAB396F4BEFD4A62'],
    
    //zero plain, varying key
    ['80000000000000000000000000000000','00000000000000000000000000000000','4D83E55D4BA87093B609C574E4F65A23'],
    ['C0000000000000000000000000000000','00000000000000000000000000000000','E88C3F0294A029AAAFFE5C5CCF1C00CE'],
    ['E0000000000000000000000000000000','00000000000000000000000000000000','61B6A8C4513BC625EC4787F90705D734'],
    ['F0000000000000000000000000000000','00000000000000000000000000000000','714949B9E7AFA3393B0B3CF3DF546FC3'],
    ['FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF','00000000000000000000000000000000','35760B28A6575BFC90408A80872B0BB2'],
    
    //zero key, variety key
    ['00000000000000000000000000000000','6E52BA79C8E46A76E58EA46586A4BA5B','95477D37FAB6EA969AF30A6F3DE2288D'],
    ['00000000000000000000000000000000','3C006E246FF712DAA58CEEB601E4E227','2394F5896B9F786168DF1075BE2309BA'],
    ['00000000000000000000000000000000','C1701D1C790374218CA92565F8F9BB59','3B8E8ACB7031747BB78E7D68379BFA8B'],
];
for (const [key,plain,enc] of tests) {
    const c=new Lea128(hex.toBytes(key));
    tsts(`b(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found=hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found),enc);
    });
    tsts(`b(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found=hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found),plain);
    });
}


tsts.run();