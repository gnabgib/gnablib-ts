import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ParseProblem } from '../../src/error/ParseProblem';
import util from 'util';
import { Color } from '../../src/cli/tty';
import { config } from '../config';

const tsts = suite('ParseProblem');
const DEMO=false || config.getBool('demo');
//By importing Color, and setting up this pointless 'blue' we configure 'color' and detect
// any environmental concerns about the use of color. By default (if undefined) no color
// will be used, but once the tty page has been loaded the inverse is true - color will be
// used unless the env says otherwise
const blue=Color.blue;

const buildSet:[string,string,string|undefined,number|undefined,number|undefined,string][]=[
    ['$noun','$reason',undefined,undefined,undefined,'Invalid $noun, $reason'],
    ['$noun','$reason','$content',undefined,undefined,'Invalid $noun, $reason; \'$content\''],
    ['$noun','$reason','$content',0,undefined,'Invalid $noun, $reason\n  \'$content\':0'],//end->1
    ['$noun','$reason','$content',0,1,'Invalid $noun, $reason\n  \'$content\':0-1'],
    ['$noun','$reason','$content',0,2,'Invalid $noun, $reason\n  \'$content\':0-2'],
    //Not great signatures:
    ['$noun','$reason','$content',undefined,1,'Invalid $noun, $reason\n  \'$content\':0-1'],//start->0
    ['$noun','$reason','$content',undefined,2,'Invalid $noun, $reason\n  \'$content\':0-2'],//start->0
    ['$noun','$reason',undefined,0,undefined,'Invalid $noun, $reason :0'],
    ['$noun','$reason',undefined,0,2,'Invalid $noun, $reason :0-2'],
];
let i=0;
for(const [noun,reason,content,start,end,expect] of buildSet) {
    tsts(`build[${i++}]`,()=>{
        //@ts-expect-error (yes content/start/end being undefinable is counter to sigs, but handled in code)
        const p=new ParseProblem(noun,reason,content,start,end);
        assert.is(p.noun,noun);
        assert.is(p.reason,reason);
        assert.is(p.content,content);
        //assert.is(p.start,start); - we can't test this without redefining since start will be set to 0 when st
        //assert.is(p.end,end); - we can't test this without redefining end since it'll be set to start+1
        assert.is(p.toString(),expect);
        p.inColor();//Just for coverage
    })
}

tsts(`coverage`, () => {
	const p = new ParseProblem('$noun', '$reason');
	assert.is(p.name, 'ParseProblem', 'name');
	const str = Object.prototype.toString.call(p);
	assert.is(str.indexOf('ParseProblem') > 0, true);
    util.inspect(p);//Just for coverage
});

const demoSet:ParseProblem[]=[
    new ParseProblem('$noun','$reason'),
    new ParseProblem('$noun','$reason','abc'),
    new ParseProblem('$noun','$reason','abcdef',2),
    new ParseProblem('$noun','$reason','abcdef',2,4),
];
if (DEMO) {
    for(const pp of demoSet) {
        console.log(pp.toString());
        console.log(pp);//=pp.inColor()
        console.log('--');
    }    
}

tsts.run();
