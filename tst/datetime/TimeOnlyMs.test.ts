import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { TimeOnlyMs } from '../../src/datetime/dt';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('TimeOnlyMs');

const serSet: [number, number, number, number,  string, string][] = [
	[0, 0, 0, 0,  '00:00:00.000', '00000000'], //min
	[11, 41, 7, 543,  '11:41:07.543', '87C7A560'], //1000011111 000111 101001 01011   00000
	[23, 59, 59, 999,  '23:59:59.999', 'F9FBEEE0'], //max 1111100111 111011 111011 10111   00000
];
for (const [hr, mi, se, ms,  str, ser] of serSet) {
	tsts(`ser(${hr} ${mi} ${se} ${ms})`, () => {
		var t = TimeOnlyMs.new(hr, mi, se, ms);

		assert.is(t.toString(), str,'toString');

		var bw = new BitWriter(Math.ceil(TimeOnlyMs.serialBits / 8));
		t.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), ser,'ser');
	});

	tsts(`deser(${ser})`, () => {
		const bytes = hex.toBytes(ser);
		const br = new BitReader(bytes);
		const t = TimeOnlyMs.deserialize(br).validate();
		assert.is(t.hour.valueOf(), hr, 'hour');
		assert.is(t.minute.valueOf(), mi, 'minute');
		assert.is(t.second.valueOf(), se, 'second');
		assert.is(t.millisecond.valueOf(), ms, 'millisecond');
		assert.is(t.toString(), str,'toString');
	});
}

tsts(`deser with invalid source value (FFFFFFFFFF) throws`, () => {
	const bytes = Uint8Array.of(0xff, 0xff, 0xff, 0xff, 0xff);
	const br = new BitReader(bytes);
	assert.throws(() => TimeOnlyMs.deserialize(br).validate());
});
tsts(`deser without source data throws`, () => {
	const bytes = new Uint8Array();
	const br = new BitReader(bytes);
	assert.throws(() => TimeOnlyMs.deserialize(br).validate());
});

tsts(`new`,()=>{
    const t=TimeOnlyMs.new(11,41,6,12);
    assert.is(t.toString(),'11:41:06.012');
    assert.is(t.hour.valueOf(),11,'hour');
    assert.is(t.minute.valueOf(), 41, 'minute');
    assert.is(t.second.valueOf(), 6, 'second');
    assert.is(t.millisecond.valueOf(), 12, 'millisecond');
    //Value off uses base 10 shifting
    assert.is(t.valueOf(),114106012);
});

tsts(`fromDate`,()=>{
    // deepcode ignore DateMonthIndex/test: yes, we know
    const dt=new Date(2001,1/*=2 for fucks sake JS*/,3,4,5,6,789);
    const t=TimeOnlyMs.fromDate(dt);
    assert.is(t.hour.valueOf(),dt.getHours(),'hour');
    assert.is(t.minute.valueOf(), dt.getMinutes(), 'minute');
    assert.is(t.second.valueOf(), dt.getSeconds(), 'second');
    assert.is(t.millisecond.valueOf(), dt.getMilliseconds(), 'millisecond');
});


const fromUnixTimeSet: [number, string, string][] = [
    //2024-01-20 07:13:30
	[1705734810, '07:13:30.000', '07:13:30.000'],
    //2024-01-20 07:13:30.534
	[1705734810.534, '07:13:30.534', '07:13:30.534'],
];
for (const [epoch, expectStr, expectJson] of fromUnixTimeSet) {
	tsts(`fromUnixTime(${epoch})`, () => {
		const e = TimeOnlyMs.fromUnixTime(epoch);
		assert.is(e.toString(), expectStr);
        assert.is(e.toJSON(),expectJson);
    });
}

const fromUnixTimeMsSet: [number, string][] = [
    //2024-01-20 07:13:30.542
	[1705734810542, '07:13:30.542'],
    //2024-01-20 07:13:30.542789
	[1705734810542.789, '07:13:30.542'],
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = TimeOnlyMs.fromUnixTimeMs(epoch);
		assert.is(e.toString(), expect);
	});
}

const toSecondMsSet:[number,number,number,number,string,number,number][]=[
    [0,0,0,0,'00:00:00.000',0,0],
    [7,13,30,542,'07:13:30.542',26010.542,26010542],
    [7,13,30,534,'07:13:30.534',26010.534,26010534],
    [23,59,59,999,'23:59:59.999',86399.999,86399999]
];
for(const [h,m,s,ms,str,seconds,milliseconds] of toSecondMsSet) {
    const tm=TimeOnlyMs.new(h,m,s,ms);
    tsts(`toSeconds(${str})`,()=>{
        assert.is(tm.toString(),str);
        assert.is(tm.toSeconds(),seconds);
    });
    tsts(`toMilliseconds(${str})`,()=>{
        assert.is(tm.toMilliseconds(),milliseconds);
    });
    tsts(`toMicroseconds(${str})`,()=>{
        assert.is(tm.toMicroseconds(),milliseconds*1000);
    });
    //We can back convert epoch to date with these zeroed values
    tsts(`fromUnixTime(${seconds})`,()=>{
        const fr=TimeOnlyMs.fromUnixTime(seconds);
        assert.is(fr.toString(),str);
    })
    tsts(`fromUnixTimeMs(${milliseconds})`,()=>{
        const fr=TimeOnlyMs.fromUnixTimeMs(milliseconds);
        assert.is(fr.toString(),str);
    })
    tsts(`fromUnixTimeUs(${milliseconds*1000})`,()=>{
        const fr=TimeOnlyMs.fromUnixTimeUs(milliseconds*1000);
        assert.is(fr.toString(),str);
    })
}

tsts(`now`,()=>{
    const dt=new Date();
    const t=TimeOnlyMs.now();
    //This isn't a great test, but let's use a date object to compare
    //(tiny chance of this test failing near midnight)
    assert.is(t.hour.valueOf(),dt.getHours(),'hour');
    assert.is(t.minute.valueOf(), dt.getMinutes(), 'minute');
    assert.is(t.second.valueOf(), dt.getSeconds(), 'second');
    //unsafe to test microsecond
});

tsts('[Symbol.toStringTag]', () => {
    const o=TimeOnlyMs.fromUnixTime(1705734810542);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('TimeOnlyMs') > 0, true);
});

tsts('util.inspect',()=>{
    const o=TimeOnlyMs.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('TimeOnlyMs('),true);
});

tsts('serialSizeBits',()=>{
    const o=TimeOnlyMs.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

const fromValueSet:number[]=[
    0,//Min
    102034567,
    235959999,//Max
];
for(const src of fromValueSet) {
    //We expect a round trip so expected=source
    tsts(`fromValue(${src})`,()=>{
        const t=TimeOnlyMs.fromValue(src);
        assert.is(t.valueOf(),src);
    });
}

tsts(`min`,()=>{
    const to=TimeOnlyMs.min;
    assert.is(to.valueOf(),0);
});
tsts(`max`,()=>{
    const to=TimeOnlyMs.max;
    assert.is(to.valueOf(),235959999);
});

const parseSet:[WindowStr,string,number][]=[
    //Just numbers (assume valueOf compat)
    [WindowStr.new('000000000'),'00:00:00.000',0],
    [WindowStr.new('235959999 '),'23:59:59.999',0],
    [WindowStr.new('153631123'),'15:36:31.123',0],

    //Normal
    [WindowStr.new('15:36:31.123'),'15:36:31.123',0],
    [WindowStr.new('15: 36: 31.123'),'15:36:31.123',0],
    [WindowStr.new('00:00:00.000'),'00:00:00.000',0],
    [WindowStr.new('23:59:59.999'),'23:59:59.999',0],
    [WindowStr.new('0:0:0.1'),'00:00:00.100',0],
    [WindowStr.new('0:0:0.01'),'00:00:00.010',0],
];
for(const [w,expect,expectLen] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const to=TimeOnlyMs.parse(w);
        assert.equal(to.toString(),expect);
        assert.is(w.length,expectLen,'remaining length');
    });
}

const badParseSet:WindowStr[]=[
    WindowStr.new('1536'),//Can't be short, or.. what is thi?
    WindowStr.new('15:36:.'),//Can't be short
    WindowStr.new('1536:31.123'),//Can't be a mix of with/without delims
    WindowStr.new('000000000z'),//UTC not welcome here
    WindowStr.new('15:36:31.123z'),//"
    WindowStr.new('25:00:00.000z'),//Invalid hour component
    WindowStr.new('250000000'),//"
    WindowStr.new('00:60:00.000z'),//Invalid min component
    WindowStr.new('006000000'),//"
    WindowStr.new('00:00:61.000z'),//Invalid sec component
    WindowStr.new('000061000'),//"
    WindowStr.new('00:00:00.1000'),//Invalid milli component
];
for(const w of badParseSet) {
    tsts(`parse ${w.debug()} throws`,()=>{
        assert.throws(()=>TimeOnlyMs.parse(w));
    })
}

tsts(`parse-now`, () => {
    const w=WindowStr.new('now');
    const t=TimeOnlyMs.parse(w);

    const h=t.hour; assert.is(h>=0&&h<=23,true,'hour in range');
    const m=t.minute; assert.is(m>=0&&m<=59,true,'minute in range');
    const s=t.second; assert.is(s>=0&&s<=59,true,'second in range');
    const ms=t.millisecond; assert.is(ms>=0&&ms<=999,true,'millisecond in range '+ms);
});

tsts.run();
