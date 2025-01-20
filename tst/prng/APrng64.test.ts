import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { APrng64 } from '../../src/prng/APrng64';
import { hex } from '../../src/codec/Hex';
import { U64, U64MutArray } from '../../src/primitive/number';

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
abstract class ZeroByteState extends APrng64<U64MutArray> {
    constructor() {
        super(U64MutArray.fromLen(0),false);
    }
}
class Gen16Bit extends ZeroByteState {
    readonly bitGen=16;
    readonly safeBits=this.bitGen;

    rawNext(): U64 {
        //x9234
        // 37428
        //b1001001000110100
        return U64.fromUint32Pair(0x9234,0);
    }

}
class Gen60Bit extends ZeroByteState {
    readonly bitGen=60;
    readonly safeBits:number;

    constructor(offset=0) {
        super();
        this.safeBits=this.bitGen-offset;
    }

    rawNext(): U64 {
        //xFEDCBA987654321
        // 1147797409030816545
        //b111111101101110010111010100110000111011001010100001100100001
        return U64.fromUint32Pair(0x87654321,0xFEDCBA9);
    }
}
class Gen33Bit extends ZeroByteState {
    readonly bitGen=33;
    readonly safeBits:number;

    constructor(offset=0) {
        super();
        this.safeBits=this.bitGen-offset;
    }

    rawNext(): U64 {
        //xFEDCBA987654321
        // 1147797409030816545
        //b110000111011001010100001100100001
        return U64.fromUint32Pair(0x87654321,1);
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

tsts(`Gen60Bit.seqU64(3)`,()=>{
    const u64_3=U64MutArray.fromU64s(...rng60.seqU64(3));
    assert.equal(hex.fromU64a(u64_3),'FEDCBA987654321FFEDCBA987654321FFEDCBA987654321F');
});

const seq_fill60:[Uint8Array,string][]=[
    // //11111110 11011100 10111010 1001^1000 01110110 01010100 00110010 0001|1111 
    // //11101101 11001011 10101001 ^10000111 01100101 01000011 00100001 |11111110 
    // //11011100 10111010 1001^1000 01110110 01010100 00110010 0001
    // [28 32]

    // //FE DC BA 98  76 54 32 1F
    // //ED CB A9 87  65 43 21 (...repeats)
    [new Uint8Array(0),''],
    [new Uint8Array(1),'FE'],
    [new Uint8Array(2),'FEDC'],
    [new Uint8Array(3),'FEDCBA'],
    [new Uint8Array(4),'FEDCBA98'],
    [new Uint8Array(5),'FEDCBA9876'],
    [new Uint8Array(6),'FEDCBA987654'],
    [new Uint8Array(7),'FEDCBA98765432'],
    [new Uint8Array(8),'FEDCBA987654321F'],
    [new Uint8Array(9),'FEDCBA987654321FED'],
    [new Uint8Array(10),'FEDCBA987654321FEDCB'],
    [new Uint8Array(11),'FEDCBA987654321FEDCBA9'],
    [new Uint8Array(12),'FEDCBA987654321FEDCBA987'],
    [new Uint8Array(13),'FEDCBA987654321FEDCBA98765'],
    [new Uint8Array(14),'FEDCBA987654321FEDCBA9876543'],
    [new Uint8Array(15),'FEDCBA987654321FEDCBA987654321'],
    [new Uint8Array(16),'FEDCBA987654321FEDCBA987654321FE'],
];
i=0;
for (const [fill,expect] of seq_fill60) {
	//Rebuild every round to stop state interfering on sequential fills
	const rng60b=new Gen60Bit();
    //28 , 20 , 12 , 4|32->28 , 20 , 14 , 6
	tsts(`Gen60Bit.fillBytes([${fill.length}]`, () => {
		rng60b.fillBytes(fill);
		assert.equal(hex.fromBytes(fill), expect);
	});
	i++;
}
const seq_fill59:[Uint8Array,string][]=[
    //11111110 11011100 10111010 1001^1000  01110110 01010100 00110010 000|11111
    //11011011 10010111 01010011 00001110  11001010 10000110 010000|11 11111011
    //01110010 11101010 01100001 11011001  01010000 11001000 0|
    //FE DC BA 98  76 54 32 1F
    //DB 97 53 0E  CA 86 43 FB
    //72 EA 61 D9  50 C8
    // [ 28 32-1 ]

    [new Uint8Array(0),''],
    [new Uint8Array(1),'FE'],
    [new Uint8Array(2),'FEDC'],
    [new Uint8Array(3),'FEDCBA'],
    [new Uint8Array(4),'FEDCBA98'],
    [new Uint8Array(5),'FEDCBA9876'],
    [new Uint8Array(6),'FEDCBA987654'],
    [new Uint8Array(7),'FEDCBA98765432'],
    [new Uint8Array(8),'FEDCBA987654321F'],
    [new Uint8Array(9),'FEDCBA987654321FDB'],
    [new Uint8Array(10),'FEDCBA987654321FDB97'],
    [new Uint8Array(11),'FEDCBA987654321FDB9753'],
    [new Uint8Array(12),'FEDCBA987654321FDB97530E'],
    [new Uint8Array(13),'FEDCBA987654321FDB97530ECA'],
    [new Uint8Array(14),'FEDCBA987654321FDB97530ECA86'],
    [new Uint8Array(15),'FEDCBA987654321FDB97530ECA8643'],
    [new Uint8Array(16),'FEDCBA987654321FDB97530ECA8643FB'],
    [new Uint8Array(17),'FEDCBA987654321FDB97530ECA8643FB72'],
    [new Uint8Array(18),'FEDCBA987654321FDB97530ECA8643FB72EA'],
];
i=0;
for (const [fill,expect] of seq_fill59) {
	//Rebuild every round to stop state interfering on sequential fills
	const rng59=new Gen60Bit(1);
	tsts(`Gen59.fillBytes([${fill.length}]`, () => {
		rng59.fillBytes(fill);
		assert.equal(hex.fromBytes(fill), expect);
	});
	i++;
}
const seq_fill48:[Uint8Array,string][]=[
    //11111110 11011100 10111010 1001^1000  01110110 01010100 |11111110 11011100 
    //10111010 1001^1000 01110110 01010100  |11111110 11011100 10111010 1001^1000  
    //01110110 01010100
    //FE DC BA 98  76 54 FE DC
    //BA 98 76 54  FE DC BA 98
    //76 54
    // [28 20]

    [new Uint8Array(0),''],
    [new Uint8Array(1),'FE'],
    [new Uint8Array(2),'FEDC'],
    [new Uint8Array(3),'FEDCBA'],
    [new Uint8Array(4),'FEDCBA98'],
    [new Uint8Array(5),'FEDCBA9876'],
    [new Uint8Array(6),'FEDCBA987654'],
    [new Uint8Array(7),'FEDCBA987654FE'],
    [new Uint8Array(8),'FEDCBA987654FEDC'],
    [new Uint8Array(9),'FEDCBA987654FEDCBA'],
    [new Uint8Array(10),'FEDCBA987654FEDCBA98'],
    [new Uint8Array(11),'FEDCBA987654FEDCBA9876'],
    [new Uint8Array(12),'FEDCBA987654FEDCBA987654'],
    [new Uint8Array(13),'FEDCBA987654FEDCBA987654FE'],
    [new Uint8Array(14),'FEDCBA987654FEDCBA987654FEDC'],
    [new Uint8Array(15),'FEDCBA987654FEDCBA987654FEDCBA'],
    [new Uint8Array(16),'FEDCBA987654FEDCBA987654FEDCBA98'],
    [new Uint8Array(17),'FEDCBA987654FEDCBA987654FEDCBA9876'],
    [new Uint8Array(18),'FEDCBA987654FEDCBA987654FEDCBA987654'],
];
i=0;
for (const [fill,expect] of seq_fill48) {
	//Rebuild every round to stop state interfering on sequential fills
	const rng48=new Gen60Bit(12);
	tsts(`Gen48.fillBytes([${fill.length}]`, () => {
		rng48.fillBytes(fill);
		assert.equal(hex.fromBytes(fill), expect);
	});
	i++;
}
const seq_fill33:[Uint8Array,string][]=[
    //1^1000011 10110010 10100001 10010000 1|1^100001 11011001 01010000 11001000
    //01|1^10000 11101100 10101000 01100100 001
    //C3 B2 A1 90  E1 D9 50 C8
    //70 EC A8 64 
    // [1 32]
    [new Uint8Array(0),''],
    [new Uint8Array(1),'C3'],
    [new Uint8Array(2),'C3B2'],
    [new Uint8Array(3),'C3B2A1'],
    [new Uint8Array(4),'C3B2A190'],
    [new Uint8Array(5),'C3B2A190E1'],
    [Uint8Array.of(0xff,0xff,0xff,0xff,0xff),'C3B2A190E1'],//prove that content replaced
    [new Uint8Array(6),'C3B2A190E1D9'],
    [new Uint8Array(7),'C3B2A190E1D950'],
    [new Uint8Array(8),'C3B2A190E1D950C8'],
    [new Uint8Array(9),'C3B2A190E1D950C870'],
    [new Uint8Array(10),'C3B2A190E1D950C870EC'],
    [new Uint8Array(11),'C3B2A190E1D950C870ECA8'],
    [new Uint8Array(12),'C3B2A190E1D950C870ECA864'],
];
i=0;
for (const [fill,expect] of seq_fill33) {
	//Rebuild every round to stop state interfering on sequential fills
	const rng33=new Gen33Bit(0);
	tsts(`Gen33.fillBytes([${fill.length}]`, () => {
		rng33.fillBytes(fill);
		assert.equal(hex.fromBytes(fill), expect);
	});
	i++;
}
const seq_fill2:[Uint8Array,string][]=[
    //This will generate all 1s, it's the minimum bitGen size (33) and the minimum safeBits size(2)
    // just to test extremes of the algo
    //1^1|1^1...
    // [1 1]
    [new Uint8Array(0),''],
    [new Uint8Array(1),'FF'],
    [new Uint8Array(2),'FFFF'],
    [new Uint8Array(3),'FFFFFF'],
    [new Uint8Array(4),'FFFFFFFF'],
    [new Uint8Array(5),'FFFFFFFFFF'],
];
i=0;
for (const [fill,expect] of seq_fill2) {
	//Rebuild every round to stop state interfering on sequential fills
	const rng2=new Gen33Bit(31);
	tsts(`Gen2.fillBytes([${fill.length}]`, () => {
		rng2.fillBytes(fill);
		assert.equal(hex.fromBytes(fill), expect);
	});
	i++;
}
const seq_fill3:[Uint8Array,string][]=[
    //1^10|1^10|1^1 0|1^10|1^10|1 ^10|1^10|1^10 ...
    //11011011 01101101 10110110
    //DB 6D B6
    // [1 2]
    [new Uint8Array(0),''],
    [new Uint8Array(1),'DB'],
    [new Uint8Array(2),'DB6D'],
    [new Uint8Array(3),'DB6DB6'],
    [new Uint8Array(4),'DB6DB6DB'],
];
i=0;
for (const [fill,expect] of seq_fill3) {
	//Rebuild every round to stop state interfering on sequential fills
	const rng3=new Gen33Bit(30);
	tsts(`Gen3.fillBytes([${fill.length}]`, () => {
		rng3.fillBytes(fill);
		assert.equal(hex.fromBytes(fill), expect);
	});
	i++;
}



tsts.run();