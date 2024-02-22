import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Second } from '../../src/datetime/Second';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { BitReader } from '../../src/primitive/BitReader';

const tsts = suite('Second');

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6);
	const m = Second.fromDate(dt);
	assert.is(m.valueOf(), dt.getSeconds());
});

tsts(`fromDateUtc`, () => {
	const dt=new Date(1705734810);
	const m = Second.fromDateUtc(dt);
	assert.is(m.valueOf(), dt.getUTCSeconds());
});

tsts(`fromUnixTime`, () => {
	const m = Second.fromUnixTime(1705734810);
	assert.is(m.valueOf(), 30);
});

tsts(`fromUnixTimeMs`, () => {
	const m = Second.fromUnixTimeMs(1705734810543);
	assert.is(m.valueOf(), 30);
});

tsts(`fromUnixTimeMs`, () => {
	const m = Second.fromUnixTimeUs(1705734810543000);
	assert.is(m.valueOf(), 30);
});


tsts(`now`, () => {
	const s = Second.now();
	//Near the end of a second, this test can fail, (but passes otherwise)
	// so we've replaced with a more generic form (not super useful)
	//const dt = new Date();
	//assert.is(s.valueOf(), dt.getSeconds());

	const sNum=s.valueOf();
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
});

const parseSet: [WindowStr, number][] = [
    [WindowStr.new('01'), 1],
	[WindowStr.new('13'), 13],
];
for (const [w, expect] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const stor = new Uint8Array(1);
		const s = Second.parse(w, true,stor);
		assert.instance(s,Second);
		assert.equal(s.valueOf(), expect);
	});
}

tsts(`parse(now)`, () => {
	const s = Second.parse(WindowStr.new('now'));
	const sNum=s.valueOf();
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
});


tsts('[Symbol.toStringTag]', () => {
    const dt=Second.now();
	const str = Object.prototype.toString.call(dt);
	assert.is(str.indexOf('Second') > 0, true);
});

tsts('util.inspect',()=>{
    const dt=Second.now();
    const u=util.inspect(dt);
    assert.is(u.startsWith('Second('),true);
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Second.storageBytes);
	const stor2=new Uint8Array(Second.storageBytes);

	const s=Second.new(22,stor1);
	assert.instance(s,Second);
	assert.is(s.valueOf(),22);

	const s2=s.cloneTo(stor2);
	assert.instance(s2,Second);
	assert.is(s2.valueOf(),22);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;
	assert.is(s.valueOf(),22);
	assert.is(s2.valueOf(),13);
})

tsts(`deser`,()=>{
	const bytes=Uint8Array.of(13<<2);//Value in the top 6 bits of byte
	const br=new BitReader(bytes);
	const s=Second.deserialize(br).validate();
	assert.is(s.valueOf(),13);
});

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();
