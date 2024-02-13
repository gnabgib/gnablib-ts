import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Duration, IDurationParts} from '../../../src/primitive/datetime/Duration';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

const tsts = suite('Duration');

const newSet:[number,number,number,number,number,string,string][]=[
    [0,0,0,0,0,'0s','P0D'],
    [1,0,0,0,0,'1d','P1D'],
    [0,1,0,0,0,'1h','PT1H'],
    [0,0,1,0,0,'1m','PT1M'],
    [0,0,0,1,0,'1s','PT1S'],
    [0,0,0,1,100000,'1.100000s','PT1.100000S'],
    [0,0,0,0,10000,'0.010000s','PT0.010000S'],
    [0,0,0,0,1000,'0.001000s','PT0.001000S'],
    [0,0,0,0,100,'0.000100s','PT0.000100S'],
    [0,0,0,0,10,'0.000010s','PT0.000010S'],
    [0,0,0,0,1,'0.000001s','PT0.000001S'],
];
for(const [d,h,m,s,us,str,iso] of newSet) {
    const du=Duration.new({d,h,m,s,us});
    tsts(`({${d} ${h} ${m} ${s} ${us}})`,()=>{
        assert.equal(du.day,d,'d');
        assert.equal(du.hour,h,'h');
        assert.equal(du.minute,m,'m');
        assert.equal(du.second,s,'s');
        assert.equal(du.microsecond,us,'us');
    });
    tsts(`({${d} ${h} ${m} ${s} ${us}}).toString`,()=>{
        assert.equal(du.toString(),str);
    });
    tsts(`({${d} ${h} ${m} ${s} ${us}}).toJSON`,()=>{
        assert.equal(du.toJSON(),str);
    });
    tsts(`({${d} ${h} ${m} ${s} ${us}}).toIso8601`,()=>{
        assert.equal(du.toIso8601(),iso);
    });
}

const dodgyNewSet:[number,number,number,number,number,string,string][]=[
    [1.5,0,0,0,0,'1d12h','P1DT12H'],
    [1.9,0,0,0,0,'1d21h36m','P1DT21H36M'],
    [1.99,0,0,0,0,'1d23h45m36s','P1DT23H45M36S'],
    [1.999,0,0,0,0,'1d23h58m33.600000s','P1DT23H58M33.600000S'],
    [1.9999,0,0,0,0,'1d23h59m51.360000s','P1DT23H59M51.360000S'],
    [1.99999,0,0,0,0,'1d23h59m59.136000s','P1DT23H59M59.136000S'],
    [1.999999,0,0,0,0,'1d23h59m59.913600s','P1DT23H59M59.913600S'],
    [1.9999999,0,0,0,0,'1d23h59m59.991360s','P1DT23H59M59.991360S'],
    [1.99999999,0,0,0,0,'1d23h59m59.999136s','P1DT23H59M59.999136S'],
    [0,1.5,0,0,0,'1h30m','PT1H30M'],
    [0,0,1.5,0,0,'1m30s','PT1M30S'],
    [0,0,0,1.5,0,'1.500000s','PT1.500000S'],
    [0,0,0,1.1,0,'1.100000s','PT1.100000S'],
    [0,0,0,1.01,0,'1.010000s','PT1.010000S'],
    [0,0,0,1.001,0,'1.001000s','PT1.001000S'], //floating point error
    [0,0,0,0,1.5,'0.000001s','PT0.000001S'],//us truncated (NOT rounded)
];
for(const [d,h,m,s,us,str,iso] of newSet) {
    const du=Duration.new({d,h,m,s,us});
    tsts(`({${d} ${h} ${m} ${s} ${us}}).toString`,()=>{
        assert.equal(du.toString(),str);
    });
    tsts(`({${d} ${h} ${m} ${s} ${us}}).toJSON`,()=>{
        assert.equal(du.toJSON(),str);
    });
    tsts(`({${d} ${h} ${m} ${s} ${us}}).toIso8601`,()=>{
        assert.equal(du.toIso8601(),iso);
    });
}

const parseSet:[WindowStr,string][]=[
    [WindowStr.new('0s'),'0s'],
    [WindowStr.new('0S'),'0s'],
    [WindowStr.new('1s'),'1s'],
    [WindowStr.new('1m'),'1m'],
    [WindowStr.new('1M'),'1m'],
    [WindowStr.new('1h'),'1h'],
    [WindowStr.new('1H'),'1h'],
    [WindowStr.new('1d'),'1d'],
    [WindowStr.new('1D'),'1d'],
    [WindowStr.new('1D2H3M4S'),'1d2h3m4s'],
    [WindowStr.new('0.000001s'),'0.000001s'],
    [WindowStr.new('0.000001S'),'0.000001s'],
    [WindowStr.new('0.01S'),'0.010000s'],
    [WindowStr.new('0.1s'),'0.100000s'],
    [WindowStr.new('1d '),'1d'],//Trailing space consumed
    [WindowStr.new('\t1d '),'1d'],//Whitespace consumed
    [WindowStr.new(' 1h 2m '),'1h2m'],//Whitespace consumed
];
for(const [w,str] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const du=Duration.parse(w);
        assert.equal(du.toString(),str);
    })
}

const badParseSet:WindowStr[]=[
    WindowStr.new('0'),//There's no units here
    WindowStr.new('1y'),//What's a y?
    WindowStr.new('1d!'),//Good until !
    WindowStr.new('1min'),//Good until `in`
];
for(const w of badParseSet) {
    tsts(`parse(${w.debug()}) throws`,()=>{
        assert.throws(()=>Duration.parse(w));
    });
}


tsts('[Symbol.toStringTag]', () => {
    const o=Duration.zero;
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Duration') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Duration.zero;
    const u=util.inspect(o);
    assert.is(u.startsWith('Duration('),true);
});

const serSet:[IDurationParts,string,string,string][]=[
    [{s:0},'0s','0000000000000000','0'],
    [{us:1},'0.000001s','0000000000000001','0.000001'],
    [{s:1},'1s','00000000000F4240','1'],//1M
    [{m:1},'1m','0000000003938700','1:00'],//60M
    [{h:1},'1h','00000000D693A400','1:00:00'],//3600M
    [{h:2.25},'2h15m','00000001E2CC3100','2:15:00'],
    [{d:1},'1d','0000010000000000','24:00:00'],
    [{d:3,s:13},'3d13s','0000030000C65D40','72:00:13'],
    [{d:3,h:5,m:7,s:13},'3d5h7m13s','000003044AB14240','77:07:13'],
];
for(const [parts,str,ser,timeLike] of serSet) {
    const du=Duration.new(parts);
    tsts(`(${du}).ser()`,()=>{
        var bw = new BitWriter(Math.ceil(Duration.serialBits / 8));
		du.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), ser);
    });

    tsts(`deser(${ser})`,()=>{
		const bytes = hex.toBytes(ser);
		const br = new BitReader(bytes);
        const du2=Duration.deserialize(br).validate();
        assert.is(du2.toString(),str);
    })

    tsts(`toTimeLike(${du})`,()=>{
        assert.is(du.toTimeLike(),timeLike);
    })

    tsts(`fromTimeLike(${du})`,()=>{
        const du2=Duration.fromTimeLike(timeLike).validate();
        assert.is(du2.toString(),str);
    })
}

const badFromTimeLikeSet:string[]=[
    '100',
    '100:1',
    // '1',
    // '1:23',
    // '1:23:45',
    '1:::1',//That's an IP mate
];
for(const str of badFromTimeLikeSet) {
    tsts(`fromTimeLike(${str}) throws`,()=>{
        assert.throws(()=>Duration.fromTimeLike(str));
    })
}

tsts('serialSizeBits',()=>{
    const o=Duration.zero;
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<=64,true);//Make sure it fits in 64 bits
});

tsts('fromUs negative throws',()=>{
    assert.throws(()=>Duration.fromUs(-1));
});

const badNewSet:IDurationParts[]=[
    {d:-1},
    {h:-1},
    {m:-1},
    {s:-1},
    {us:-1},
];
for(const parts of badNewSet) {
    tsts(`(${parts}) throws`,()=>{
        assert.throws(()=>Duration.new(parts));
    })
}

tsts.run();
