import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { TypeProblem } from '../../../src/error/probs/TypeProblem';
import util from 'util';
import { Color } from '../../../src/cli/tty';
import { config } from '../../config';

const tsts = suite('TypeProblem');
const DEMO=false || config.getBool('demo');
//By importing Color, and setting up this pointless 'blue' we configure 'color' and detect
// any environmental concerns about the use of color. By default (if undefined) no color
// will be used, but once the tty page has been loaded the inverse is true - color will be
// used unless the env says otherwise
const blue=Color.blue;

const unexpValSet:[string,unknown,string,string][]=[
    ['$noun',10,'string','$noun should be string, got number']
];
let i=0;
for(const [noun,value,expect,str] of unexpValSet) {
    tsts(`UnexpVal[${i++}]`,()=>{
        const p=TypeProblem.UnexpVal(noun,value,expect);
        assert.is(p.noun,noun);
        assert.is(p.toString(),str);
        p.inColor();//Just for coverage
    })
}

const nullSet:[string,string][]=[
    ['$noun','$noun cannot be null']
];
i=0;
for(const [noun,str] of nullSet) {
    tsts(`Null[${i++}]`,()=>{
        const p=TypeProblem.Null(noun);
        assert.is(p.noun,noun);
        assert.is(p.toString(),str);
        p.inColor();//Just for coverage
    })
}

tsts(`coverage`, () => {
	const p = TypeProblem.UnexpVal('$noun',undefined,'atoms');
	assert.is(p.name, 'TypeProblem', 'name');
	const str = Object.prototype.toString.call(p);
	assert.is(str.indexOf('TypeProblem') > 0, true);
    util.inspect(p);//Just for coverage
});

const demoSet:TypeProblem[]=[
    TypeProblem.UnexpVal('$noun',10,'string'),
    TypeProblem.Null('$noun'),
];
if (DEMO) {
    for(const pp of demoSet) {
        console.log(pp.toString());
        console.log(pp);//=pp.inColor()
        console.log('--');
    }    
}

tsts.run();
