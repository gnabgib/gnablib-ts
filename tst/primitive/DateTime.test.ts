import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { DateTime, U64 } from '../../src/primitive';
import { hex } from '../../src/codec';

const tsts = suite('DateTime');

// prettier-ignore
const creates=[
    {y:2000,m:1,d:2,h:3,i:4,s:5,u:678901,str:'2000-01-02T03:04:05.678901Z',ser: '04AFAFE2925FAF35'},
    {y:-4713,m:1,d:1,h:0,i:0,s:0,u:0,str:'-4713-01-01T00:00:00.000000Z',ser:    '0000000000000000'},//Earliest date
    {y:294276 ,m:12,d:31,h:23,i:59,s:59,u:999999,str:'294276-12-31T23:59:59.999999Z',ser:'D0B8C8741DD75FFF'},//Last date
    {y:-100,m:1,d:2,h:3,i:4,s:5,u:678901,str:'-0100-01-02T03:04:05.678901Z',ser:'033864E2925FAF35'},
    {y:100,m:1,d:2,h:3,i:4,s:5,u:678901,str:'0100-01-02T03:04:05.678901Z',ser:  '035C22E2925FAF35'},
    //Leap year
    {y:2004,m:1,d:31,h:3,i:4,s:5,u:678901,str:'2004-01-31T03:04:05.678901Z',ser:'04B06A82925FAF35'},
    {y:2004,m:2,d:1,h:3,i:4,s:5,u:678901,str:'2004-02-01T03:04:05.678901Z',ser: '04B06AA2925FAF35'},
    {y:2004,m:2,d:28,h:3,i:4,s:5,u:678901,str:'2004-02-28T03:04:05.678901Z',ser:'04B06E02925FAF35'},
    {y:2004,m:2,d:29,h:3,i:4,s:5,u:678901,str:'2004-02-29T03:04:05.678901Z',ser:'04B06E22925FAF35'},
    {y:2004,m:3,d:1,h:3,i:4,s:5,u:678901,str:'2004-03-01T03:04:05.678901Z',ser: '04B06E42925FAF35'},
    {y:2004,m:4,d:1,h:3,i:4,s:5,u:678901,str:'2004-04-01T03:04:05.678901Z',ser: '04B07222925FAF35'},
    {y:2003,m:1,d:1,h:0,i:0,s:0,u:0,str:'2003-01-01T00:00:00.000000Z',ser:      '04B0390000000000'},
    {y:2003,m:12,d:31,h:0,i:0,s:0,u:0,str:'2003-12-31T00:00:00.000000Z',ser:    '04B0668000000000'},
    {y:2004,m:1,d:1,h:0,i:0,s:0,u:0,str:'2004-01-01T00:00:00.000000Z',ser:      '04B066C000000000'},
    {y:2004,m:12,d:31,h:0,i:0,s:0,u:0,str:'2004-12-31T00:00:00.000000Z',ser:    '04B0946000000000'},
    {y:2005,m:1,d:1,h:0,i:0,s:0,u:0,str:'2005-01-01T00:00:00.000000Z',ser:      '04B0948000000000'},
    {y:2005,m:12,d:31,h:0,i:0,s:0,u:0,str:'2005-12-31T00:00:00.000000Z',ser:    '04B0C20000000000'},
    {y:2007,m:1,d:1,h:0,i:0,s:0,u:0,str:'2007-01-01T00:00:00.000000Z',ser:      '04B0F00000000000'},
    {y:2007,m:12,d:31,h:0,i:0,s:0,u:0,str:'2007-12-31T00:00:00.000000Z',ser:    '04B11D8000000000'},
    {y:2008,m:1,d:1,h:0,i:0,s:0,u:0,str:'2008-01-01T00:00:00.000000Z',ser:      '04B11DC000000000'},
    {y:2008,m:12,d:31,h:0,i:0,s:0,u:0,str:'2008-12-31T00:00:00.000000Z',ser:    '04B14B6000000000'},
    //Not leap (400)
    {y:2000,m:2,d:28,h:3,i:4,s:5,u:678901,str:'2000-02-28T03:04:05.678901Z',ser:'04AFB702925FAF35'},
    {y:2000,m:3,d:1,h:3,i:4,s:5,u:678901,str:'2000-03-01T03:04:05.678901Z',ser: '04AFB742925FAF35'},
]

for (const create of creates) {
	tsts('Create:' + create.str, () => {
		const dt = new DateTime(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(dt.toString(), create.str);
		assert.equal(dt.year, create.y);
		assert.equal(dt.month, create.m);
		assert.equal(dt.day, create.d);
		assert.equal(dt.hour, create.h);
		assert.equal(dt.minute, create.i);
		assert.equal(dt.second, create.s);
		assert.equal(dt.micro, create.u);
	});
}

for (const create of creates) {
	tsts('Ser/deser:' + create.str, () => {
		const b = hex.toBytes(create.ser);
		const ser = U64.fromBytesBE(b);
		const dt = new DateTime(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(dt.serialize(), ser,'ser');
		const dt2 = DateTime.deserialize(ser);

		// console.log(dt);
		// console.log(dt2);

		assert.equal(dt2.equals(dt), true, 'Compare deser to ser');
	});
}

tsts('now', () => {
	const now = DateTime.now();
	//Bit hard to write a test for this
	assert.equal(now.toString().length > 0, true);
	//console.log(now.toString());
});

tsts('Create from epochMillis /w Fraction', () => {
	const dt = DateTime.fromEpochMilliseconds(1656972775676.071);
	assert.equal(dt.toString(), '2022-07-04T22:12:55.676071Z');
	assert.equal(2022, dt.year);
	assert.equal(7, dt.month);
	assert.equal(4, dt.day);
	assert.equal(22, dt.hour);
	assert.equal(12, dt.minute);
	assert.equal(55, dt.second);
	assert.equal(676071, dt.micro);
});

tsts('Create from whole epochMillis', () => {
	const dt = DateTime.fromEpochMilliseconds(1656972775676);
	assert.equal(dt.toString(), '2022-07-04T22:12:55.676000Z');
	assert.equal(2022, dt.year);
	assert.equal(7, dt.month);
	assert.equal(4, dt.day);
	assert.equal(22, dt.hour);
	assert.equal(12, dt.minute);
	assert.equal(55, dt.second);
	assert.equal(676000, dt.micro);
});

tsts.run();
