import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { TimeOnly } from '../../src/datetime/dt';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('TimeOnly');

const serSet: [number, number, number, number, string, string][] = [
	[0, 0, 0, 0, '00:00:00.000000', '0000000000'], //min
	[11, 41, 7, 543271, '11:41:07.543271', '5D23C25138'], //01011 101001 000111 10000100101000100111 0 <<2
	[23, 59, 59, 999999, '23:59:59.999999', 'BF7DFA11F8'], //max 10111 111011 111011 11110100001000111111 0 <<2
];
for (const [hr, mi, se, us, str, ser] of serSet) {
	tsts(`ser(${hr} ${mi} ${se} ${us})`, () => {
		var t = TimeOnly.new(hr, mi, se, us);

		assert.is(t.toString(), str);

		var bw = new BitWriter(Math.ceil(TimeOnly.serialBits / 8));
		t.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), ser);
	});

	tsts(`deser(${ser})`, () => {
		const bytes = hex.toBytes(ser);
		const br = new BitReader(bytes);
		const t = TimeOnly.deserialize(br).validate();
		assert.is(t.hour, hr, 'hour');
		assert.is(t.minute, mi, 'minute');
		assert.is(t.second, se, 'second');
		assert.is(t.microsecond, us, 'microsecond');
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

tsts(`new`,()=>{
    const t=TimeOnly.new(11,41,6,12345);
    assert.is(t.toString(),'11:41:06.012345');
    assert.is(t.hour,11,'hour');
    assert.is(t.minute, 41, 'minute');
    assert.is(t.second, 6, 'second');
    assert.is(t.microsecond, 12345, 'microsecond');
    //Value off uses base 10 shifting (string form without any separators)
    assert.is(t.valueOf(),114106012345);
});

tsts(`fromDate`,()=>{
    // deepcode ignore DateMonthIndex/test: yes, we know
    const dt=new Date(2001,1/*=2 for fucks sake JS*/,3,4,5,6,789);
    const t=TimeOnly.fromDate(dt);
    assert.is(t.hour,dt.getHours(),'hour');
    assert.is(t.minute, dt.getMinutes(), 'minute');
    assert.is(t.second, dt.getSeconds(), 'second');
    assert.is(t.microsecond, dt.getMilliseconds()*1000, 'microsecond');
});

const secondsEpochSet: [number, string,string][] = [
    //2024-01-20 07:13:30
	[1705734810, '07:13:30.000000', '07:13:30.000000'],
    //2024-01-20 07:13:30.534
	[1705734810.534, '07:13:30.534000', '07:13:30.534000'],
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
	[1705734810542, '07:13:30.542000'],
    //2024-01-20 07:13:30.542789
	[1705734810542.789, '07:13:30.542789'],
];
for (const [epoch, expect] of millisEpochSet) {
	tsts(`fromMillisecondsSinceEpoch(${epoch})`, () => {
		const e = TimeOnly.fromUnixTimeMs(epoch);
		assert.is(e.toString(), expect);
	});
}

const toSecondMsUsSet:[number,number,number,number,string,number,number,number][]=[
    [0,0,0,0,'00:00:00.000000',0,0,0],//min
    [7,13,30,542000,'07:13:30.542000',26010.542,26010542,26010542000],
    [7,13,30,542789,'07:13:30.542789',26010.542789,26010542.789,26010542789],
    [23,59,59,999999,'23:59:59.999999',86399.999999,86399999.999,86399999999]//max
];
for(const [h,m,s,us,str,seconds,milliseconds,microseconds] of toSecondMsUsSet) {
    const tm=TimeOnly.new(h,m,s,us);
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
    assert.is(t.hour,dt.getHours(),'hour');
    assert.is(t.minute, dt.getMinutes(), 'minute');
    assert.is(t.second, dt.getSeconds(), 'second');
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

// tsts('cloneTo',()=>{
// 	const stor1=new Uint8Array(TimeOnly.storageBytes);
// 	const stor2=new Uint8Array(TimeOnly.storageBytes);

// 	const o=TimeOnly.new(1,2,3,456789,false,stor1);
// 	assert.instance(o,TimeOnly);
// 	assert.is(o.valueOf(),10203456789);

// 	const o2=o.cloneTo(stor2);
// 	assert.instance(o2,TimeOnly);
// 	assert.is(o2.valueOf(),10203456789);
	
// 	//This is a terrible idea, but it proves diff memory
// 	stor2[0]=13;
//     assert.not.equal(o.valueOf(),o2.valueOf());
// });

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
    [WindowStr.new('000000000000'),'00:00:00.000000',0],
    [WindowStr.new('235959999999 '),'23:59:59.999999',0],
    [WindowStr.new('153631123456'),'15:36:31.123456',0],

    //Normal
    [WindowStr.new('15:36:31.123456'),'15:36:31.123456',0],
    [WindowStr.new('15: 36: 31.123456'),'15:36:31.123456',0],
    [WindowStr.new('00:00:00.000000'),'00:00:00.000000',0],
    [WindowStr.new('23:59:59.999999'),'23:59:59.999999',0],
    [WindowStr.new('0:0:0.1'),'00:00:00.100000',0],
    [WindowStr.new('0:0:0.01'),'00:00:00.010000',0],
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
    WindowStr.new('000000000000z'),//UTC not welcome here
    WindowStr.new('15:36:31.123456z'),//"
];
for(const w of badParseSet) {
    tsts(`parse ${w.debug()} throws`,()=>{
        assert.throws(()=>TimeOnly.parse(w));
    })
}

tsts(`parse-now`, () => {
    const w=WindowStr.new('now');
    const t=TimeOnly.parse(w);

    const h=t.hour; assert.is(h>=0&&h<=23,true,'hour in range');
    const m=t.minute; assert.is(m>=0&&m<=59,true,'minute in range');
    const s=t.second; assert.is(s>=0&&s<=59,true,'second in range');
    const us=t.microsecond; assert.is(us>=0&&us<=999999,true,'microsecond in range');
});

tsts.run();
