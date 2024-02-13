import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {DurationVague, IDurationVagueParts} from '../../../src/primitive/datetime/DurationVague';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

const tsts = suite('DurationVague');

const newSet:[IDurationVagueParts,string][]=[
    [{y:1},'1y'],
    [{m:1},'1m'],
    [{d:1},'1d'],
    [{y:1,m:3,d:5},'1y3m5d'],
    [{y:5,m:1,d:3},'5y1m3d'],
];
for(const [parts,str] of newSet) {
    const du=DurationVague.new(parts);
    tsts(`${du}`,()=>{
        assert.equal(du.toString(),str);
        if (parts.y) assert.equal(du.year,parts.y,'y');
        if (parts.m) assert.equal(du.month,parts.m,'m');
    });
}

tsts('[Symbol.toStringTag]', () => {
    const o=DurationVague.zero;
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('DurationVague') > 0, true);
});

tsts('util.inspect',()=>{
    const o=DurationVague.max;
    const u=util.inspect(o);
    assert.is(u.startsWith('DurationVague('),true);
});

tsts.run();