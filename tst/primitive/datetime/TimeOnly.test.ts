import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { TimeOnly } from '../../../src/primitive/datetime/TimeOnly';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

const tsts = suite('TimeOnly');

const stor=new Uint8Array(TimeOnly.storageBytes);
const emptyBytes=new Uint8Array(0);


const serSet: [number, number, number, number, boolean, string, string][] = [
	[0, 0, 0, 0, false, '00:00:00.000000', '0000000000'], //min
	[11, 41, 7, 543271, false, '11:41:07.543271', '5D23C25138'], //01011 101001 000111 10000100101000100111 0 <<2
	[23, 59, 59, 999999, false, '23:59:59.999999', 'BF7DFA11F8'], //max 10111 111011 111011 11110100001000111111 0 <<2
    [23, 59, 59, 999999, true, '23:59:59.999999Z', 'BF7DFA11FC'], //max 10111 111011 111011 11110100001000111111 1 <<2
];
for (const [hr, mi, se, us, utc, str, ser] of serSet) {
	tsts(`ser(${hr} ${mi} ${se} ${us})`, () => {
		var t = TimeOnly.new(hr, mi, se, us,utc);

		assert.is(t.toString(), str);

		var bw = new BitWriter(Math.ceil(TimeOnly.serialBits / 8));
		t.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), ser);
	});

	tsts(`deser(${ser})`, () => {
		const bytes = hex.toBytes(ser);
		const br = new BitReader(bytes);
		const t = TimeOnly.deserialize(br).validate();
		assert.is(t.hour.valueOf(), hr, 'hour');
		assert.is(t.minute.valueOf(), mi, 'minute');
		assert.is(t.second.valueOf(), se, 'second');
		assert.is(t.microsecond.valueOf(), us, 'microsecond');
        assert.is(t.isUtc.valueBool(),utc,'isUtc');
		assert.is(t.toString(), str);
	});
}

tsts(`deser with invalid source value (FFFFFFFFFF) throws`, () => {
	const bytes = Uint8Array.of(0xff, 0xff, 0xff, 0xff, 0xff);
	const br = new BitReader(bytes);
	assert.throws(() => TimeOnly.deserialize(br).validate());
});
tsts(`deser without source data throws`, () => {
	const bytes = new Uint8Array();
	const br = new BitReader(bytes);
	assert.throws(() => TimeOnly.deserialize(br).validate());
});
tsts(`deser without storage space throws`, () => {
	const bytes = Uint8Array.of(0xff, 0xff, 0x7e);
	const br = new BitReader(bytes);
	assert.throws(() => TimeOnly.deserialize(br, emptyBytes).validate());
});

tsts(`new`,()=>{
    const t=TimeOnly.new(11,41,6,12345,false);
    assert.is(t.toString(),'11:41:06.012345');
    assert.is(t.hour.valueOf(),11,'hour');
    assert.is(t.minute.valueOf(), 41, 'minute');
    assert.is(t.second.valueOf(), 6, 'second');
    assert.is(t.microsecond.valueOf(), 12345, 'microsecond');
    assert.is(t.isUtc.valueBool(),false,'isUtc');
    //Value off uses base 10 shifting (string form without any separators)
    assert.is(t.valueOf(),114106012345);
});
tsts(`new-provide storage`,()=>{
    const t=TimeOnly.new(11,41,6,12345,true,stor);
    assert.is(t.toString(),'11:41:06.012345Z');
    assert.is(t.valueOf(),114106012345);
});

tsts(`fromDate`,()=>{
    // deepcode ignore DateMonthIndex/test: yes, we know
    const dt=new Date(2001,1/*=2 for fucks sake JS*/,3,4,5,6,789);
    const t=TimeOnly.fromDate(dt);
    assert.is(t.hour.valueOf(),dt.getHours(),'hour');
    assert.is(t.minute.valueOf(), dt.getMinutes(), 'minute');
    assert.is(t.second.valueOf(), dt.getSeconds(), 'second');
    assert.is(t.microsecond.valueOf(), dt.getMilliseconds()*1000, 'microsecond');
    assert.is(t.isUtc.valueBool(),false,'isUtc');
});

tsts(`fromDateUtc`,()=>{
    const dt=new Date();
    const t=TimeOnly.fromDateUtc(dt);
    assert.is(t.hour.valueOf(),dt.getUTCHours(),'hour');
    assert.is(t.minute.valueOf(), dt.getUTCMinutes(), 'minute');
    assert.is(t.second.valueOf(), dt.getUTCSeconds(), 'second');
    assert.is(t.isUtc.valueBool(),true);
});

const secondsEpochSet: [number, string,string][] = [
    //2024-01-20 07:13:30
	[1705734810, '07:13:30.000000Z', '07:13:30.000000Z'],
    //2024-01-20 07:13:30.534
	[1705734810.534, '07:13:30.534000Z', '07:13:30.534000Z'],
];
for (const [epoch, expectStr, expectJson] of secondsEpochSet) {
	tsts(`fromSecondsSinceEpoch(${epoch})`, () => {
		const e = TimeOnly.fromUnixTime(epoch);
		assert.is(e.toString(), expectStr);
        assert.is(e.toJSON(),expectJson);
	});
}

const millisEpochSet: [number, string][] = [
    //2024-01-20 07:13:30.542
	[1705734810542, '07:13:30.542000Z'],
    //2024-01-20 07:13:30.542789
	[1705734810542.789, '07:13:30.542789Z'],
];
for (const [epoch, expect] of millisEpochSet) {
	tsts(`fromMillisecondsSinceEpoch(${epoch})`, () => {
		const e = TimeOnly.fromUnixTimeMs(epoch);
		assert.is(e.toString(), expect);
	});
}

const toSecondMsUsSet:[number,number,number,number,string,number,number,number][]=[
    [0,0,0,0,'00:00:00.000000Z',0,0,0],//min
    [7,13,30,542000,'07:13:30.542000Z',26010.542,26010542,26010542000],
    [7,13,30,542789,'07:13:30.542789Z',26010.542789,26010542.789,26010542789],
    [23,59,59,999999,'23:59:59.999999Z',86399.999999,86399999.999,86399999999]//max
];
for(const [h,m,s,us,str,seconds,milliseconds,microseconds] of toSecondMsUsSet) {
    const tm=TimeOnly.new(h,m,s,us,true);
    tsts(`toSeconds(${str})`,()=>{
        assert.is(tm.toString(),str);
        assert.is(tm.toSeconds(),seconds)
    });
    tsts(`toMilliseconds(${str})`,()=>{
        assert.is(tm.toMilliseconds(),milliseconds);
    });
    tsts(`toMicroseconds(${str})`,()=>{
        assert.is(tm.toMicroseconds(),microseconds);
    });
    //We can back convert epoch to date with these zeroed values
    tsts(`fromUnixTime(${seconds})`,()=>{
        const fr=TimeOnly.fromUnixTime(seconds);
        assert.is(fr.toString(),str);
    })
    tsts(`fromUnixTimeMs(${milliseconds})`,()=>{
        const fr=TimeOnly.fromUnixTimeMs(milliseconds);
        assert.is(fr.toString(),str);
    })
    tsts(`fromUnixTimeUs(${microseconds})`,()=>{
        const fr=TimeOnly.fromUnixTimeUs(microseconds);
        assert.is(fr.toString(),str);
    })
}

tsts(`now`,()=>{
    const dt=new Date();
    const t=TimeOnly.now();
    //This isn't a great test, but let's use a date object to compare
    //(tiny chance of this test failing near midnight)
    assert.is(t.hour.valueOf(),dt.getHours(),'hour');
    assert.is(t.minute.valueOf(), dt.getMinutes(), 'minute');
    assert.is(t.second.valueOf(), dt.getSeconds(), 'second');
    assert.is(t.isUtc.valueBool(),false);
    //unsafe to test microsecond
});

tsts(`nowUtc`,()=>{
    const dt=new Date();
    const t=TimeOnly.nowUtc();
    //This isn't a great test, but let's use a date object to compare
    //(tiny chance of this test failing near midnight UTC)
    assert.is(t.hour.valueOf(),dt.getUTCHours(),'hour');
    assert.is(t.minute.valueOf(), dt.getUTCMinutes(), 'minute');
    assert.is(t.second.valueOf(), dt.getUTCSeconds(), 'second');
    assert.is(t.isUtc.valueBool(),true);
    //unsafe to test microsecond
});

tsts('[Symbol.toStringTag]', () => {
    const o=TimeOnly.fromUnixTime(1705734810542);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('TimeOnly') > 0, true);
});

tsts('util.inspect',()=>{
    const o=TimeOnly.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('TimeOnly('),true);
});

tsts('serialSizeBits',()=>{
    const o=TimeOnly.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(TimeOnly.storageBytes);
	const stor2=new Uint8Array(TimeOnly.storageBytes);

	const o=TimeOnly.new(1,2,3,456789,false,stor1);
	assert.instance(o,TimeOnly);
	assert.is(o.valueOf(),10203456789);

	const o2=o.cloneTo(stor2);
	assert.instance(o2,TimeOnly);
	assert.is(o2.valueOf(),10203456789);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;
    assert.not.equal(o.valueOf(),o2.valueOf());
});

const fromValueSet:number[]=[
    0,//Min
    10203456789,
    235959999999,//Max
];
for(const src of fromValueSet) {
    //We expect a round trip so expected=source
    tsts(`fromValue(${src})`,()=>{
        const t=TimeOnly.fromValue(src);
        assert.is(t.valueOf(),src);
    });
}

tsts(`min`,()=>{
    const to=TimeOnly.min;
    assert.is(to.valueOf(),0);
});
tsts(`max`,()=>{
    const to=TimeOnly.max;
    assert.is(to.valueOf(),235959999999);
});


const parseSet:[WindowStr,string,number][]=[
    //Just numbers (assume valueOf compat)
    [WindowStr.new('000000000000z'),'00:00:00.000000Z',0],
    [WindowStr.new('000000000000'),'00:00:00.000000',0],
    [WindowStr.new('235959999999 '),'23:59:59.999999',0],
    [WindowStr.new('235959999999Z'),'23:59:59.999999Z',0],
    [WindowStr.new('153631123456'),'15:36:31.123456',0],

    //Normal
    [WindowStr.new('15:36:31.123456'),'15:36:31.123456',0],
    [WindowStr.new('15: 36: 31.123456'),'15:36:31.123456',0],
    [WindowStr.new('00:00:00.000000Z'),'00:00:00.000000Z',0],
    [WindowStr.new('00:00:00.000000z'),'00:00:00.000000Z',0],
    [WindowStr.new('00:00:00.000000 '),'00:00:00.000000',0],
    [WindowStr.new('0:0:0.1 '),'00:00:00.000001',0],
];
for(const [w,expect,expectLen] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const to=TimeOnly.parse(w);
        assert.equal(to.toString(),expect);
        assert.is(w.length,expectLen,'remaining length');
    });
}

const badParseStrictSet:WindowStr[]=[
    WindowStr.new('0:0:0.1')
];
for(const w of badParseStrictSet) {
    tsts(`parse-strict ${w.debug()} throws`,()=>{
        assert.throws(()=>TimeOnly.parse(w,true));
    })
}

const badParseSet:WindowStr[]=[
    WindowStr.new('1536'),//Can't be short, or.. what is thi?
    WindowStr.new('15:36:.'),//Can't be short
    WindowStr.new('1536:31.123456'),//Can't be a mix of with/without delims
];
for(const w of badParseSet) {
    tsts(`parse ${w.debug()} throws`,()=>{
        assert.throws(()=>TimeOnly.parse(w));
    })
}

tsts(`parse-now`, () => {
    const w=WindowStr.new('now');
    const t=TimeOnly.parse(w);

    //The rest are too risky, so just range check
    const h=t.hour.valueOf(); assert.is(h>=0&&h<=23,true,'hour in range');
    const m=t.minute.valueOf(); assert.is(m>=0&&m<=59,true,'minute in range');
    const s=t.second.valueOf(); assert.is(s>=0&&s<=59,true,'second in range');
    const us=t.microsecond.valueOf(); assert.is(us>=0&&us<=999999,true,'microsecond in range');
});

tsts.run();
