import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Twofish } from '../../../src/crypto/sym';


const tsts = suite('Twofish');


const tests:[string,string,string][]=[
    [
        '9F589F5CF6122C32B6BFEC2F2AE8C35A',
        'D491DB16E7B1C39E86CB086B789F5419',
        '019F9809DE1711858FAAC3A3BA20FBC3'
    ],
    [
        '88B2B2706B105E36B446BB6D731A1E88EFA71F788965BD44',
        '39DA69D6BA4997D585B6DC073CA341B2',
        '182B02D81497EA45F9DAACDC29193A65'
    ],
    //https://www.schneier.com/code/ecb_ival.txt
    [
        '00000000000000000000000000000000',
        '00000000000000000000000000000000',
        '9F589F5CF6122C32B6BFEC2F2AE8C35A'
    ],
    [
        '0123456789ABCDEFFEDCBA98765432100011223344556677',
        '00000000000000000000000000000000',
        'CFD1D2E5A9BE9CDF501F13B892BD2248'
    ],
    [
        '0123456789ABCDEFFEDCBA987654321000112233445566778899AABBCCDDEEFF',
        '00000000000000000000000000000000',
        '37527BE0052334B89F0CFCCAE87CFA20'
    ],
    [//i=2 128
        '00000000000000000000000000000000',
        '9F589F5CF6122C32B6BFEC2F2AE8C35A',
        'D491DB16E7B1C39E86CB086B789F5419'
    ],
    [//i=3 128
        '9F589F5CF6122C32B6BFEC2F2AE8C35A',
        'D491DB16E7B1C39E86CB086B789F5419',
        '019F9809DE1711858FAAC3A3BA20FBC3'
    ],    
    [//i=49 128
        'BCA724A54533C6987E14AA827952F921',
        '6B459286F3FFD28D49F15B1581B08E42',
        '5D9D4EEFFA9151575524F115815A12E0'
    ],
    [//i=2 192
        '000000000000000000000000000000000000000000000000',
        'EFA71F788965BD4453F860178FC19101',
        '88B2B2706B105E36B446BB6D731A1E88'
    ],
    [//i=3 192
        'EFA71F788965BD4453F860178FC191010000000000000000',
        '88B2B2706B105E36B446BB6D731A1E88',
        '39DA69D6BA4997D585B6DC073CA341B2'
    ],    
    [//i=49 192
        'FB66522C332FCC4C042ABE32FA9E902FDEA4F3DA75EC7A8E',
        'F0AB73301125FA21EF70BE5385FB76B6',
        'E75449212BEEF9F4A390BD860A640941'
    ],   
    [//i=2 256
        '0000000000000000000000000000000000000000000000000000000000000000',
        '57FF739D4DC92C1BD7FC01700CC8216F',
        'D43BB7556EA32E46F2A282B7D45B4E0D'
    ],
    [//i=3 256
        '57FF739D4DC92C1BD7FC01700CC8216F00000000000000000000000000000000',
        'D43BB7556EA32E46F2A282B7D45B4E0D',
        '90AFE91BB288544F2C32DC239B2635E6'
    ],    
    [//i=49 256
        '248A7F3528B168ACFDD1386E3F51E30C2E2158BC3E5FC714C1EEECA0EA696D48',
        '431058F4DBC7F734DA4F02F04CC4F459',
        '37FE26FF1CF66175F5DDF4C33B97A205'
    ], 
];
for (const [key,plain,enc] of tests) {
    const c=new Twofish(hex.toBytes(key));
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

tsts('bad key length throws',()=>{
    assert.throws(()=>new Twofish(Uint8Array.of(0)));
})

tsts(`encrypt from too small throws`,()=>{
    const c=new Twofish(new Uint8Array(16));
    assert.throws(()=>c.encryptBlock(new Uint8Array(0)));
});

tsts(`decrypt from too small throws`,()=>{
    const c=new Twofish(new Uint8Array(16));
    assert.throws(()=>c.decryptBlock(new Uint8Array(0)));
});

tsts.run();