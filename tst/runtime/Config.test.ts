import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { config } from '../config';

const tsts = suite('Config');

tsts(`general`,()=>{
    config
        .define('test',false)
        .importEnv('npm_lifecycle_event',(v,set)=>{
            //v is the name of the `script` called from package.json.scripts, we'd expect:
            // test|test:deep|test:deeper
            let isTest=false;
            if (v==='test') isTest=true;
            else if (v?.startsWith('test:')) isTest=true;
            //Normally you'd set state here, but that will mess up tests below.
            //if (isTest) set(true);
        });

    assert.equal(config.getBool('test'),false,'getBool(default)');
    assert.equal(config.getBool('test',true),false,'Default is not required/used');
    
    config.set('test',true);
    assert.equal(config.getBool('test'),true,'getBool(true)');
    assert.equal(config.getValueReason('test'),[true,'unknown']);
    assert.equal(config.getInvertedBool('test'),false,'getInvertedBool');

    assert.equal(config.getBool('unknown',true),true,'getBool(unknown) returns default');
    assert.equal(config.getInvertedBool('unknown',true),true,'getInvertedBool(unknown) returns default');

    assert.throws(()=>config.define('test','test'),'Define same key twice throws');
    assert.throws(()=>config.set('unknown',true),'Set unknown throws');

    assert.equal(config.getValueReason('unknown'),undefined,'value/reason of unknown config is undefined');
})

tsts.run();