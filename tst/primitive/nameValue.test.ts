import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { nameValue} from '../../src/primitive/nameValue';

const tsts = suite('nameValue');

tsts(`nameValue(abba)`,()=>{
    const abba="dancing queen";
    const [name,value]=nameValue({abba});
    assert.is(name,'abba');
    assert.is(value,abba);
});

tsts(`nameValue(queen)`,()=>{
    const queen="killer";
    const [name,value]=nameValue({queen});
    assert.is(name,'queen');
    assert.is(value,queen);
});

tsts.run();