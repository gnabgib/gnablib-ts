import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Urn } from '../../src/primitive/Uri.js';
import { WindowStr } from '../../src/primitive/WindowStr.js';

//abnf /rfc5234
const tsts = suite('URI /rfc3986');

// tsts('Other',()=>{
//     //const w=new WindowStr('http://www.gnabgib.com/tools/ip-to-cidr/');
//     const w=new WindowStr('http://192.168.1.50/welcome/friends?a=b#fr');
//     //console.log(uri.atStartOf(w));
// });

const testParseUrn:{
    s:string,
    nid:string|undefined,
    nss:string,
    q?:string,
    r?:string,
    f?:string
}[]=[
    {s:'urn:isbn:0451450523',nid:'isbn',nss:'0451450523'}
];
for (const {s,nid,nss,q,r,f} of testParseUrn) {
    // tsts(`Urn.parse(${s}):`,()=>{
    //     const w=new WindowStr(s);
    //     const u=Urn.parse(w);
    //     if (nid===undefined) {
    //         assert.is(u===undefined,true);
    //     } else {
    //         assert.is(u.nid,nid);
    //         assert.is(u.nss,nss);
    //         assert.is(u.q,q);
    //         assert.is(u.rComponent,r);
    //         assert.is(u.qComponent,q);
    //         assert.is(u.fragment,f);
    //     }

    // });
}

tsts.run();
