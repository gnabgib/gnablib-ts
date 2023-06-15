import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { MatchDetail, MatchSuccess } from '../../src/primitive/MatchResult';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('MatchSuccess');

const w=new WindowStr('ab');
const matchSucTest:[MatchDetail,string][]=[
	[{value:new WindowStr('8')},'remain=ab\n8\n'],
	[{name:'ford',value:new WindowStr('8')},'remain=ab\nford=8\n'],
	[{value:new WindowStr('8'),components:[{name:'up',value:new WindowStr('down')}]},'remain=ab\n8\n  up=down\n'],
];
let i=0;
for(const [r,expect] of matchSucTest) {
	tsts(`toPrimitive[${i++}]`,()=>{
		const s=new MatchSuccess(w,r);
		assert.is(s.remain,w);
		assert.is(s.result,r);

		assert.is(''+s,expect);
	});
}

tsts.run();
