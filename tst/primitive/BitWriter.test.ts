import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import util from 'util';

const tsts = suite('BitWriter');

tsts('3x2,5x3,7x4,0x2,Fx2 in 2 bytes-2',()=>{
    const fill=new Uint8Array(2);
    const bw=BitWriter.mount(fill)
    assert.equal(bw.pushNumberBE(3,2),true,'push 11');
    assert.equal(hex.fromBytes(fill), 'C000');//11^00 0000 0000 0000
    assert.equal(bw.pushNumberBE(5,3),true,'push 101');
    assert.equal(hex.fromBytes(fill), 'E800');//1110 1^000 0000 0000
    assert.equal(bw.pushNumberBE(7,4),true,'push 0111');
    assert.equal(hex.fromBytes(fill), 'EB80');//1110 1011 1^000 0000
    assert.equal(bw.pushNumberBE(0,2),true,'push 00');
    assert.equal(hex.fromBytes(fill), 'EB80');//1110 1011 100^0 0000
    assert.equal(bw.pushNumberBE(0x3,2),true,'push 11');
    assert.equal(hex.fromBytes(fill), 'EB98');//1110 1011 1001 1^000
    assert.equal(bw.pushNumberBE(0,3),true,'push 000');//This is just here to make sure exact bits doesn't cause a size override
    // 3x2 =b11, 5x3 = b101, 7x4 = b0111, 0x2 = b00, fx2 = b11 = 1110101110011000
    assert.is(hex.fromBytes(fill),'EB98');
});

tsts(`reset`,()=>{
    const target=new Uint8Array(2);
    assert.equal(hex.fromBytes(target),'0000')
    
    const bw=BitWriter.mount(target);
    bw.pushNumberBE(255,8);
    assert.equal(hex.fromBytes(target),'FF00')
    
    bw.reset();
    bw.pushNumberBE(0x12,8);
    assert.equal(hex.fromBytes(target),'1200')

    bw.reset();
    bw.pushNumberBE(0xF,4);
    assert.equal(hex.fromBytes(target),'F000',"Note the byte is replaced even though only some bits were written");
    bw.pushNumberBE(0xFF,8);
    assert.equal(hex.fromBytes(target),'FFF0');
    
    bw.reset();
    bw.pushNumberBE(0,1);
    assert.equal(hex.fromBytes(target),'00F0',"Note prior data from byte 2 isn't erased");
});

const seq_full:[Uint8Array,number,number,boolean][]=[
    [new Uint8Array(0),0,0,true],
    [new Uint8Array(0),0,1,true],
    [new Uint8Array(1),0,0,false],
    [new Uint8Array(1),0,7,false],
    [new Uint8Array(1),0,8,true], 
    [new Uint8Array(1),0,40,true], //Can exceed
];
for(const [fill,n32,bits,full] of seq_full) {
    const bw=BitWriter.mount(fill);
    tsts(`BitWriter(${fill.length}).pushNumberBE(${n32},${bits}).full`, () => {
        bw.pushNumberBE(n32,bits);
        assert.equal(bw.full,full);
    });
}

const push_space_tests:[Uint8Array,number,number,number][]=[
    [new Uint8Array(0),0,0,0],
    [new Uint8Array(0),0,1,0],
    [new Uint8Array(1),0,0,8],
    [new Uint8Array(1),0xff,0,8],
    [new Uint8Array(1),0xff,1,7],
    [new Uint8Array(1),0xff,7,1],
    [new Uint8Array(1),0xff,8,0],
    [new Uint8Array(1),0xff,9,0], 
];
for(const [fill,n32,bits,spaceBits] of push_space_tests) {
    tsts(`BitWriter(${fill.length}).pushNumberBE(${n32},${bits}).space`, () => {
        const bw=BitWriter.mount(fill);
        bw.pushNumberBE(n32,bits);
        assert.equal(bw.spaceBits,spaceBits);
    });
}

const push_fit_tests:[Uint8Array,number,number,boolean][]=[
    [new Uint8Array(0),0,0,true],
    [new Uint8Array(0),0,1,false],
    [new Uint8Array(1),0xFF,1,true],
    [new Uint8Array(1),0xFF,7,true],
    [new Uint8Array(1),0xFF,8,true],
    [new Uint8Array(1),0xFF,9,false],
];
for(const [fill,n32,bits,fits] of push_fit_tests) {
    tsts(`BitWriter(${fill.length}).pushNumberBE(${n32},${bits})`, () => {
        const bw=BitWriter.mount(fill);
        assert.equal(bw.pushNumberBE(n32,bits),fits);
    });
    tsts(`BitWriter(${fill.length}).mustPushNumberBE(${n32},${bits})`, () => {
        const bw=BitWriter.mount(fill);
        if (!fits) assert.throws(()=>bw.mustPushNumberBE(n32,bits));
        else bw.mustPushNumberBE(n32,bits)
    });
}

const push_1byte_bitSet_tests:[number,number,number,string][]=[
    [0,0,0,'00'],
    [0,1,1,'80'],
    [1,1,1,'40'],
    [2,1,1,'20'],
    [3,1,1,'10'],
    [4,1,1,'08'],
    [0,3,2,'C0'],
    [1,3,2,'60'],
    [2,3,2,'30'],
    [3,3,2,'18'],
    [4,3,2,'0C'],
    [5,3,2,'06'],
    [6,3,2,'03'],
    [7,3,2,'01'],
];
for(const [startBit,n32,bits,expect] of push_1byte_bitSet_tests) {
    tsts(`BitWriter(buff,${startBit}).pushNumberBE(${n32},${bits})`, () => {
        const buff=new Uint8Array(1);
        const bw=BitWriter.mount(buff,startBit);
        bw.pushNumberBE(n32,bits);
        assert.equal(hex.fromBytes(buff), expect);
    });
}

tsts('BitWriter with out of range startBit throws',()=>{
    const buff=new Uint8Array(1);
    assert.throws(()=>BitWriter.mount(buff,-1));
    assert.throws(()=>BitWriter.mount(buff,8));
});


const w28=0b1111111011011100101110101001;
const seq_w28:[Uint8Array,string][]=[
    //11111110 11011100 10111010 1001|0000  00000000 00000000 00000000 00000000
    [new Uint8Array(0),''],
    [new Uint8Array(1),'FE'],
    [new Uint8Array(2),'FEDC'],
    [new Uint8Array(3),'FEDCBA'],
    [new Uint8Array(4),'FEDCBA90'],
    [new Uint8Array(5),'FEDCBA9000'],
    [new Uint8Array(6),'FEDCBA900000'],
    [new Uint8Array(7),'FEDCBA90000000'],
    [new Uint8Array(8),'FEDCBA9000000000'],
];
for (const [fill,expect] of seq_w28) {
    const bw=BitWriter.mount(fill);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(w28)`, () => {
        bw.pushNumberBE(w28,28);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_1w28:[Uint8Array,string][]=[
    //0|1111111 01101110 01011101 01001|000  00000000 00000000 00000000 00000000
    //7F 6E 5D 48  
    [new Uint8Array(0),''],
    [new Uint8Array(1),'7F'],
    [new Uint8Array(2),'7F6E'],
    [new Uint8Array(3),'7F6E5D'],
    [new Uint8Array(4),'7F6E5D48'],
    [new Uint8Array(5),'7F6E5D4800'],
    [new Uint8Array(6),'7F6E5D480000'],
    [new Uint8Array(7),'7F6E5D48000000'],
    [new Uint8Array(8),'7F6E5D4800000000'],
];
for (const [fill,expect] of seq_1w28) {
    const bw2=BitWriter.mount(fill);
    bw2.pushNumberBE(0,1);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(1w28)`, () => {
        bw2.pushNumberBE(w28,28);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_2w28:[Uint8Array,string][]=[
    //00|111111 10110111 00101110 101001|00  00000000 00000000 00000000 00000000
    //3F B7 2E A4
    [new Uint8Array(0),''],
    [new Uint8Array(1),'3F'],
    [new Uint8Array(2),'3FB7'],
    [new Uint8Array(3),'3FB72E'],
    [new Uint8Array(4),'3FB72EA4'],
    [new Uint8Array(5),'3FB72EA400'],
    [new Uint8Array(6),'3FB72EA40000'],
    [new Uint8Array(7),'3FB72EA4000000'],
    [new Uint8Array(8),'3FB72EA400000000'],
];
for (const [fill,expect] of seq_2w28) {
    const bw2=BitWriter.mount(fill);
    bw2.pushNumberBE(0,2);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(2w28)`, () => {
        bw2.pushNumberBE(w28,28);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_3w28:[Uint8Array,string][]=[
    //000|11111 11011011 10010111 0101001|0  00000000 00000000 00000000 00000000
    //1F DB 97 52
    [new Uint8Array(0),''],
    [new Uint8Array(1),'1F'],
    [new Uint8Array(2),'1FDB'],
    [new Uint8Array(3),'1FDB97'],
    [new Uint8Array(4),'1FDB9752'],
    [new Uint8Array(5),'1FDB975200'],
    [new Uint8Array(6),'1FDB97520000'],
    [new Uint8Array(7),'1FDB9752000000'],
    [new Uint8Array(8),'1FDB975200000000'],
];
for (const [fill,expect] of seq_3w28) {
    const bw2=BitWriter.mount(fill);
    bw2.pushNumberBE(0,3);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(3w28)`, () => {
        bw2.pushNumberBE(w28,28);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_4w28:[Uint8Array,string][]=[
    //0000|1111 11101101 11001011 10101001  00000000 00000000 00000000 00000000
    //0F ED CB A9
    [new Uint8Array(0),''],
    [new Uint8Array(1),'0F'],
    [new Uint8Array(2),'0FED'],
    [new Uint8Array(3),'0FEDCB'],
    [new Uint8Array(4),'0FEDCBA9'],
    [new Uint8Array(5),'0FEDCBA900'],
    [new Uint8Array(6),'0FEDCBA90000'],
    [new Uint8Array(7),'0FEDCBA9000000'],
    [new Uint8Array(8),'0FEDCBA900000000'],
];
for (const [fill,expect] of seq_4w28) {
    const bw2=BitWriter.mount(fill);
    bw2.pushNumberBE(0,4);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(4w28)`, () => {
        bw2.pushNumberBE(w28,28);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_5w28:[Uint8Array,string][]=[
    //00000|111 11110110 11100101 11010100 10000000 00000000 00000000 00000000
    //07 F6 E5 D4 80
    [new Uint8Array(0),''],
    [new Uint8Array(1),'07'],
    [new Uint8Array(2),'07F6'],
    [new Uint8Array(3),'07F6E5'],
    [new Uint8Array(4),'07F6E5D4'],
    [new Uint8Array(5),'07F6E5D480'],
    [new Uint8Array(6),'07F6E5D48000'],
    [new Uint8Array(7),'07F6E5D4800000'],
    [new Uint8Array(8),'07F6E5D480000000'],
];
for (const [fill,expect] of seq_5w28) {
    const bw2=BitWriter.mount(fill);
    bw2.pushNumberBE(0,5);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(5w28)`, () => {
        bw2.pushNumberBE(w28,28);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_6w28:[Uint8Array,string][]=[
    //000000|11 11111011 01110010 11101010 01000000 00000000 00000000 00000000
    //03 FB 72 EA 40
    [new Uint8Array(0),''],
    [new Uint8Array(1),'03'],
    [new Uint8Array(2),'03FB'],
    [new Uint8Array(3),'03FB72'],
    [new Uint8Array(4),'03FB72EA'],
    [new Uint8Array(5),'03FB72EA40'],
    [new Uint8Array(6),'03FB72EA4000'],
    [new Uint8Array(7),'03FB72EA400000'],
    [new Uint8Array(8),'03FB72EA40000000'],
];
for (const [fill,expect] of seq_6w28) {
    const bw2=BitWriter.mount(fill);
    bw2.pushNumberBE(0,6);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(6w28)`, () => {
        bw2.pushNumberBE(w28,28);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_7w28:[Uint8Array,string][]=[
    //0000000|1 11111101 10111001 01110101 00100000 00000000 00000000 00000000
    //01 FD B9 75 20
    [new Uint8Array(0),''],
    [new Uint8Array(1),'01'],
    [new Uint8Array(2),'01FD'],
    [new Uint8Array(3),'01FDB9'],
    [new Uint8Array(4),'01FDB975'],
    [new Uint8Array(5),'01FDB97520'],
    [new Uint8Array(6),'01FDB9752000'],
    [new Uint8Array(7),'01FDB975200000'],
    [new Uint8Array(8),'01FDB97520000000'],
];
for (const [fill,expect] of seq_7w28) {
    const bw2=BitWriter.mount(fill);
    bw2.pushNumberBE(0,7);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(7w28)`, () => {
        bw2.pushNumberBE(w28,28);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_8w28:[Uint8Array,boolean,string][]=[
    //00000000 11111110 11011100 10111010 1001|0000  00000000 00000000 00000000 00000000
    //00 FE DC BA 90
    [new Uint8Array(0),false,''],
    [new Uint8Array(1),false,'00'],
    [new Uint8Array(2),false,'00FE'],
    [new Uint8Array(3),false,'00FEDC'],
    [new Uint8Array(4),false,'00FEDCBA'],
    [new Uint8Array(5),true,'00FEDCBA90'],
    [new Uint8Array(6),true,'00FEDCBA9000'],
    [new Uint8Array(7),true,'00FEDCBA900000'],
    [new Uint8Array(8),true,'00FEDCBA90000000'],
];
for (const [fill,fit,expect] of seq_8w28) {
    const bw=BitWriter.mount(fill);
    bw.pushNumberBE(0,8);
    tsts(`BitWriter2(${fill.length}).pushNumberBE(8w28)`, () => {
        assert.equal(bw.pushNumberBE(w28,28),fit);
        assert.equal(hex.fromBytes(fill), expect);
    });
}
const seq_w28w32:[Uint8Array,string][]=[
    //11111110 11011100 10111010 1001^1000 01110110 01010100 00110010 0001|1111 
    //11101101 11001011 10101001 ^10000111 01100101 01000011 00100001 |11111110 
    //11011100 10111010 1001^1000 01110110 01010100 00110010 0001
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
    [new Uint8Array(8),'FEDCBA9876543210'],
];for (const [fill,expect] of seq_w28w32) {
    const bw=BitWriter.mount(fill);
    bw.pushNumberBE(0xFEDCBA9,28);
    bw.pushNumberBE(0x87654321,32);
    tsts(`BW2[${fill.length}].pushNumberBE(w28w32)`, () => {
        assert.equal(hex.fromBytes(fill), expect);
    });
}

tsts('[Symbol.toStringTag]', () => {
    const bytes=new Uint8Array(0);
    const bw=BitWriter.mount(bytes);
    assert.is(Object.prototype.toString.call(bw).indexOf("BitWriter")>0,true,'toString is set');
});

tsts('util.inspect',()=>{
    const bytes=new Uint8Array(0);
    const bw=BitWriter.mount(bytes);
    const u=util.inspect(bw);
    assert.is(u.startsWith('BitWriter('),true);
});

tsts.run();
