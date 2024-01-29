import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { TimeOnlyMs } from '../../../src/primitive/datetime/TimeOnlyMs';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';

const tsts = suite('TimeOnlyMs');

const stor=new Uint8Array(TimeOnlyMs.storageBytes);
const emptyBytes=new Uint8Array(0);


const serSet: [number, number, number, number, boolean, string, string][] = [
	[0, 0, 0, 0, false, '00:00:00.000', '00000000'], //min 00000 000000 000000 00000000 0 <<4
    [0, 0, 0, 0, true, '00:00:00.000Z', '00000010'], //min 00000 000000 000000 00000000 1 <<4
	[11, 41, 7, 543, false, '11:41:07.543', '5D23C3E0'], //01011 101001 000111 1000011111 0 <<4
	[23, 59, 59, 999, false, '23:59:59.999', 'BF7DFCE0'], //max 10111 111011 111011 1111100111 0 <<4
    [23, 59, 59, 999, true, '23:59:59.999Z', 'BF7DFCF0'], //max 10111 111011 111011 1111100111 1 <<4
];
for (const [hr, mi, se, ms, utc, str, ser] of serSet) {
	tsts(`ser(${hr} ${mi} ${se} ${ms} ${utc})`, () => {
		var t = TimeOnlyMs.new(hr, mi, se, ms,utc);

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
        assert.is(t.isUtc.valueBool(),utc,'isUtc');
		assert.is(t.toString(), str);
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
tsts(`deser without storage space throws`, () => {
	const bytes = Uint8Array.of(0xff, 0xff, 0x7e);
	const br = new BitReader(bytes);
	assert.throws(() => TimeOnlyMs.deserialize(br, emptyBytes).validate());
});

tsts(`new`,()=>{
    const t=TimeOnlyMs.new(11,41,6,12,false);
    assert.is(t.toString(),'11:41:06.012');
    assert.is(t.hour.valueOf(),11,'hour');
    assert.is(t.minute.valueOf(), 41, 'minute');
    assert.is(t.second.valueOf(), 6, 'second');
    assert.is(t.millisecond.valueOf(), 12, 'millisecond');
    assert.is(t.isUtc.valueBool(),false,'isUtc');
    //Value off uses base 10 shifting
    assert.is(t.valueOf(),114106012);
});
tsts(`new-provide storage`,()=>{
    const t=TimeOnlyMs.new(11,41,6,12,true,stor);
    assert.is(t.toString(),'11:41:06.012Z');
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
    assert.is(t.isUtc.valueBool(),false,'isUtc');
});

const secondsEpochSet: [number, string][] = [
    //2024-01-20 07:13:30
	[1705734810, '07:13:30.000'],
    //2024-01-20 07:13:30.534
	[1705734810.534, '07:13:30.534'],
];
for (const [epoch, expect] of secondsEpochSet) {
	tsts(`fromSecondsSinceEpoch(${epoch})`, () => {
		const e = TimeOnlyMs.fromSecondsSinceEpoch(epoch);
		assert.is(e.toString(), expect);
	});
}

const millisEpochSet: [number, string][] = [
    //2024-01-20 07:13:30.542
	[1705734810542, '07:13:30.542'],
    //2024-01-20 07:13:30.542789
	[1705734810542.789, '07:13:30.542'],
];
for (const [epoch, expect] of millisEpochSet) {
	tsts(`fromMillisecondsSinceEpoch(${epoch})`, () => {
		const e = TimeOnlyMs.fromMillisecondsSinceEpoch(epoch);
		assert.is(e.toString(), expect);
	});
}

tsts(`now`,()=>{
    const dt=new Date();
    const t=TimeOnlyMs.now();
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
    const t=TimeOnlyMs.nowUtc();
    //This isn't a great test, but let's use a date object to compare
    //(tiny chance of this test failing near midnight UTC)
    assert.is(t.hour.valueOf(),dt.getUTCHours(),'hour');
    assert.is(t.minute.valueOf(), dt.getUTCMinutes(), 'minute');
    assert.is(t.second.valueOf(), dt.getUTCSeconds(), 'second');
    assert.is(t.isUtc.valueBool(),true);
    //unsafe to test microsecond
});

tsts.run();
