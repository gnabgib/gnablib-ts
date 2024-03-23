import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { RangeProblem } from '../../../src/error/probs/RangeProblem';
import util from 'util';
import { Color } from '../../../src/cli/tty';
import { config } from '../../config';

const tsts = suite('RangeProblem');
const DEMO=false || config.getBool('demo');
//By importing Color, and setting up this pointless 'blue' we configure 'color' and detect
// any environmental concerns about the use of color. By default (if undefined) no color
// will be used, but once the tty page has been loaded the inverse is true - color will be
// used unless the env says otherwise
const blue=Color.blue;

const buildSet:[string,string,unknown,string][]=[
    ['$noun','$descr',true,'$noun $descr, got: true'],
    ['$noun','should be 1-5',6,'$noun should be 1-5, got: 6'],
    ['$noun','should be a-f','g','$noun should be a-f, got: \'g\''],
];
let i=0;
for(const [noun,descr,value,expect] of buildSet) {
    tsts(`build[${i++}]`,()=>{
        const p=new RangeProblem(noun,descr,value);
        assert.is(p.noun,noun);
        assert.is(p.value,value);
        assert.is(p.toString(),expect);
        p.inColor();//Just for coverage
    })
}

const incIncSet:[string,unknown,unknown,unknown,string][]=[
    ['$noun',6,1,5,'$noun should be [1,5], got: 6'],
];
i=0;
for(const [noun,value,low,high,expect] of incIncSet) {
    tsts(`IncInc[${i++}]`,()=>{
        const p=RangeProblem.IncInc(noun,value,low,high);
        assert.is(p.noun,noun);
        assert.is(p.value,value);
        assert.is(p.toString(),expect);
    })
}

tsts(`coverage`, () => {
	const p = new RangeProblem('$noun', '$descr',1);
	assert.is(p.name, 'RangeProblem', 'name');
	const str = Object.prototype.toString.call(p);
	assert.is(str.indexOf('RangeProblem') > 0, true);
    util.inspect(p);//Just for coverage
});

const demoSet:RangeProblem<unknown>[]=[
    new RangeProblem('$noun','invalid',42),
    new RangeProblem('character','should be a-f','g'),
    RangeProblem.IncInc('$noun',6,1,5),
    new RangeProblem('$noun','should be true',false),//farcical, but testing
    new RangeProblem('$noun','should be',undefined),//farcical, but testing
    new RangeProblem('$noun','should be',null),//farcical, but testing
    new RangeProblem('$noun','should be',''),//farcical, but testing

];
if (DEMO) {
    for(const pp of demoSet) {
        console.log(pp.toString());
        console.log(pp);//=pp.inColor()
        console.log('--');
    }    
}

tsts.run();
