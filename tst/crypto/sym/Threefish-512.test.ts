import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Threefish512 } from '../../../src/crypto/sym/Threefish';

const tsts = suite('Threefish512');

// prettier-ignore
const tests:[string,string,string,string][]=[
    //https://web.archive.org/web/20190221194501/https://sites.google.com/site/bartoszmalkowski/threefish
    [
        '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '00000000000000000000000000000000',
        '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        'B1A2BBC6EF6025BC40EB3822161F36E375D1BB0AEE3186FBD19E47C5D479947B7BC2F8586E35F0CFF7E7F03084B0B7B1F1AB3961A580A3E97EB41EA14A6D7BBE'],
    [
        '101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F',
        '000102030405060708090A0B0C0D0E0F',
        'FFFEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EFEEEDECEBEAE9E8E7E6E5E4E3E2E1E0DFDEDDDCDBDAD9D8D7D6D5D4D3D2D1D0CFCECDCCCBCAC9C8C7C6C5C4C3C2C1C0',
        'E304439626D45A2CB401CAD8D636249A6338330EB06D45DD8B36B90E97254779272A0A8D99463504784420EA18C9A725AF11DFFEA10162348927673D5C1CAF3D'],
];
for (const [key, tweak, plain, enc] of tests) {
    const c = new Threefish512(hex.toBytes(key), hex.toBytes(tweak));
    tsts(`Threefish512(${key},${tweak}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found = hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found), enc);
    });
    tsts(`Threefish512(${key},${tweak}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found = hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found), plain);
    });
}

tsts.run();
