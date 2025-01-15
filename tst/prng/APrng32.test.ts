import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { APrng32 } from '../../src/prng/APrng32';
import { hex } from '../../src/codec/Hex';

const tsts = suite('APrng32');

class Gen3Bit extends APrng32 {
    readonly bitGen=3;
    rawNext(): number {
        //Worst RNG, https://xkcd.com/221/
        return 0b101; //5 | x5
    }
}
class Gen10Bit extends APrng32 {
    readonly bitGen=10;
    rawNext(): number {
        //Worst RNG, https://xkcd.com/221/
        return 0b1100100001; //801 | x321
    }
}
class Gen31Bit extends APrng32 {
    readonly bitGen=31;
    _state=1;
    rawNext(): number {
        //Alternates these values starting with first
        const set=[
            0b1011001110001111000011111000001,//1506248641 | x59C787C1
            0b0100110001110000111100000111110 //641235006 | x2638783E
        ];
        return set[this._state^=1];
    }
}

const rng3=new Gen3Bit();
const rng10=new Gen10Bit();
const rng31=new Gen31Bit();

tsts(`APrng32.max`, () => {
    assert.equal(rng3.max, 2**3 -1);
    assert.equal(rng10.max, 2**10 -1);
    assert.equal(rng31.max, 2**31 -1);
});

// Establish operating characteristics of generators above
const g3_seq_raw:number[]=[
    5,
    5,
    5,
    5,
];
let i=0;
for (const expect of g3_seq_raw) {
    tsts(`Gen3Bit.rawNext[${i}]`, () => {
        assert.equal(rng3.rawNext(), expect);
    });
    i++;
}

const g10_seq_raw:number[]=[
    0x321,
    0x321,
    0x321,
    0x321,
];
i=0;
for (const expect of g10_seq_raw) {
    tsts(`Gen10Bit.rawNext[${i}]`, () => {
        assert.equal(rng10.rawNext(), expect);
    });
    i++;
}

const g31_seq_raw:number[]=[
    1506248641,
    641235006,
    1506248641,
    641235006,
];
i=0;
for (const expect of g31_seq_raw) {
    tsts(`Gen31Bit.rawNext[${i}]`, () => {
        assert.equal(rng31.rawNext(), expect);
    });
    i++;
}

// --g3 because this repeat-gens the same number, no need for multiple tests, just checking bit alignment
tsts(`Gen3Bit.nextBool`, () => {
    //1|01
   assert.equal(rng3.nextBool(), true);
});

tsts(`Gen3Bit.nextByte`, () => {
     //101 101 10|1
    assert.equal(rng3.nextByte(), 0b10110110);
});
tsts(`Gen3Bit.nextU16`, () => {
    //101 101 101 101 101 1|01
    assert.equal(rng3.nextU16(), 0b1011011011011011);
});
tsts(`Gen3Bit.nextI16`, () => {
    assert.equal(rng3.nextI16(), -18725);
});
tsts(`Gen3Bit.nextU31`, () => {
    //101 101 101 101 101 101 101 101 101 101 1|01
    assert.equal(rng3.nextU31(), 0b1011011011011011011011011011011);
});
tsts(`Gen3Bit.nextU32`, () => {
    //101 101 101 101 101 101 101 101 101 101 10|1
    assert.equal(rng3.nextU32(), 0b10110110110110110110110110110110);
});
tsts(`Gen3Bit.nextI32`, () => {
    assert.equal(rng3.nextI32(), -1227133514);
});
tsts(`Gen3Bit.nextF32`, () => {
    //101 101 101 101 101 101 101 101 = 11983725 * 2**-24
    assert.equal(rng3.nextF32(), 0.714285671710968017578125);
});
tsts(`Gen3Bit.nextF64`, () => {
    //101 101 101 101 101 101 101 101 101 +
    //101 101 101 101 101 101 101 101 10|1 = 6433713753386422 * 2**-53
    assert.equal(rng3.nextF64(), 0.71428571428571419055231217498658);
});

const g3_seq_fill:[Uint8Array,string][]=[
    //10110110 11011011 01101101 10110110 11011011
    [new Uint8Array(0),''],
    [new Uint8Array(1),'B6'],
    [new Uint8Array(2),'B6DB'],
    [new Uint8Array(3),'B6DB6D'],
    [new Uint8Array(4),'B6DB6DB6'],
    [new Uint8Array(5),'B6DB6DB6DB'],
];
i=0;
for (const [fill,expect] of g3_seq_fill) {
    tsts(`Gen3Bit.fillBytes([${fill.length}]`, () => {
        rng3.fillBytes(fill);
        assert.equal(hex.fromBytes(fill), expect);
    });
    i++;
}
// --g10 because this repeat-gens the same number, no need for multiple tests, just checking bit alignment
tsts(`Gen10Bit.nextBool`, () => {
    //1|100100001
   assert.equal(rng10.nextBool(), true);
});
tsts(`Gen10Bit.nextByte`, () => {
    //11001000|01
   assert.equal(rng10.nextByte(), 0b11001000);
});
tsts(`Gen10Bit.nextU16`, () => {
    //1100100001 110010|0001
   assert.equal(rng10.nextU16(), 0b1100100001110010);
});
tsts(`Gen10Bit.nextI16`, () => {
   assert.equal(rng10.nextI16(), -14222);
});
tsts(`Gen10Bit.nextU31`, () => {
    //1100100001 1100100001 1100100001 1|100100001
   assert.equal(rng10.nextU31(), 0b1100100001110010000111001000011);
});
tsts(`Gen10Bit.nextU32`, () => {
    //1100100001 1100100001 1100100001 11|00100001
   assert.equal(rng10.nextU32(), 0b11001000011100100001110010000111);
});
tsts(`Gen10Bit.nextI32`, () => {
   assert.equal(rng10.nextI32(), -932045689);
});
tsts(`Gen10Bit.nextF32`, () => {
    //1100100001 1100100001 1100|100001 = 13136412 * 2**-24 =0.7829911708831787109375
    assert.equal(rng10.nextF32(), 0.7829911708831787109375);
});
tsts(`Gen10Bit.nextF64`, () => {
    //1100100001 1100100001 1100100|001 +
    //1100100001 1100100001 110010|0001 = 7052557811828850 * 2**-53
    assert.equal(rng10.nextF64(), 0.7829912065192401460222981768311);
});
const g10_seq_fill:[Uint8Array,string][]=[
    //11001000 01110010 00011100 10000111 00100001 
    [new Uint8Array(0),''],
    [new Uint8Array(1),'C8'],
    [new Uint8Array(2),'C872'],
    [new Uint8Array(3),'C8721C'],
    [new Uint8Array(4),'C8721C87'],
    [new Uint8Array(5),'C8721C8721'],
];
i=0;
for (const [fill,expect] of g10_seq_fill) {
    tsts(`Gen10Bit.fillBytes([${fill.length}]`, () => {
        rng10.fillBytes(fill);
        assert.equal(hex.fromBytes(fill), expect);
    });
    i++;
}

// --g31
const g31_seq_bool:boolean[]=[
    //1|011001110001111000011111000001
    true,
    //0|100110001110000111100000111110
    false,
    //Repeats because rest of bits are discarded, it doesn't continue from bits from the first number
    true,
    false
];
i=0;
for (const expect of g31_seq_bool) {
    tsts(`Gen31Bit.nextBool[${i}]`, () => {
        assert.equal(rng31.nextBool(), expect);
    });
    i++;
}

const g31_seq_byte:number[]=[
    //10110011|10001111000011111000001
    0b10110011,
    //01001100|01110000111100000111110
    0b01001100,
    0b10110011,
    0b01001100//must be even reads to not mess up state for other tests
];
i=0;
for (const expect of g31_seq_byte) {
    tsts(`Gen31Bit.nextByte[${i}]`, () => {
        assert.equal(rng31.nextByte(), expect);
    });
    i++;
}

const g31_seq_u16:number[]=[
    //1011001110001111|000011111000001
    0b1011001110001111,
    //0100110001110000|111100000111110
    0b0100110001110000,
    0b1011001110001111,
    0b0100110001110000//must be even reads to not mess up state for other tests
];
i=0;
for (const expect of g31_seq_u16) {
    tsts(`Gen31Bit.nextU16[${i}]`, () => {
        assert.equal(rng31.nextU16(), expect);
    });
    i++;
}

const g31_seq_i16:number[]=[
    //1011001110001111|000011111000001
    -19569,
    //0100110001110000|111100000111110
    19568,
    -19569,
    19568//must be even reads to not mess up state for other tests
];
i=0;
for (const expect of g31_seq_i16) {
    tsts(`Gen31Bit.nextI16[${i}]`, () => {
        assert.equal(rng31.nextI16(), expect);
    });
    i++;
}

const g31_seq_u31:number[]=[
    //1011001110001111000011111000001
    0b1011001110001111000011111000001,
    //0100110001110000111100000111110
    0b0100110001110000111100000111110,
    0b1011001110001111000011111000001,
    0b0100110001110000111100000111110
];
i=0;
for (const expect of g31_seq_u31) {
    tsts(`Gen31Bit.nextU31[${i}]`, () => {
        assert.equal(rng31.nextU31(), expect);
    });
    i++;
}

const g31_seq_u32:number[]=[
    //1011001110001111000011111000001 0|100110001110000111100000111110
    0b10110011100011110000111110000010,
    0b10110011100011110000111110000010 //Note this pattern repeats because it uses 2 values to gen
];
i=0;
for (const expect of g31_seq_u32) {
    tsts(`Gen31Bit.nextU32[${i}]`, () => {
        assert.equal(rng31.nextU32(), expect);
    });
    i++;
}

const g31_seq_i32:number[]=[
    -1282470014,
    -1282470014
];
i=0;
for (const expect of g31_seq_i32) {
    tsts(`Gen31Bit.nextI32[${i}]`, () => {
        assert.equal(rng31.nextI32(), expect);
    });
    i++;
}

const g31_seq_f32:number[]=[
    //101100111000111100001111|1000001 = 11767567 * 2**-24
    0.701401650905609130859375,
    //010011000111000011110000|0111110 = 5009648 * 2**-24
    0.29859828948974609375
];
i=0;
for (const expect of g31_seq_f32) {
    tsts(`Gen31Bit.nextF32[${i}]`, () => {
        assert.equal(rng31.nextF32(), expect);
    });
    i++;
}

const g31_seq_f64:number[]=[
    //101100111000111100001111100|0001 +
    //01001100011100001111000001|11110 = 6317664715785153 * 2**-53
    0.70140168293266225152393644748372,
    //Because both numbers are consumed building 1 F64, this pattern repeats right away
    0.70140168293266225152393644748372
];
i=0;
//1100100001 1100100001 1100100001 1100100001 1100100001 110=7052557774240014
for (const expect of g31_seq_f64) {
    tsts(`Gen31Bit.nextF64[${i}]`, () => {
        assert.equal(rng31.nextF64(), expect);
    });
    i++;
}

const g31_seq_fill:[Uint8Array,string][]=[
    //10110011 10001111 00001111 10000010  10011000 11100001 11100000 11111010  11001110 00111100 00111110
    // Note this generates quite a long sequence before repeat, but the point is made
    [new Uint8Array(0),''],
    [new Uint8Array(1),'B3'],
    [new Uint8Array(2),'B38F'],
    [new Uint8Array(3),'B38F0F'],
    [new Uint8Array(4),'B38F0F82'],
    [new Uint8Array(5),'B38F0F8298'],
    [new Uint8Array(6),'B38F0F8298E1'],
    [new Uint8Array(7),'B38F0F8298E1E0'],
    [new Uint8Array(8),'B38F0F8298E1E0FA'],
    [new Uint8Array(9),'B38F0F8298E1E0FACE'],
    [new Uint8Array(10),'B38F0F8298E1E0FACE3C'],
    [new Uint8Array(11),'B38F0F8298E1E0FACE3C3E'],
];
i=0;
for (const [fill,expect] of g31_seq_fill) {
    //Rebuild every round to stop state interfering on sequential fills
    const r31b=new Gen31Bit();
    tsts(`Gen31Bit.fillBytes([${fill.length}]`, () => {
        r31b.fillBytes(fill);
        assert.equal(hex.fromBytes(fill), expect);
    });
    i++;
}

tsts.run();