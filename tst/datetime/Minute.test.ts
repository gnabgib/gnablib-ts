import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Minute } from '../../src/datetime/Minute';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { BitReader } from '../../src/primitive/BitReader';

const tsts = suite('Minute');

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6);
	const m = Minute.fromDate(dt);
	assert.is(m.valueOf(), dt.getMinutes());
});

tsts(`fromDateUtc`,()=>{
    //2024-01-20 07:13:30
    const dt=new Date(1705734810);
    const h=Minute.fromDateUtc(dt);
    assert.is(h.valueOf(),dt.getUTCMinutes());
});


tsts(`fromUnixTime`,()=>{
    const m = Minute.fromUnixTime(1705734810);
    assert.is(m.valueOf(),13);
});

tsts(`fromUnixTimeMs`,()=>{
    const m = Minute.fromUnixTimeMs(1705734810543);
    assert.is(m.valueOf(),13);
});

tsts(`fromUnixTimeUs`,()=>{
	const m=Minute.fromUnixTimeUs(1705734810543000);
})

tsts(`now`, () => {
	const m = Minute.now();
	//Near the end of a minute, this test can fail, (but passes otherwise)
	// so we've replaced with a more generic form (not super useful)
	//const dt = new Date();
	//assert.is(m.valueOf(), dt.getMinutes());
	
	const mNum=m.valueOf();
	assert.is(mNum >= 0 && mNum <= 59, true, 'In valid range');
});

tsts(`nowUtc`, () => {
	const dt = new Date();
	const m = Minute.nowUtc();
	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight UTC)
	assert.is(m.valueOf(), dt.getUTCMinutes());
});

const parseSet: [WindowStr, number][] = [
    [WindowStr.new('01'), 1],
	[WindowStr.new('13'), 13],
];
for (const [w, expect] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const stor = new Uint8Array(1);
		const m = Minute.parse(w, true, stor);
		assert.instance(m,Minute);
		assert.equal(m.valueOf(), expect);
	});
}

tsts(`parse(now)`, () => {
	//Turns out setup of unit tests on the full suite is >second so this can't be part of a set
	//Note: This could fail at the end of the year :|
	const m = Minute.parse(WindowStr.new('now'));
	const mNum=m.valueOf();
	assert.is(mNum >= 0 && mNum <= 59, true, 'In valid range');
});

tsts('[Symbol.toStringTag]', () => {
    const dt=Minute.now();
	const str = Object.prototype.toString.call(dt);
	assert.is(str.indexOf('Minute') > 0, true);
});

tsts('util.inspect',()=>{
    const dt=Minute.now();
    const u=util.inspect(dt);
    assert.is(u.startsWith('Minute('),true);
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Minute.storageBytes);
	const stor2=new Uint8Array(Minute.storageBytes);

	const m=Minute.new(22,stor1);
	assert.instance(m,Minute);
	assert.is(m.valueOf(),22);

	const m2=m.cloneTo(stor2);
	assert.instance(m2,Minute);
	assert.is(m2.valueOf(),22);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;
	assert.is(m.valueOf(),22);
	assert.is(m2.valueOf(),13);
})

tsts(`deser`,()=>{
	const bytes=Uint8Array.of(13<<2);//Value in the top 6 bits of byte
	const br=new BitReader(bytes);
	const m=Minute.deserialize(br).validate();
	assert.is(m.valueOf(),13);
});

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();
