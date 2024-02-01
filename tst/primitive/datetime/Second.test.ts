import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Second } from '../../../src/primitive/datetime/Second';
import util from 'util';

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

tsts(`now`, () => {
	const s = Second.now();
	//Near the end of a second, this test can fail, (but passes otherwise)
	// so we've replaced with a more generic form (not super useful)
	//const dt = new Date();
	//assert.is(s.valueOf(), dt.getSeconds());

	const sNum=s.valueOf();
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
});
tsts(`parse(now)`, () => {
	const s = Second.parse('now');
	const sNum=s.valueOf();
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
});

tsts(`parse(1)`, () => {
	const s = Second.parse('1');
	assert.equal(s.valueOf(), 1);
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

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();
