import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Aria128 } from '../../../src/crypto/sym/Aria';


const tsts = suite('ARIA-128/RFC5794');

// prettier-ignore
const tests:[string,string,string][]=[
    //ARIA128(ECB)KAT.txt | https://github.com/RyuaNerin/go-krypto/blob/master/aria/testcases_128_test.go
    //zero key, varying plain
    ['00000000000000000000000000000000','80000000000000000000000000000000','92E51E737DABB6BFD0EABC8D32224F77'],
    ['00000000000000000000000000000000','C0000000000000000000000000000000','E9515AF69763E19B4FBCA0D7034CCE63'],
    ['00000000000000000000000000000000','E0000000000000000000000000000000','44765262352E389BB0307BFEA5BC7805'],
    ['00000000000000000000000000000000','F0000000000000000000000000000000','891CA8815D2A8E6314665AC4E8559724'],
    ['00000000000000000000000000000000','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF','9184211622C2BE38CBE0957C12363D96'],
    
    //zero plain, varying key
    ['80000000000000000000000000000000','00000000000000000000000000000000','4ABA3055788204D82F4539D81BC9384B'],
    ['C0000000000000000000000000000000','00000000000000000000000000000000','3E96654A75D69E6EA756C330A92B9D41'],
    ['E0000000000000000000000000000000','00000000000000000000000000000000','0FDFB82E9EA8EA5A0C5761F76870A83E'],
    ['F0000000000000000000000000000000','00000000000000000000000000000000','DD1B1531C7A9AA1CA70CE44C426D3CCD'],
    ['FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF','00000000000000000000000000000000','2E582A95A18CBB64F26CBE02E5E20944'],
    
    //zero key, variety key
    ['00000000000000000000000000000000','0B8625968082C927C38BEB98712C3F50','B7CBA5F9E11CED3A1B5ED109E03A8EF3'],
    ['00000000000000000000000000000000','991A70739B014281C80273E4D16CB673','C3D833DB1CBA0D8FB7AA3028BB02B0B2'],
    ['00000000000000000000000000000000','FC717F6890AE6A2BB8F0C3E6E30FEA26','FA55A1828A6354E9D0ECC09AD509A506'],
];
for (const [key,plain,enc] of tests) {
    const c=new Aria128(hex.toBytes(key));
    tsts(`Aria128(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found=hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found),enc);
    });
    tsts(`Aria128(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found=hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found),plain);
    });
}


tsts.run();