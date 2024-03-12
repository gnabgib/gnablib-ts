import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Cli} from '../../src/cli/index.ts';

const tsts = suite('Describe');

tsts('version',()=>{
    const d=new Cli('eg','Example cli');
    d.setOption('color',false);
    assert.equal(d.version(),'Version: 0\n');
    d.ver('eleventy');
    assert.equal(d.version(),'Version: eleventy\n');
    //console.log(d.version());
    //.v(process.env.npm_package_version);
});

tsts('set version twice fails',()=>{
    const d=new Cli('eg','Example cli');
    d.ver('2');
    assert.equal(d.ver('3').hasError,true);
});

tsts('set version after finalize fails',()=>{
    const d=new Cli('eg','Example cli');
    d.help();
    assert.equal(d.ver('3').hasError,true);
});

tsts('require(key)',()=>{
    const d=new Cli('eg','Example cli').require('key','descr','herp');
    assert.equal(d.value('key'),'herp');
});

tsts('require(key) after final fails',()=>{
    const d=new Cli('eg','Example cli');
    assert.equal(d.require('key','descr','herp').hasError,false);
    d.help();
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
    d.help();
    assert.equal(d.flag('okey','descr',false,'k').hasError,true);
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
    d.help();
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
    d.help();
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

tsts('parse(--help)',()=>{
    const d=new Cli('eg','Example cli').parse(0,['--help']);
    assert.equal(d.value('help'),true);
});

tsts('parse(--please) fails',()=>{
    const d=new Cli('eg','Example cli').parse(0,['--please']);
    assert.equal(d.hasError,true);
});

tsts('parse(unknown) fails',()=>{
    const d=new Cli('eg','Example cli').parse(0,['unknown']);
    assert.equal(d.hasError,true);
});

tsts('parse(one)',()=>{
    const d=new Cli('eg','Example cli').require('something','a value').parse(0,['one']);
    assert.equal(d.value('something'),'one');
});

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




// tsts('general',()=>{
//     const d=new Cli('bench','Run each file in DIR as a benchmark')
//         .v(process.env.npm_package_version)
//         .require('DIR','Directory to scan for benchmarks')
//         .flag('recursive','Recursively look for files',false,'r')
//         //.removeAlias('c')
//         //.removeOpt('color','help')
//         .parse()
//         ;

//     console.log(d.help());
//     console.log(d.version());
// });

tsts.run();