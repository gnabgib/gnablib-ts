import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ParseProblem } from '../../src/error/ParseProblem';
import util from 'util';

const tsts = suite('ParseProblem');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const p = new ParseProblem('$noun', '$reason');
	assert.is(p.name, 'ParseProblem', 'name');
	const str = Object.prototype.toString.call(p);
	assert.is(str.indexOf('ParseProblem') > 0, true);

	assert.is(p.noun, '$noun');
    assert.is(p.reason, '$reason');
    assert.is(p.toString(),'Invalid $noun, $reason')
    p.inColor();//Just for coverage
    util.inspect(p);//Just for coverage
});

tsts(`build(str,str,str)`,()=>{
    const p=new ParseProblem('$noun','$reason','$content');
	assert.is(p.noun, '$noun');
    assert.is(p.reason, '$reason');
    assert.is(p.content, '$content');
    assert.is(p.toString(),'Invalid $noun, $reason\n  \'$content\'')
    p.inColor();//Just for coverage
});

tsts(`build(str,str,str,num)`,()=>{
    const p=new ParseProblem('$noun','$reason','$content',0);
	assert.is(p.noun, '$noun');
    assert.is(p.reason, '$reason');
    assert.is(p.content, '$content');
    assert.is(p.start, 0);
    assert.is(p.toString(),'Invalid $noun, $reason\n  \'$content\':0')
    p.inColor();//Just for coverage
});

tsts(`build(str,str,str,num,num)`,()=>{
    const p=new ParseProblem('$noun','$reason','$content',0,1);
	assert.is(p.noun, '$noun');
    assert.is(p.reason, '$reason');
    assert.is(p.content, '$content');
    assert.is(p.start, 0);
    assert.is(p.end, 1);
    assert.is(p.toString(),'Invalid $noun, $reason\n  \'$content\':0-1')
    p.inColor();//Just for coverage
});

tsts(`build(str,str,str,,num)`,()=>{
    const p=new ParseProblem('$noun','$reason','$content',undefined,1);
	assert.is(p.noun, '$noun');
    assert.is(p.reason, '$reason');
    assert.is(p.content, '$content');
    assert.is(p.start, undefined);
    assert.is(p.end, 1);
    assert.is(p.toString(),'Invalid $noun, $reason\n  \'$content\':-1')
    p.inColor();//Just for coverage
});

tsts(`build(str,str,,num,num)`,()=>{
    const p=new ParseProblem('$noun','$reason',undefined,0,1);
	assert.is(p.noun, '$noun');
    assert.is(p.reason, '$reason');
    assert.is(p.content, undefined);
    assert.is(p.start, 0);
    assert.is(p.end, 1);
    assert.is(p.toString(),'Invalid $noun, $reason :0-1')
    p.inColor();//Just for coverage
});

// const inColorSet:[string,string,string|undefined,number|undefined,number|undefined][]=[
//     ['$noun','$reason',undefined,undefined,undefined],
// ];
// for(const [noun,reason,content,start,end] of inColorSet) {
//     tsts(`inColor`,()=>{
//         const e=new ParseProblem(noun,reason,content,start,end);
//     })
// }

tsts.run();
