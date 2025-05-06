import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Speck128_256 } from '../../../src/crypto/sym/Speck128';

const tsts = suite('Speck128/256');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F','706F6F6E65722E20496E2074686F7365','438F189C8DB4EE4E3EF5C00504010941'],
    //https://github.com/weidai11/cryptopp/blob/master/TestVectors/speck.txt
    //From Crypto++6 gen
    ['3FAD1C9A616C155D42A077C2458E6BBA12C340F1475EA1F1624F8636FFB14ECC','83A3C8AC4655B7B09FD2E6372F67D80B','C1666B5CEFC7A834AA8E17151325D89C'],
    ['E9235BD73D5765F98233C2021EB193CD83D9FF76343580A20D48C142B1A25F6E','10FBEF4883786A14C18481055AD076A9','8095D35115BB5FC1064AEE233832D921'],
    ['009ECA0719A624A4B084213A45B7950F9B4D3720B2F7193D7B6CE05C92E6F6B5','B9BF57EF4FDF273D751919D9DE4C5A02','96070BBFF73875E382E29423DAE04DFA'],
    ['6C86F091D17F7261C964F3EC3902988E33568010418B7F267B6848B2C746A53D','31562C0AF6E5F3C869222D35BBA01FF2','42FF1EBF3DD18B22E6AF206740945FA5'],
    ['49C44EC0AB29B4DBFC99284EAA23FABD6EE1DF514A55E0AFA634B6DF1D64BFF4','15D7F91AA555593980969C0A96691832','D4AC0465FD57712323E38EB3800EF2F2'],
    ['A7C428C81C02E2586A56C870AA6C0D3D2D9604E70D5943B3732664D4983BBB5C','2BE71A17BCBD8F3F38887B633DB32540','3C6689A1A779CF7F24BAF05263F0B741'],
    ['4C46BE3B57F43F1B51646D48EAC8B291CD6BBC788D2E49FCF99E0A504BD9BF93','B19F424B5EDC7150FC6F46B0D45B4675','BA3F63708D144B7E131D6E8270A8F281'],
];
for (const [key, plain, enc] of tests) {
    const c = new Speck128_256(hex.toBytes(key));
    tsts(`Speck128/256(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found = hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found), enc);
    });
    tsts(`Speck128/256(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found = hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found), plain);
    });
}

tsts.run();
