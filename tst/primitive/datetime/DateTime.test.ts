import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { DateTime } from '../../../src/primitive/datetime/DateTime';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';

const tsts = suite('DateTime');

const emptyBytes = new Uint8Array(0);

interface dtParts {
	y: number;
	m: number;
	d: number;
	h: number;
	i: number;
	s: number;
	us: number;
	isUtc: boolean;
}

const serSet: [dtParts, string, string,string][] = [
	[
		//min
		{ y: -10000, m: 1, d: 1, h: 0, i: 0, s: 0, us: 0, isUtc: false },
		'-10000-01-01T00:00:00.000000',
		'0000000000000000',
        '"-10000-01-01T00:00:00.000000"'
	],
	[
		//min UTC
		{ y: -10000, m: 1, d: 1, h: 0, i: 0, s: 0, us: 0, isUtc: true },
		'-10000-01-01T00:00:00.000000Z',
		'0000000000000004',
        '"-10000-01-01T00:00:00.000000Z"'
	],
    [
		{ y: 2024, m: 1, d: 14, h: 11, i: 41, s: 7, us: 543271, isUtc: false },
		'2024-01-14T11:41:07.543271',
		'5DF00D5D23C25138',
        '"2024-01-14T11:41:07.543271"'
    ],
    [
		//max
		{ y: 22767, m: 12, d: 31, h: 23, i: 59, s: 59, us: 999999, isUtc: false },
		'+22767-12-31T23:59:59.999999',
		'FFFF7EBF7DFA11F8',
        '"+22767-12-31T23:59:59.999999"'
	],
    [
		//max UTC
		{ y: 22767, m: 12, d: 31, h: 23, i: 59, s: 59, us: 999999, isUtc: true },
		'+22767-12-31T23:59:59.999999Z',
		'FFFF7EBF7DFA11FC',
        '"+22767-12-31T23:59:59.999999Z"'
	],
];
for (const [o, str, serStr, jsonStr] of serSet) {
    //Note! Because DateOnly fits in 24bits, DateTime.ser = DateOnly.ser + TimeOnly.ser
    // we could use sub types inside DateTime, but then the individual components would
    // be nested (eg You can access `DateTime.Year`, vs `DateTime.Date.Year`)
	const d = DateTime.new(o.y, o.m, o.d, o.h, o.i, o.s, o.us, o.isUtc);
	tsts(`toString(${str})`, () => {
		assert.is(d.toString(), str);
	});
	tsts(`ser(${str})`, () => {
		var bw = new BitWriter(Math.ceil(DateTime.serialBits / 8));
		d.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), serStr);
	});
	tsts(`deser(${serStr})`, () => {
		const bytes = hex.toBytes(serStr);
		const br = new BitReader(bytes);
		const deser = DateTime.deserialize(br).validate();
		assert.is(deser.toString(), str);
	});
    tsts(`toJSON(${str})`,()=>{        
        const json=JSON.stringify(d);
        assert.equal(json,jsonStr);
    });
}

tsts(`deser with invalid source value (FFFFFFFFFFFFFFFFFF) throws`, () => {
    const bytes = Uint8Array.of(0xFF,0xff,0xff,0xff, 0xff, 0xff, 0xff, 0xff);
	const br = new BitReader(bytes);
	assert.throws(() => DateTime.deserialize(br).validate());
});
tsts(`deser without source data throws`, () => {
	const bytes = new Uint8Array();
	const br = new BitReader(bytes);
	assert.throws(() => DateTime.deserialize(br).validate());
});
tsts(`deser without storage space throws`, () => {
	const bytes = Uint8Array.of(0x5D,0xF0,0x0D,0x5D,0x23,0xC2,0x51,0x38);
	const br = new BitReader(bytes);
	assert.throws(() => DateTime.deserialize(br, emptyBytes).validate());
});

tsts(`new`,()=>{
    const d=DateTime.new(2000,1,2,11,41,6,12345,false);
    assert.is(d.toString(),'2000-01-02T11:41:06.012345');
    assert.is(d.year.valueOf(),2000,'year');
    assert.is(d.hour.valueOf(),11,'hour');
    assert.is(d.microsecond.valueOf(), 12345, 'microsecond');
    assert.is(d.isUtc.valueBool(),false,'isUtc');
    //Value off puts all numbers together without delimiters
    assert.is(d.valueOf(),'20000102114106012345');
});

tsts(`fromDate`,()=>{
    // deepcode ignore DateMonthIndex/test: yes, we know
    const dt=new Date(2001,1/*=2 for fucks sake JS*/,3,4,5,6,789);
    const d=DateTime.fromDate(dt);
    assert.is(d.year.valueOf(),2001);
    assert.is(d.month.valueOf(),2);
    assert.is(d.day.valueOf(),3);
    assert.is(d.hour.valueOf(),dt.getHours(),'hour');
    assert.is(d.minute.valueOf(), dt.getMinutes(), 'minute');
    assert.is(d.second.valueOf(), dt.getSeconds(), 'second');
    assert.is(d.microsecond.valueOf(), dt.getMilliseconds()*1000, 'microsecond');
    assert.is(d.isUtc.valueBool(),false,'isUtc');
});

tsts(`toDate`,()=>{
    const epochMs=1705734810542;
    const dt=DateTime.fromUnixTimeMs(epochMs);
    assert.is(dt.toDate().valueOf(),epochMs);
});

tsts(`fromDateUtc`,()=>{
    // deepcode ignore DateMonthIndex/test: yes, we know
    const epoch=1705734810542;
    const dt=new Date(epoch);
    const d=DateTime.fromDateUtc(dt);
    assert.is(d.year.valueOf(),dt.getUTCFullYear(),'year');
    assert.is(d.month.valueOf(),dt.getUTCMonth()+1,'month');//JS stores months off by 1 (0=Jan)
    assert.is(d.day.valueOf(),dt.getUTCDate(),'day');
    assert.is(d.hour.valueOf(),dt.getUTCHours(),'hour');
    assert.is(d.minute.valueOf(), dt.getUTCMinutes(), 'minute');
    assert.is(d.second.valueOf(), dt.getUTCSeconds(), 'second');
    assert.is(d.microsecond.valueOf(), dt.getUTCMilliseconds()*1000, 'microsecond');
    assert.is(d.isUtc.valueBool(),true,'isUtc');
});

const fromUnixTimeMsSet: [number, string][] = [
    //2024-01-20 07:13:30.542
	[1705734810542, '2024-01-20T07:13:30.542000Z'],
    //2024-01-20 07:13:30.542789
	[1705734810542.789, '2024-01-20T07:13:30.542789Z'],
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = DateTime.fromUnixTimeMs(epoch,true);
		assert.is(e.toString(), expect);
	});
}

const unixTimeSet:[dtParts,number,number,string][]=[
    [
        { y: 2024, m: 1, d: 20, h: 7, i: 13, s: 30, us: 0, isUtc: true },
        1705734810,1705734810000,'2024-01-20T07:13:30.000000Z'
    ],
    [
        { y: 2024, m: 1, d: 20, h: 7, i: 13, s: 30, us: 534000, isUtc: true },
        1705734810.534,1705734810534,'2024-01-20T07:13:30.534000Z'
    ],
    [
        { y: 2024, m: 1, d: 20, h: 7, i: 13, s: 30, us: 542000, isUtc: true },
        1705734810.542,1705734810542,'2024-01-20T07:13:30.542000Z'
    ],
    [
        { y: 2024, m: 1, d: 20, h: 7, i: 13, s: 30, us: 542789, isUtc: true },
        1705734810.542789,1705734810542.789,'2024-01-20T07:13:30.542789Z'
    ],
];
for (const [o,epoch,epochMs,str] of unixTimeSet) {
    const dt= DateTime.new(o.y, o.m, o.d, o.h, o.i, o.s, o.us, o.isUtc);
    tsts(`toString(${str})`,()=>{
        assert.is(dt.toString(),str);
    })
    tsts(`toUnixTime(${str})`,()=>{
        assert.is(dt.toUnixTime(),epoch);
    })
    tsts(`toUnixTimeMs(${str})`,()=>{
        assert.is(dt.toUnixTimeMs(),epochMs);
    })
    tsts(`fromUnixTime(${epoch})`,()=>{
        const fr=DateTime.fromUnixTime(epoch);
        assert.is(fr.toString(),str);
    })
    tsts(`fromUnixTimeMs(${epochMs})`,()=>{
        const fr=DateTime.fromUnixTimeMs(epochMs);
        assert.is(fr.toString(),str);
    })

}

tsts(`now`,()=>{
    const dt=new Date();
    const d=DateTime.now();
    //This isn't a great test, but let's use a date object to compare
    //Could fail NYE/midnight
    assert.is(d.year.valueOf(),dt.getFullYear());
    //Could fail end of month/midnight
    assert.is(d.month.valueOf(),dt.getMonth()+1);//JS stores months off by 1 (0=Jan)
    //Could fail midnight
    assert.is(d.day.valueOf(),dt.getDate());//Not a great name, JS
    //Could fail end of hour
    assert.is(d.hour.valueOf(),dt.getHours(),'hour');
    
    //The rest are too risky, so just range check
    const mNum=d.minute.valueOf();
    assert.is(mNum >= 0 && mNum <= 59, true, 'Minute in range');
    const sNum=d.second.valueOf();
    assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
    const usNum=d.microsecond.valueOf();
    assert.is(usNum >= 0 && usNum <= 999999, true, 'In valid range');
    assert.is(d.isUtc.valueBool(),false);
});

tsts(`nowUtc`,()=>{
    const dt=new Date();
    const d=DateTime.nowUtc();
    //This isn't a great test, but let's use a date object to compare
    //Could fail NYE/midnight
    assert.is(d.year.valueOf(),dt.getUTCFullYear());
    //Could fail end of month/midnight
    assert.is(d.month.valueOf(),dt.getUTCMonth()+1);//JS stores months off by 1 (0=Jan)
    //Could fail midnight
    assert.is(d.day.valueOf(),dt.getUTCDate());//Not a great name, JS
    //Could fail end of hour
    assert.is(d.hour.valueOf(),dt.getUTCHours(),'hour');

    //The rest are too risky, so just range check
    const mNum=d.minute.valueOf();
    assert.is(mNum >= 0 && mNum <= 59, true, 'Minute in range');
    const sNum=d.second.valueOf();
    assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
    const usNum=d.microsecond.valueOf();
    assert.is(usNum >= 0 && usNum <= 999999, true, 'In valid range');
    assert.is(d.isUtc.valueBool(),true);
});

tsts('[Symbol.toStringTag]', () => {
    const o=DateTime.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('DateTime') > 0, true);
});

tsts('util.inspect',()=>{
    const o=DateTime.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('DateTime('),true);
});

tsts('serialSizeBits',()=>{
    const o=DateTime.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

// tsts('general',()=>{
//     const dt=DateTime.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
//     console.log(JSON.stringify(dt));
// });

tsts.run();
