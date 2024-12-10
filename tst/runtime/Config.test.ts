import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { config } from '../config';
import { ILogEntry, ILogTarget, LogLevel } from '../../src/runtime/interfaces/ForLog';
import { log } from '../../src/runtime/Log';

const tsts = suite('Config');

class LogArray implements ILogTarget {
    arr:ILogEntry[]=[];
    readonly supportColor=false;
    log(entry: ILogEntry): void {
        this.arr.push(entry);
    }
}
const logArr=new LogArray();

let impEnvCalled=0;
let impAvEnvCalled=0;
config.define('test',false)
    .importEnv('npm_lifecycle_event',(v,set)=>{
        //v is the name of the `script` called from package.json.scripts, we'd expect:
        // test|test:deep|test:deeper
        impEnvCalled++;
        let isTest=false;
        if (v==='test' || v?.startsWith('test:')) isTest=true;
        
        //Normally you'd set config here, but that will mess up tests below.
        //if (isTest) set(true);
    })
    .importAvailEnv('never',(v,set)=>{
        impAvEnvCalled++;
    })
    .importEnv('never2',(v,set)=>{
        impEnvCalled++;
    });
config.define('running-in-test',false)
    .importAvailEnv('npm_lifecycle_event',(v,set)=>{
        if (v==='test') set(true);
        else if (v.startsWith('test:')) set(true);
    });
config.define('string-var','ball');
config.define('guarded','password',true);

tsts(`importEnv called twice`,()=>{
    //Called by npm_lifecycle_event and never2
    assert.equal(impEnvCalled,2);
});

tsts(`importAvailEnv not called`,()=>{
    //Not called in .importAvailEnv(never)
    assert.equal(impAvEnvCalled,0);
});

tsts(`env.npm_lifecycle_event updates config.running-in-test`,()=>{
    //Note this test is somewhat fragile due to assumptions about npm vars
    // todo: deno equiv
    const vr=config.getValueReason('running-in-test');
    if (vr===undefined) return;
    const [value,reason]=vr;
    assert.equal(value,true,'value');
    assert.equal(reason,'env.npm_lifecycle_event');
});

tsts(`config.test still default`,()=>{
    assert.equal(config.getBool('test'),false);
    
});

tsts(`config.test call default is ignored`,()=>{
    assert.equal(config.getBool('test',true),false);
});

tsts(`config.set(test) mutates value`,()=>{
    config.set('test',true);
    assert.equal(config.getBool('test'),true);
    assert.equal(config.getValueReason('test'),[true,'direct set']);
    assert.equal(config.getInvertedBool('test'),false,'getInvertedBool');
});

tsts(`config.getBool(unknown) returns default`,()=>{
    assert.equal(config.getBool('unknown',true),true);
    assert.equal(config.getInvertedBool('unknown',true),true);
});

tsts(`config.getBool(string-var) returns default (wrong type)`,()=>{
    assert.equal(config.getBool('string-var'),false);
    assert.equal(config.getInvertedBool('string-var'),false)
});

tsts(`Define same key twice throws`,()=>{
    assert.throws(()=>config.define('test','test default'));
});

tsts(`Set undefined config throws`,()=>{
    assert.throws(()=>config.set('unknown',true));
});

tsts(`Set config to different type throws`,()=>{
    assert.throws(()=>config.set('test','a string'));
});

tsts(`getValueReason(unknown) is undefined`,()=>{
    assert.equal(config.getValueReason('unknown'),undefined);
});

tsts(`getString(string-var)`,()=>{
    assert.equal(config.getString('string-var'),'ball');
});

tsts(`getString(unknown-var) returns default`,()=>{
    assert.equal(config.getString('unknown-str'),'');
});

tsts(`getString(test) returns default (wrong type)`,()=>{
    assert.equal(config.getString('test'),'');
});

tsts(`getBool(string-var) logs info about type mismatch`,()=>{
    log.target=logArr;
    logArr.arr=[];
    const key='string-var';
    assert.is(logArr.arr.length,0);

    const boolVal=config.getBool(key);
    assert.is(logArr.arr.length,1);
    assert.is(logArr.arr[0].level,LogLevel.Info);
    assert.is(logArr.arr[0].message,'incorrect type access');

    const strVal=config.getString(key);
    assert.is(logArr.arr.length,1,'correct type access did not increase log');
})

tsts(`guarded access log.warn`,()=>{
    log.target=logArr;
    logArr.arr=[];
    assert.is(logArr.arr.length,0);

    const val=config.getString('guarded');
    assert.is(logArr.arr.length,1);
    assert.is(logArr.arr[0].level,LogLevel.Warn);
    assert.is(logArr.arr[0].message,'guarded config access');

    const vr=config.getValueReason('guarded');
    assert.is(logArr.arr.length,2,'getValueReason also logs');
    assert.is(logArr.arr[0].level,LogLevel.Warn);
    assert.is(logArr.arr[0].message,'guarded config access');

})


tsts.run();