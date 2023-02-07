import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Duration } from '../../src/primitive/Duration';

const tsts = suite('Duration');

// prettier-ignore
const creates=[
    {y:2000,m:1,d:2,h:3,i:4,s:5,u:678901,str:'P2000Y1M2DT3H4M5.678901S',ser: '04AFAFE2925FAF35'},
    {y:3,m:6,d:4,h:12,i:30,s:5,u:0,str:'P3Y6M4DT12H30M5S'},
    {y:1,m:2,d:3,h:4,i:5,s:6,u:789012,str:'P1Y2M3DT4H5M6.789012S'},
    {y:0,m:0,d:0,h:0,i:0,s:0,u:0,str:'P0D'},
];

for (const create of creates) {
	tsts('Create:' + create.str, () => {
		const d = new Duration(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(d.toIso8601(), create.str);
		assert.equal(d.year, create.y);
		assert.equal(d.month, create.m);
		assert.equal(d.day, create.d);
		assert.equal(d.hour, create.h);
		assert.equal(d.minute, create.i);
		assert.equal(d.second, create.s);
		assert.equal(d.micro, create.u);
	});
}

// prettier-ignore
const normalizeCreates=[
    {y:1.5,m:0,d:0,h:0,i:0,s:0,u:0,iso:'P1Y6M',str:'1y6m0:00:00'},
    {y:0,m:1.5,d:0,h:0,i:0,s:0,u:0,iso:'P1.5M',str:'1.5m0:00:00'},//Doesn't normalize (cannot because months 28-31 days)
    {y:0,m:0,d:1.5,h:0,i:0,s:0,u:0,iso:'P1.5D',str:'1.5d0:00:00'},//Doesn't normalize (cannot because of leaps)
    {y:0,m:0,d:0,h:1.5,i:0,s:0,u:0,iso:'PT1H30M',str:'1:30:00'},
    {y:0,m:0,d:0,h:0,i:1.5,s:0,u:0,iso:'PT1M30S',str:'1:30'},
    {y:0,m:0,d:0,h:0,i:0,s:1.5,u:0,iso:'PT1.5S',str:'1.5'},
    //1.5us isn't allowed - see throwCreates
];
for (const create of normalizeCreates) {
	tsts('Normalized create ISO:' + create.iso, () => {
		const d = new Duration(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(d.toIso8601(), create.iso);
	});
	tsts('Normalized create STR:' + create.iso, () => {
		const d = new Duration(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(d.toString(), create.str);
	});
}

// prettier-ignore
const throwCreates=[
    {y:1.5,m:1,d:0,h:0,i:0,s:0,u:0,str:'1.5y not allowed with m'},
    {y:1.5,m:0,d:1,h:0,i:0,s:0,u:0,str:'1.5y not allowed with d'},
    {y:1.5,m:0,d:0,h:1,i:0,s:0,u:0,str:'1.5y not allowed with h'},
    {y:1.5,m:0,d:0,h:0,i:1,s:0,u:0,str:'1.5y not allowed with m'},
    {y:1.5,m:0,d:0,h:0,i:0,s:1,u:0,str:'1.5y not allowed with s'},
    {y:1.5,m:0,d:0,h:0,i:0,s:0,u:1,str:'1.5y not allowed with us'},
    {y:0,m:1.5,d:1,h:0,i:0,s:0,u:0,str:'1.5m not allowed with d'},
    {y:0,m:1.5,d:0,h:1,i:0,s:0,u:0,str:'1.5m not allowed with h'},
    {y:0,m:1.5,d:0,h:0,i:1,s:0,u:0,str:'1.5m not allowed with m'},
    {y:0,m:1.5,d:0,h:0,i:0,s:1,u:0,str:'1.5m not allowed with s'},
    {y:0,m:1.5,d:0,h:0,i:0,s:0,u:1,str:'1.5m not allowed with us'},
    {y:0,m:0,d:1.5,h:1,i:0,s:0,u:0,str:'1.5d not allowed with h'},
    {y:0,m:0,d:1.5,h:0,i:1,s:0,u:0,str:'1.5d not allowed with m'},
    {y:0,m:0,d:1.5,h:0,i:0,s:1,u:0,str:'1.5d not allowed with s'},
    {y:0,m:0,d:1.5,h:0,i:0,s:0,u:1,str:'1.5d not allowed with us'},
    {y:0,m:0,d:0,h:1.5,i:1,s:0,u:0,str:'1.5h not allowed with m'},
    {y:0,m:0,d:0,h:1.5,i:0,s:1,u:0,str:'1.5h not allowed with s'},
    {y:0,m:0,d:0,h:1.5,i:0,s:0,u:1,str:'1.5h not allowed with us'},
    {y:0,m:0,d:0,h:0,i:1.5,s:1,u:0,str:'1.5m not allowed with s'},
    {y:0,m:0,d:0,h:0,i:1.5,s:0,u:1,str:'1.5m not allowed with us'},
    {y:0,m:0,d:0,h:0,i:0,s:1.5,u:1,str:'1.5s not allowed with us'},
    {y:0,m:0,d:0,h:0,i:0,s:0,u:1.5,str:'1.5us not allowed'},
];

for (const create of throwCreates) {
	tsts('Throw Create:' + create.str, () => {
		assert.throws(() => {
			const d = new Duration(
				create.y,
				create.m,
				create.d,
				create.h,
				create.i,
				create.s,
				create.u
			);
		});
	});
}

// prettier-ignore
const shiftNumberMS=[
    //shift, ms, iso, str, create
    [0,'00:00','P0D',{y:0,m:0,d:0,h:0,i:0,s:0,u:0}],
    [1,'00:01','PT1S',{y:0,m:0,d:0,h:0,i:0,s:1,u:0}],
    [627,'06:27','PT6M27S',{y:0,m:0,d:0,h:0,i:6,s:27,u:0}],
    [1032,'10:32','PT10M32S',{y:0,m:0,d:0,h:0,i:10,s:32,u:0}],
    [1202,'12:02','PT12M2S',{y:0,m:0,d:0,h:0,i:12,s:2,u:0}],
    [1604,'16:04','PT16M4S',{y:0,m:0,d:0,h:0,i:16,s:4,u:0}],
    [1805,'18:05','PT18M5S',{y:0,m:0,d:0,h:0,i:18,s:5,u:0}],
    [2226,'22:26','PT22M26S',{y:0,m:0,d:0,h:0,i:22,s:26,u:0}],
    [2603,'26:03','PT26M3S',{y:0,m:0,d:0,h:0,i:26,s:3,u:0}],
    [2805,'28:05','PT28M5S',{y:0,m:0,d:0,h:0,i:28,s:5,u:0}],
    [3037,'30:37','PT30M37S',{y:0,m:0,d:0,h:0,i:30,s:37,u:0}],
    [3355,'33:55','PT33M55S',{y:0,m:0,d:0,h:0,i:33,s:55,u:0}],
    [3815,'38:15','PT38M15S',{y:0,m:0,d:0,h:0,i:38,s:15,u:0}],
    [4058,'40:58','PT40M58S',{y:0,m:0,d:0,h:0,i:40,s:58,u:0}],
    [4443,'44:43','PT44M43S',{y:0,m:0,d:0,h:0,i:44,s:43,u:0}],
    [4949,'49:49','PT49M49S',{y:0,m:0,d:0,h:0,i:49,s:49,u:0}],
    [5224,'52:24','PT52M24S',{y:0,m:0,d:0,h:0,i:52,s:24,u:0}],
    [5513,'55:13','PT55M13S',{y:0,m:0,d:0,h:0,i:55,s:13,u:0}],
    [5906,'59:06','PT59M6S',{y:0,m:0,d:0,h:0,i:59,s:6,u:0}],
    [6141,'61:41','PT1H1M41S',{y:0,m:0,d:0,h:0,i:61,s:41,u:0}],
    [6448,'64:48','PT1H4M48S',{y:0,m:0,d:0,h:1,i:4,s:48,u:0}],
    [6842,'68:42','PT1H8M42S',{y:0,m:0,d:0,h:1,i:8,s:42,u:0}],
    [7225,'72:25','PT1H12M25S',{y:0,m:0,d:0,h:1,i:12,s:25,u:0}],
    [7717,'77:17','PT1H17M17S',{y:0,m:0,d:0,h:1,i:17,s:17,u:0}],
    [8135,'81:35','PT1H21M35S',{y:0,m:0,d:0,h:1,i:21,s:35,u:0}],

    [1.000002,'00:01.000002','PT1.000002S',{y:0,m:0,d:0,h:0,i:0,s:1,u:2}],
    [1.00002,'00:01.00002','PT1.00002S',{y:0,m:0,d:0,h:0,i:0,s:1,u:20}],
];
for (const test of shiftNumberMS) {
	const shift = test[0] as number;
	const ms = test[1] as string;
	const iso = test[2] as string;
	const create = test[3];

	tsts('MSShiftNumber create:' + ms, () => {
		const d = Duration.fromMSShiftNumber(shift);
		assert.equal(d.toIso8601(), iso);
	});
	tsts('MSShiftNumber encode:' + ms, () => {
		const d = new Duration(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(d.toMSShiftNumber(), shift);
	});
	tsts('toMSString:' + iso, () => {
		const d = new Duration(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(d.toMSString(), ms);
	});
}

// prettier-ignore
const toStringIso=[
    //create, iso, str
    [{y:0,m:0,d:0,h:0,i:0,s:0,u:0},'P0D','0'],
    [{y:0,m:0,d:0,h:0,i:6,s:27,u:0},'PT6M27S','6:27'],
    [{y:0,m:0,d:0,h:0,i:10,s:32,u:0},'PT10M32S','10:32'],
    [{y:0,m:0,d:0,h:0,i:12,s:2,u:0},'PT12M2S','12:02'],
    [{y:0,m:0,d:0,h:0,i:16,s:4,u:0},'PT16M4S','16:04'],
    [{y:0,m:0,d:0,h:0,i:18,s:5,u:0},'PT18M5S','18:05'],
    [{y:0,m:0,d:0,h:0,i:22,s:26,u:0},'PT22M26S','22:26'],
    [{y:0,m:0,d:0,h:0,i:26,s:3,u:0},'PT26M3S','26:03'],
    [{y:0,m:0,d:0,h:0,i:28,s:5,u:0},'PT28M5S','28:05'],
    [{y:0,m:0,d:0,h:0,i:30,s:37,u:0},'PT30M37S','30:37'],
    [{y:0,m:0,d:0,h:0,i:33,s:55,u:0},'PT33M55S','33:55'],
    [{y:0,m:0,d:0,h:0,i:38,s:15,u:0},'PT38M15S','38:15'],
    [{y:0,m:0,d:0,h:0,i:40,s:58,u:0},'PT40M58S','40:58'],
    [{y:0,m:0,d:0,h:0,i:44,s:43,u:0},'PT44M43S','44:43'],
    [{y:0,m:0,d:0,h:0,i:49,s:49,u:0},'PT49M49S','49:49'],
    [{y:0,m:0,d:0,h:0,i:52,s:24,u:0},'PT52M24S','52:24'],
    [{y:0,m:0,d:0,h:0,i:55,s:13,u:0},'PT55M13S','55:13'],
    [{y:0,m:0,d:0,h:0,i:59,s:6,u:0},'PT59M6S','59:06'],
    [{y:0,m:0,d:0,h:0,i:61,s:41,u:0},'PT1H1M41S','1:01:41'],
    [{y:0,m:0,d:0,h:1,i:4,s:48,u:0},'PT1H4M48S','1:04:48'],
    [{y:0,m:0,d:0,h:1,i:8,s:42,u:0},'PT1H8M42S','1:08:42'],
    [{y:0,m:0,d:0,h:1,i:12,s:25,u:0},'PT1H12M25S','1:12:25'],
    [{y:0,m:0,d:0,h:1,i:17,s:17,u:0},'PT1H17M17S','1:17:17'],
    [{y:0,m:0,d:0,h:1,i:21,s:35,u:0},'PT1H21M35S','1:21:35'],
    [{y:0,m:0,d:1,h:2,i:3,s:4,u:0},'P1DT2H3M4S','1d2:03:04'],
    [{y:0,m:1,d:2,h:3,i:4,s:5,u:0},'P1M2DT3H4M5S','1m2d3:04:05'],
    [{y:1,m:2,d:3,h:4,i:5,s:6,u:789012},'P1Y2M3DT4H5M6.789012S','1y2m3d4:05:6.789012'],
    [{y:1,m:0,d:0,h:0,i:0,s:0,u:0},'P1Y','1y0:00:00'],
    [{y:0,m:1,d:0,h:0,i:0,s:0,u:0},'P1M','1m0:00:00'],
    [{y:0,m:0,d:1,h:0,i:0,s:0,u:0},'P1D','1d0:00:00'],
    [{y:0,m:0,d:0,h:1,i:0,s:0,u:0},'PT1H','1:00:00'],
    [{y:0,m:0,d:0,h:0,i:1,s:0,u:0},'PT1M','1:00'],
    [{y:0,m:0,d:0,h:0,i:0,s:1,u:0},'PT1S','1'],
    [{y:0,m:0,d:0,h:0,i:0,s:0,u:1},'PT0.000001S','0.000001'],

];
for (const test of toStringIso) {
	const create = test[0];
	const iso = test[1] as string;
	const str = test[2] as string;

	tsts(`ISO encode ${iso}:`, () => {
		const d = new Duration(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(d.toIso8601(), iso);
	});

	tsts(`toString ${iso}:`, () => {
		const d = new Duration(
			create.y,
			create.m,
			create.d,
			create.h,
			create.i,
			create.s,
			create.u
		);
		assert.equal(d.toString(), str);
	});
}

tsts.run();
