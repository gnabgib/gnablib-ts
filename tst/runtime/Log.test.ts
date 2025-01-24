import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { LogConsole,LogFilter,log } from '../../src/runtime/Log';
import { ILogEntry, ILogTarget, LogLevel } from '../../src/runtime/interfaces/ForLog';
import { config } from '../config';
import { Color } from '../../src/cli/tty';

const tsts = suite('Log');
const DEMO=false || config.getBool('demo');
//By importing Color, and setting up this pointless 'blue' we configure 'color' and detect
// any environmental concerns about the use of color. By default (if undefined) no color
// will be used, but once the tty page has been loaded the inverse is true - color will be
// used unless the env says otherwise
const blue=Color.blue;


class LogArray implements ILogTarget {
    arr:ILogEntry[]=[];
    readonly supportColor=false;
    log(entry: ILogEntry): void {
        this.arr.push(entry);
    }
}
const logArr=new LogArray();

tsts(`log.debug`,()=>{
    log.target=logArr;
    logArr.arr=[];

    const msg='Debug-message';
    log.debug(msg,{doctor:'who'});
    assert.equal(logArr.arr.length,1,'len');
    assert.equal(logArr.arr[0].level,LogLevel.Debug,'level');
    assert.equal(logArr.arr[0].message,msg,'message');
    assert.equal(logArr.arr[0].fields['doctor'],'who');
    const str=logArr.arr[0].toString(false);
    assert.equal(str.startsWith('[Debug] 20'),true);//Good for 76 years.. sorry future QA
    assert.equal(str.endsWith(' Debug-message'),true);

    log.target=undefined;
});

tsts(`log.info`,()=>{
    log.target=logArr;
    logArr.arr=[];

    const msg='Info-message';
    log.info(msg,{torch:'wood'});
    assert.equal(logArr.arr.length,1,'len');
    assert.equal(logArr.arr[0].level,LogLevel.Info,'level');
    assert.equal(logArr.arr[0].message,msg,'message');
    assert.equal(logArr.arr[0].fields['torch'],'wood','field');
    const clrStr=logArr.arr[0].toString(true);
    //Rigid test - requires colorization knowledge
    assert.equal(clrStr.substring(0,18),'[\x1b[36mInfo \x1b[39m] ','Color start');

    log.target=undefined;
});

tsts(`log.warn`,()=>{
    log.target=logArr;
    logArr.arr=[];

    const msg='Warn-message';
    log.warn(msg,{bad:'wolf'});
    assert.equal(logArr.arr.length,1,'len');
    assert.equal(logArr.arr[0].level,LogLevel.Warn,'level');
    assert.equal(logArr.arr[0].message,msg,'message');
    assert.equal(logArr.arr[0].fields['bad'],'wolf');
    
    log.target=undefined;
});

tsts(`log.error`,()=>{
    log.target=logArr;
    logArr.arr=[];

    const msg='Error-message';
    log.error(msg,{time:'relative dimension in space'});
    assert.equal(logArr.arr.length,1,'len');
    assert.equal(logArr.arr[0].level,LogLevel.Error,'level');
    assert.equal(logArr.arr[0].message,msg,'message');
    assert.equal(logArr.arr[0].fields['time'],'relative dimension in space');

    log.target=undefined;
});

tsts(`logFilter`,()=>{
    log.target=new LogFilter(logArr,LogLevel.Error);
    logArr.arr=[];
    assert.equal(logArr.arr.length,0,'len');
    assert.equal(log.supportColor,logArr.supportColor);

    log.warn('You should not see this message');
    assert.equal(logArr.arr.length,0,'len');

    log.error('You should see this message');
    assert.equal(logArr.arr.length,1,'len');

    log.target=undefined;
})

tsts(`log.targetSwitch logs`,()=>{
    log.target=logArr;
    logArr.arr=[];

    log.target=undefined;
    assert.equal(logArr.arr.length,1,'len');
    assert.equal(logArr.arr[0].level,LogLevel.Warn,'level');
    assert.equal(logArr.arr[0].message,'Log target being switched','message');
});

tsts(`logOracle`,()=>{
    //We can't test this very easily, it's a singleton and could have been set elsewhere
    assert.type(log.supportColor,'boolean');
});

if (DEMO) {
    log.target=new LogFilter(new LogConsole(),LogLevel.Debug);
    console.log('--');
    log.error('Some kind of error',{'TARDIS':'Time and relative dimension in space'});
    console.log('--');
    log.warn('Some kind of warn',{'a':1});
    console.log('--');
    log.info('Useful information',{'engage':true});
    console.log('--');
    log.debug('Debug details',{'version':3.14});

    //Cleanup
    log.target=logArr;
}


// tsts(`general`,()=>{
//     let impEnvWasCalled=false;
//     let impAvEnvWasCalled=false;
//     config
//         .define('test',false)
//         .importEnv('npm_lifecycle_event',(v,set)=>{
//             //v is the name of the `script` called from package.json.scripts, we'd expect:
//             // test|test:deep|test:deeper
//             impEnvWasCalled=true;
//             let isTest=false;
//             if (v==='test') isTest=true;
//             else if (v?.startsWith('test:')) isTest=true;
//             //Normally you'd set state here, but that will mess up tests below.
//             //if (isTest) set(true);
//         })
//         .importAvailEnv('never',(v,set)=>{
//             impAvEnvWasCalled=true;
//         });
//     config
//         .define('running-in-test',false)
//         .importAvailEnv('npm_lifecycle_event',(v,set)=>{
//             if (v==='test') set(true);
//         })
//     assert.equal(impEnvWasCalled,true);
//     assert.equal(impAvEnvWasCalled,false);
//     assert.equal(config.getBool('running-in-test'),true);

//     assert.equal(config.getBool('test'),false,'getBool(default)');
//     assert.equal(config.getBool('test',true),false,'Default is not required/used');
    
//     config.set('test',true);
//     assert.equal(config.getBool('test'),true,'getBool(true)');
//     assert.equal(config.getValueReason('test'),[true,'direct set']);
//     assert.equal(config.getInvertedBool('test'),false,'getInvertedBool');

//     assert.equal(config.getBool('unknown',true),true,'getBool(unknown) returns default');
//     assert.equal(config.getInvertedBool('unknown',true),true,'getInvertedBool(unknown) returns default');

//     assert.throws(()=>config.define('test','test'),'Define same key twice throws');
//     assert.throws(()=>config.set('unknown',true),'Set unknown throws');

//     assert.equal(config.getValueReason('unknown'),undefined,'value/reason of unknown config is undefined');
// });

// tsts(`set logger`,()=>{
    
// })

tsts.run();