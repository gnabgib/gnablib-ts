// import { suite } from 'uvu';
// import * as assert from 'uvu/assert';
// import {Duration} from '../../../src/primitive/duration/Duration';
// import { BitWriter } from '../../../src/primitive/BitWriter';
// import { hex } from '../../../src/codec';
// import { BitReader } from '../../../src/primitive/BitReader';
// import util from 'util';
// import { WindowStr } from '../../../src/primitive/WindowStr';

// const tsts = suite('Duration');

// const newSet:[number,number,number,number,number,string][]=[
//     [1,0,0,0,0,'1d'],
//     [1.5,0,0,0,0,'1d12h'],
//     [1.9,0,0,0,0,'1d21h36m'],
//     [1.99,0,0,0,0,'1d23h45m36s'],
//     [1.999,0,0,0,0,'1d23h58m33.600000s'],
//     [1.9999,0,0,0,0,'1d23h59m51.360000s'],
//     [1.99999,0,0,0,0,'1d23h59m59.136000s'],
//     [1.999999,0,0,0,0,'1d23h59m59.913600s'],
//     [1.9999999,0,0,0,0,'1d23h59m59.991360s'],
//     [1.99999999,0,0,0,0,'1d23h59m59.999136s'],
//     [0,1,0,0,0,'1h'],
//     [0,1.5,0,0,0,'1h30m'],
//     [0,0,1,0,0,'1m'],
//     [0,0,1.5,0,0,'1m30s'],
//     [0,0,0,1,0,'1s'],
//     [0,0,0,1.5,0,'1.500000s'],
//     [0,0,0,1.1,0,'1.100000s'],
//     [0,0,0,1.01,0,'1.010000s'],
//     [0,0,0,1.001,0,'1.001000s'], //floating point error
//     [0,0,0,1,100000,'1.100000s'],
//     [0,0,0,0,10000,'0.010000s'],
//     [0,0,0,0,1000,'0.001000s'],
//     [0,0,0,0,100,'0.000100s'],
//     [0,0,0,0,10,'0.000010s'],
//     [0,0,0,0,1,'0.000001s'],
//     [0,0,0,0,1.5,'0.000001s'],
// ];
// for(const [d,h,m,s,us,str] of newSet) {
//     tsts(`new(${d} ${h} ${m} ${s} ${us})`,()=>{
//         const du=Duration.new(d,h,m,s,us);
//         assert.equal(du.toString(),str);
//     });
// }

// tsts('[Symbol.toStringTag]', () => {
//     const o=Duration.zero;
// 	const str = Object.prototype.toString.call(o);
// 	assert.is(str.indexOf('Duration') > 0, true);
// });

// tsts('util.inspect',()=>{
//     const o=Duration.zero;
//     const u=util.inspect(o);
//     assert.is(u.startsWith('Duration('),true);
// });

// tsts.run();
