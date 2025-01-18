import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { APrng64 } from '../../src/prng/APrng64';
import { hex } from '../../src/codec/Hex';
import { U64 } from '../../src/primitive/number';

const tsts = suite('APrng64');

// class Gen3Bit extends APrng32 {
//     readonly bitGen=3;
//     rawNext(): number {
//         //Worst RNG, https://xkcd.com/221/
//         return 0b101; //5 | x5
//     }
// }
// class Gen10Bit extends APrng32 {
//     readonly bitGen=10;
//     rawNext(): number {
//         //Worst RNG, https://xkcd.com/221/
//         return 0b1100100001; //801 | x321
//     }
// }
// class Gen31Bit extends APrng32 {
//     readonly bitGen=31;
//     _state=1;
//     rawNext(): number {
//         //Alternates these values starting with first
//         const set=[
//             0b1011001110001111000011111000001,//1506248641 | x59C787C1
//             0b0100110001110000111100000111110 //641235006 | x2638783E
//         ];
//         return set[this._state^=1];
//     }
// }
class Gen16Bit extends APrng64 {
    readonly bitGen=16;

    rawNext(): U64 {
        //x9234
        // 37428
        //b1001001000110100
        return U64.fromUint32Pair(0x9234,0);
    }

}
class Gen60Bit extends APrng64 {
    readonly bitGen=60;

    rawNext(): U64 {
        //xFEDCBA987654321
        // 1147797409030816545
        //b111111101101110010111010100110000111011001010100001100100001
        return U64.fromUint32Pair(0x87654321,0xFEDCBA9);
    }
}
const rng16=new Gen16Bit();
const rng60=new Gen60Bit();

// Establish operating characteristics of generators above
const g16_seq_raw:string[]=[
    '0000000000009234',
    '0000000000009234',
    '0000000000009234',
    '0000000000009234',
];
let i=0;
for (const expect of g16_seq_raw) {
    tsts(`Gen16Bit.rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(rng16.rawNext().toBytesBE()), expect);
    });
    i++;
}
const g60_seq_raw:string[]=[
    '0FEDCBA987654321',
    '0FEDCBA987654321',
    '0FEDCBA987654321',
    '0FEDCBA987654321',
];
i=0;
for (const expect of g60_seq_raw) {
    tsts(`Gen60Bit.rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(rng60.rawNext().toBytesBE()), expect);
    });
    i++;
}

//--g16
tsts(`Gen16Bit.nextBool`, () => {
    assert.equal(rng16.nextBool(), true);
 });
 tsts(`Gen16Bit.nextByte`, () => {
    //10010010 00110100
     assert.equal(rng16.nextByte(), 0b10010010);
 });
 tsts(`Gen16Bit.nextU16`, () => {
    //1001001000110100
     assert.equal(rng16.nextU16(), 0b1001001000110100);
 });
 tsts(`Gen16Bit.nextI16`, () => {
    //1001001000110100
     assert.equal(rng16.nextI16(), -28108);
 });
 tsts(`Gen16Bit.nextU31`, () => {
     assert.equal(rng16.nextU31(), 0b1001001000110100100100100011010);
 });
 tsts(`Gen16Bit.nextU32`, () => {
    //1001001000110100 1001001000110100
     assert.equal(rng16.nextU32(), 0b10010010001101001001001000110100);
 });
 tsts(`Gen16Bit.nextI32`, () => {
    //1001001000110100 1001001000110100
     assert.equal(rng16.nextI32(), -1842048460);//x92349234
 });
 tsts(`Gen16Bit.nextU64`, () => {
    //1001001000110100 1001001000110100 1001001000110100 1001001000110100
     assert.equal(hex.fromBytes(rng16.nextU64().toBytesBE()), '9234923492349234');
 });
 
 tsts(`Gen16Bit.nextF32`, () => {
     //1001001000110100 10010010|00110100 = 9581714  * 2**-24
     assert.equal(rng16.nextF32(), 0.57111465930938720703125);
 });
 tsts(`Gen16Bit.nextF64`, () => {
     //1001001000110100 1001001000110100 1001001000110100 10010|01000110100 = 5144143643952786  * 2**-53
     assert.equal(rng16.nextF64(), 0.57111467154955364300406017719069);
 });

//--g60
tsts(`Gen60Bit.nextBool`, () => {
   assert.equal(rng60.nextBool(), true);
});
tsts(`Gen60Bit.nextByte`, () => {
    assert.equal(rng60.nextByte(), 0b11111110);
});
tsts(`Gen60Bit.nextU16`, () => {
    assert.equal(rng60.nextU16(), 0b1111111011011100);
});
tsts(`Gen60Bit.nextI16`, () => {
    assert.equal(rng60.nextI16(), -292);
});
tsts(`Gen60Bit.nextU31`, () => {
    assert.equal(rng60.nextU31(), 0b1111111011011100101110101001100);
});
tsts(`Gen60Bit.nextU32`, () => {
    assert.equal(rng60.nextU32(), 0b11111110110111001011101010011000);
});
tsts(`Gen60Bit.nextI32`, () => {
    assert.equal(rng60.nextI32(), -19088744);
});
tsts(`Gen60Bit.nextU64`, () => {
    //111111101101110010111010100110000111011001010100001100100001 1111|11101101110010111010100110000111011001010100001100100001
    assert.equal(hex.fromBytes(rng60.nextU64().toBytesBE()), 'FEDCBA987654321F');
});
tsts(`Gen60Bit.nextF32`, () => {
    //b111111101101110010111010 | 16702650  * 2**-24
    assert.equal(rng60.nextF32(), 0.99555552005767822265625);
});
tsts(`Gen60Bit.nextF64`, () => {
    //b11111110110111001011101010011000011101100101010000110 | 8967167258053254  * 2**-53
    assert.equal(rng60.nextF64(), 0.99555555555555552693647314299596);
});

tsts.run();