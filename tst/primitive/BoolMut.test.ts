import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { BoolMut } from '../../src/primitive/Bool';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';

const tsts = suite('BoolMut');

const from_tests: [boolean | number, boolean][] = [
    [0, false],
    [1, true],
    [-1, true],
    [false, false],
    [true, true],

    //Since we can't avoid FP numbers.. let's check they follow reasonable rules
    [1.1, true],
    [0.001, true],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, true],
    [Number.NEGATIVE_INFINITY, true],
];
for (const [v, expect] of from_tests) {
    tsts(`from(${v})`, () => {
        const o = BoolMut.from(v);
        assert.is(o.valueOf(), expect);
    });
}

tsts(`mount`, () => {
    const b = new Uint8Array(2);
    assert.is(hex.fromBytes(b), '0000');
    const o = BoolMut.mount(b, 1);
    assert.is(o.valueOf(), false);
    b[1] = 0b1;
    assert.is(o.valueOf(), true, 'updating underlying byte changes value');
    b[1] = 0b10;
    assert.is(
        o.valueOf(),
        false,
        'only the lowest bit of the byte effects value'
    );
    b[0] = 0b1;
    assert.is(o.valueOf(), false, 'other bytes are ignored');
});

const serial_tests: [boolean, number][] = [
    [true, 0x80],
    [false, 0],
];
for (const [v, ser] of serial_tests) {
    tsts(`serial(${v})`, () => {
        const b = new Uint8Array(1);
        const bw = BitWriter.mount(b);
        const o = BoolMut.from(v);
        assert.is(b[0], 0);
        o.serial(bw);
        assert.is(b[0], ser);
    });
    tsts(`deserial(${ser})`, () => {
        const b = Uint8Array.of(ser);
        const br = BitReader.mount(b);
        const o = BoolMut.deserial(br);
        assert.is(o.valueOf(), v);
    });
}

tsts(`set`,()=>{
    const a=BoolMut.from(true);
    assert.is(a.valueOf(),true);
    a.set(false);
    assert.is(a.valueOf(),false);
});

tsts('util.inspect', () => {
    const u = util.inspect(BoolMut.from(true));
    assert.is(u.startsWith('BoolMut('), true);
});


tsts.run();
