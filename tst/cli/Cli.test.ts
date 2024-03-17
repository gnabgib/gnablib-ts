import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Cli} from '../../src/cli/Cli.ts';
import { config } from '../config.ts';

const tsts = suite('Describe');
const DEMO=false || config.getBool('demo');


tsts('version',()=>{
    const d=new Cli('eg','Example cli');
    d.setOption('color',false);
    assert.equal(d.versionBlock(),'Version: 0\n');
    d.ver('eleventy');
    assert.equal(d.versionBlock(),'Version: eleventy\n');
});

tsts('set version twice fails',()=>{
    const d=new Cli('eg','Example cli');
    d.ver('2');
    assert.equal(d.ver('3').hasError,true);
});

tsts('set version after finalize fails',()=>{
    const d=new Cli('eg','Example cli');
    d.helpBlock();
    assert.equal(d.ver('3').hasError,true);
});

tsts('require(key)',()=>{
    const d=new Cli('eg','Example cli').require('key','descr','herp');
    assert.equal(d.value('key'),'herp');
});

tsts('require(key) after final fails',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.require('key','descr','herp').hasError,false);
    d.helpBlock();
    assert.equal(d.require('key','descr','herp').hasError,true);
});

tsts('require(key).require(key) fails',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.require('key','descr','herp').hasError,false);
    assert.equal(d.require('key','descr','herp').hasError,true);
});

tsts('flag(key)',()=>{
    const d=new Cli('eg','Example cli').flag('key','descr',false,'k');
    assert.equal(d.value('key'),false,'key value');
    assert.equal(d.value('k'),false,'k alias');
});

tsts('flag(key) after final fails',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.flag('key','descr',false,'k').hasError,false);
    d.helpBlock();
    assert.equal(d.flag('okay','descr',false,'k').hasError,true);
});

tsts('flag(_key) fails',()=>{
    const d=new Cli('eg','Example cli').flag('_key','descr',false,'k');
    assert.equal(d.hasError,true);
});

tsts('flag(key).flag(key) fails',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.flag('key','descr',false,'k').hasError,false);
    assert.equal(d.flag('key','descr',false,'k').hasError,true);
});

tsts('removeOpt(help)',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.value('help'),false);
    assert.equal(d.removeOpt('help').value('help'),undefined);
});

tsts('removeOpt(help) after final fails',()=>{
    const d=new Cli('eg','Example cli');
    d.helpBlock();
    assert.equal(d.removeOpt('help').hasError,true);
});

tsts('removeOpt(unknown) fails',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.removeOpt('unknown').hasError,true);
});

tsts('removeAlt(h)',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.value('h'),false);
    assert.equal(d.removeAlt('h').value('h'),undefined);
});

tsts('removeAlt(h) after final fails',()=>{
    const d=new Cli('eg','Example cli');
    d.helpBlock();
    assert.equal(d.removeAlt('h').hasError,true);
});

tsts('removeAlt(unknown) fails',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.removeAlt('unknown').hasError,true);
});

tsts('removeAlt(h)',()=>{
    const d=new Cli('eg','Example cli');
    d.optionValues();
});

tsts('parse(-h)',()=>{
    const d=new Cli('eg','Example cli').parse(0,['-h']);
    assert.equal(d.value('help'),true);
});

tsts('parse(-r) fails',()=>{
    const d=new Cli('eg','Example cli').parse(0,['-r']);
    assert.equal(d.hasError,true);
});

tsts('parse(--help) valid',()=>{
    const d=new Cli('eg','Example cli').parse(0,['--help']);
    assert.equal(d.value('help'),true);
});

tsts('parse unknown option fails',()=>{
    const d=new Cli('eg','Example cli').parse(0,['--please']);
    assert.equal(d.hasError,true);
});

tsts('parse unknown argument fails',()=>{
    const d=new Cli('eg','Example cli').parse(0,['unknown']);
    assert.equal(d.hasError,true);
});

tsts('parse known argument updates value',()=>{
    const d=new Cli('eg','Example cli').require('something','a value').parse(0,['one']);
    assert.equal(d.value('something'),'one');
});

tsts('parse without required arg fails',()=>{
    const d=new Cli('eg','Example cli')
        .require('something','a value')
        .parse(0,[]);
    
    assert.equal(d.hasError,true,'hasError');
})

tsts('error.ifComplete',()=>{
    let err=false;
    const d=new Cli('eg','Example cli')
        .onError({target:()=>err=true,exitStatus:-1})
        .parse(0,['unknown'])
        .ifComplete(()=>{});

    assert.equal(d.hasError,true,'hasError');
    assert.equal(err,true,'err');
});

tsts('help.ifComplete',()=>{
    let log=false;
    const d=new Cli('eg','Example cli',()=>log=true)
        .parse(0,['-c','-h'])
        .ifComplete(()=>{});

    assert.equal(d.hasError,false,'hasError');
    assert.equal(log,true,'logged');
});

tsts('version.ifComplete',()=>{
    let log=false;
    const d=new Cli('eg','Example cli',()=>log=true)
        .parse(0,['-c','-v'])
        .ifComplete(()=>{});

    assert.equal(d.hasError,false,'hasError');
    assert.equal(log,true,'logged');

    //With colour
    log=false;
    new Cli('eg','Example cli',()=>log=true)
        .parse(0,['-v'])
        .ifComplete(()=>{});
    assert.equal(log,true,'logged');
});

if (DEMO) {
    const d=new Cli('eg','Example cli')
        .require('DIR','A directory')
        .flag('derp','derp like')
        .flag('al','Alternative',false,'alt','a')
        .parse(0,['-h'])
        ;
    console.log(d.helpBlock());
    console.log(d.versionBlock());
}

tsts.run();