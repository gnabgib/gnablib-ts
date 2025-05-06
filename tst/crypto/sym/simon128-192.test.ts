import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Simon128_192 } from '../../../src/crypto/sym/Simon128';

const tsts = suite('Simon128/192');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['000102030405060708090A0B0C0D0E0F1011121314151617','72696265207768656E20746865726520','5BB897256E8D9C6C4F0DDCFCEF61ACC4'],
    // //https://github.com/weidai11/cryptopp/blob/master/TestVectors/simon.txt
    // //From Crypto++6 gen
    ['77BF3EBDE59EC1675B1E35A1904C8698E35FAC3790C2EC32','C44E7AD8DEDB871A7E21D9B5510530B6','0A80256E2917408FD3909C85F1899F97'],
    ['B339CAF8EF079848189E758280D3EEB4B229C8782DA27CA2','FFF18A09740B5716C19569131CC4F62B','D8867B787C724E6C01BB9B503E37A9E2'],
    ['45BA47A866CEB3BCD51272C1E21FFA9DD06A3C3F24F617F5','67B39406A0F1E9386C139506DB38B95B','5546B6A9E23EB9C9DA269ABFA081E70E'],
    ['79906815C141948813F3B4D02078E615CD60DC64E353DB77','876CBF9F1E1251E3724D3EF9C97E5924','D7301186CA0A8803811B666C6A5573C1'],
    ['60A17CA98BAD3AD6824A31473C1965D16735C97BC82AA326','95EC0F3E9F654103431B9E8AEF4E339A','F2560B40D89836B5CC673DFE5F370853'],
    ['1A460CD1224A66C03C1D215B8320F62C8A217DA7F85B786E','5C77AC0BB725084F66D3BF386804F4F0','EBB6D266353C6EAB6F27D1DF09B2F0FE'],
    ['728A9E7286733FABC9F423D310FC239C41C134F271274EAD','DA91A951C96485A8856C1C609E5701C2','118BB2A5B05B3E0E16C03B93F8B403A3'],
];
for (const [key, plain, enc] of tests) {
    const c = new Simon128_192(hex.toBytes(key));
    tsts(`Simon128/192(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found = hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found), enc);
    });
    tsts(`Simon128/192(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found = hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found), plain);
    });
}

tsts.run();
