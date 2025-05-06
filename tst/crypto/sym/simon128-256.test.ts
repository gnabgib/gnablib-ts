import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Simon128_256 } from '../../../src/crypto/sym/Simon128';

const tsts = suite('Simon128/256');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F','697320612073696D6F6F6D20696E2074','68B8E7EF872AF73BA0A3C8AF79552B8D'],
    // //https://github.com/weidai11/cryptopp/blob/master/TestVectors/simon.txt
    // //From Crypto++6 gen
    ['73FD58ED60314241E61E641CCD18AD23D0B0AA7C15AC1A4588DAA74498E4DA75','9B6A0560279D0C1572654F2D96858BB2','E66F99E824B41902C3815BAC938241A1'],
    ['EDADBFA5A0F77F8DE367B0329CF7CE1F27969086146A0370F19A3AB52C842C67','F082E05CE8EF2084BDF16C67161D4EAA','491518B50925960A591FFDD3945BB25E'],
    ['9E48235ECCF68F8EEFA28A086997468EE7E83E9957CD8BB5B708D3AE37A6D5C2','F2E7275267EA7210197A3F9327C3909A','EA569F44C4E7D1DB4E6D1D589AE38DF4'],
    ['C15C8CD8C884DDAFBD90C9AC052AE827C35D54DE5419509FF9D68778EEB3968B','8F7900FBE6C81CFABDCA132AEF3488A1','51B99E0CDAED7B763E938143B872668B'],
    ['A92F44A08E4F85B4403845A727367721CEA5E4DF6BA4D46810306AEE0A7CFD22','C06BFC1A2C48470D99CB57E55B9E43F3','AF90B040E35EA595054BD6F17925F4A5'],
    ['EBD4C7A6ED3F86C411E281C59CD9D3325B7ADBCAB23CBB2EFA1A69D62B1F061D','81F7C825BA658DFD619164937153BE5B','A2F039C0C8FC0AF97C86E128B82F21DA'],
    ['DB76028BF2046377CA24E8C54DFBDBAE930D94799C5D6F9D306EF15BCB618DA9','3ABCCED0C5E537E6DAB4357E51D529BD','9A8718CDD3937ABD31150E6A3B6AD927'],
];
for (const [key, plain, enc] of tests) {
    const c = new Simon128_256(hex.toBytes(key));
    tsts(`Simon128/256(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found = hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found), enc);
    });
    tsts(`Simon128/256(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found = hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found), plain);
    });
}

tsts.run();
