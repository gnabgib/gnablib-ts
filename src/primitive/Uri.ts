/*! Copyright 2023 gnabgib MPL-2.0 */

import * as bnf from "../abnf/bnf.js";
//import { bnf } from "../abnf/bnf.js";
import { rules } from "../abnf/rules.js";
import { WindowStr,WindowStrish } from "./WindowStr.js";

//URI or URL? All URLs are URI

// URI https://www.rfc-editor.org/rfc/rfc3986#page-16
const subDelimiters= bnf.BnfAlt.Split("!$&'()*+,;=",undefined,'sub-delims');
const genDelimiters=bnf.BnfAlt.Split(":/?#[]@",undefined,'gen-delims');
/*Non standard*/const slash=new bnf.BnfChar('/');
/*Non standard*/const questionMark=new bnf.BnfChar('?');
/*Non standard*/const colon=new bnf.BnfChar(':');
/*Non standard*/const at=new bnf.BnfChar('@');
/*Non standard*/const hash=new bnf.BnfChar('#');
/*Non standard*/const dcolon=new bnf.BnfString("::");
/*Non standard*/const dslash=new bnf.BnfString("//");
/*Non standard*/const dash=new bnf.BnfChar('-');
const reserved=new bnf.BnfAlt(subDelimiters,genDelimiters);
reserved.name='reserved';
const unreserved=new bnf.BnfAlt(rules.ALPHA,rules.DIGIT,dash,rules.DOT,new bnf.BnfChar('_'),new bnf.BnfChar('~'));
unreserved.name='unreserved';
const pctEncoded=new bnf.BnfConcat(new bnf.BnfChar('%'),rules.HEXDIG,rules.HEXDIG);
pctEncoded.name='pct-encoded';
const pchar=new bnf.BnfAlt(unreserved,pctEncoded,subDelimiters,colon,at);
pchar.name='pchar';
pchar.suppressComponents=true;
const fragment=bnf.BnfRepeat.ZeroPlus(new bnf.BnfAlt(pchar,slash,questionMark),'fragment');
fragment.suppressComponents=true;
const query=bnf.BnfRepeat.ZeroPlus(new bnf.BnfAlt(pchar,slash,questionMark),'query');
query.suppressComponents=true;
const segment=bnf.BnfRepeat.ZeroPlus(pchar,'segment');
const segmentNz=bnf.BnfRepeat.OnePlus(pchar,'segment-nz');
const segmentNzNc=bnf.BnfRepeat.OnePlus(new bnf.BnfAlt(unreserved,pctEncoded,subDelimiters,at),'segment-nz-nc');
/*Non standard*/const pathSegment=new bnf.BnfConcat(slash,segment);
pathSegment.suppressComponents=true;
const pathRootless=new bnf.BnfConcat(segmentNz,bnf.BnfRepeat.ZeroPlus(pathSegment));
pathRootless.name='path-rootless';
const pathNoscheme=new bnf.BnfConcat(segmentNzNc,bnf.BnfRepeat.ZeroPlus(pathSegment));
pathNoscheme.name='path-noscheme';
const pathAbsolute=new bnf.BnfConcat(slash,bnf.BnfRepeat.Optional(new bnf.BnfConcat(segmentNz,bnf.BnfRepeat.ZeroPlus(pathSegment))));
pathAbsolute.name='path-absolute';
const pathAbempty=bnf.BnfRepeat.ZeroPlus(pathSegment,'path-abempty');
const path=new bnf.BnfAlt(
    pathAbempty,//begins with / or is empty
    pathAbsolute,//begins with / but not //
    pathNoscheme,//beings with a non-colon segment
    pathRootless,//begins with a segment
    rules.EMPTY//zero characters (this is a useful definition?)
    );
path.name='path';
const regName=bnf.BnfRepeat.ZeroPlus(new bnf.BnfAlt(unreserved,pctEncoded,subDelimiters),'reg-name');
regName.suppressComponents=true;
//const decOct=rules.DECIMAL_OCTET;
//const ipv4Address=rules.IPv4_ADDRESS;
const h16=bnf.BnfRepeat.Between(1,4,rules.HEXDIG,'h16');
const ls32=new bnf.BnfAlt(new bnf.BnfConcat(h16,colon,h16),rules.IPv4_ADDRESS);
ls32.name='ls32'
const h16_colon=new bnf.BnfConcat(h16,colon);
const ipv6Address=new bnf.BnfAlt(
    new bnf.BnfConcat(bnf.BnfRepeat.Exactly(6,h16_colon),ls32),
    new bnf.BnfConcat(dcolon,bnf.BnfRepeat.Exactly(5,h16_colon),ls32),
    new bnf.BnfConcat(bnf.BnfRepeat.Optional(h16),dcolon,bnf.BnfRepeat.Exactly(4,h16_colon),ls32),
    new bnf.BnfConcat(bnf.BnfRepeat.Optional(new bnf.BnfConcat(bnf.BnfRepeat.Between(0,1,h16_colon),h16)),dcolon,bnf.BnfRepeat.Exactly(3,h16_colon),ls32),
    new bnf.BnfConcat(bnf.BnfRepeat.Optional(new bnf.BnfConcat(bnf.BnfRepeat.Between(0,2,h16_colon),h16)),dcolon,bnf.BnfRepeat.Exactly(2,h16_colon),ls32),
    new bnf.BnfConcat(bnf.BnfRepeat.Optional(new bnf.BnfConcat(bnf.BnfRepeat.Between(0,3,h16_colon),h16)),dcolon,h16_colon,ls32),
    new bnf.BnfConcat(bnf.BnfRepeat.Optional(new bnf.BnfConcat(bnf.BnfRepeat.Between(0,4,h16_colon),h16)),dcolon,ls32),
    new bnf.BnfConcat(bnf.BnfRepeat.Optional(new bnf.BnfConcat(bnf.BnfRepeat.Between(0,5,h16_colon),h16)),dcolon,h16),
    new bnf.BnfConcat(bnf.BnfRepeat.Optional(new bnf.BnfConcat(bnf.BnfRepeat.Between(0,6,h16_colon),h16)),dcolon),
);
ipv6Address.name='IPv6address';
const ipvFuture=new bnf.BnfConcat(new bnf.BnfChar("v"),bnf.BnfRepeat.OnePlus(rules.HEXDIG),rules.DOT,
    bnf.BnfRepeat.OnePlus(new bnf.BnfAlt(unreserved,subDelimiters,colon)));
ipvFuture.name='IPvFuture';
const ipLiteral=new bnf.BnfConcat(new bnf.BnfChar("["),new bnf.BnfAlt(ipv6Address,ipvFuture),new bnf.BnfChar("]"));
ipLiteral.name='IP-literal';
const port=bnf.BnfRepeat.ZeroPlus(rules.DIGIT,'port');
const host=new bnf.BnfAlt(ipLiteral,rules.IPv4_ADDRESS,regName);
host.name='host';
const userInfo=bnf.BnfRepeat.ZeroPlus(new bnf.BnfAlt(unreserved,pctEncoded,subDelimiters,colon));
userInfo.name='userinfo';
const authority=new bnf.BnfConcat(
    bnf.BnfRepeat.Optional(new bnf.BnfConcat(userInfo,at)),
    host,
    bnf.BnfRepeat.Optional(new bnf.BnfConcat(colon,port)));
authority.name='authority';
const scheme=new bnf.BnfConcat(
    rules.ALPHA,
    bnf.BnfRepeat.ZeroPlus(new bnf.BnfAlt(rules.ALPHA,rules.DIGIT,new bnf.BnfChar('+'),dash,rules.DOT)))
scheme.name='scheme';
scheme.suppressComponents=true;
const relativePart=new bnf.BnfAlt(
    new bnf.BnfConcat(dslash,authority,pathAbempty),
    pathAbsolute,
    pathNoscheme,
    rules.EMPTY
);
relativePart.name='relative-part';
const relativeRef=new bnf.BnfConcat(
    relativePart,
    bnf.BnfRepeat.Optional(new bnf.BnfConcat(questionMark,query)),
    bnf.BnfRepeat.Optional(new bnf.BnfConcat(hash,fragment))
);
relativeRef.name='relative-ref';
const heirPart=new bnf.BnfAlt(
    new bnf.BnfConcat(dslash,authority,pathAbempty),
    pathAbsolute,
    pathRootless,
    rules.EMPTY
);
heirPart.name='heir-part';
const absoluteUri=new bnf.BnfConcat(scheme,colon,heirPart,bnf.BnfRepeat.Optional(new bnf.BnfConcat(questionMark,query)));
absoluteUri.name='absolute-URI';
// export const uri=new bnf.Concat(
//     scheme,colon,
//     heirPart,
//     bnf.Repeat.Optional(new bnf.Concat(questionMark,query)),
//     bnf.Repeat.Optional(new bnf.Concat(hash,fragment))
// );
// uri.name='URI';
// const uriReference=new bnf.Alt(uri,relativeRef);
// uriReference.name='URI-reference';

// URN
const qComponent=new bnf.BnfConcat(pchar,bnf.BnfRepeat.ZeroPlus(new bnf.BnfAlt(pchar,slash,questionMark)));
qComponent.name='q-component';
qComponent.suppressComponents=true;
const rComponent=new bnf.BnfConcat(pchar,bnf.BnfRepeat.ZeroPlus(new bnf.BnfAlt(pchar,slash,questionMark)));
rComponent.name='r-component';
rComponent.suppressComponents=true;
const rqComponents=new bnf.BnfConcat(
    bnf.BnfRepeat.Optional(new bnf.BnfConcat(new bnf.BnfString("?+"),rComponent)),
    bnf.BnfRepeat.Optional(new bnf.BnfConcat(new bnf.BnfString("?="),qComponent))
);
rqComponents.name='rq-components';
const nss=new bnf.BnfConcat(pchar,bnf.BnfRepeat.ZeroPlus(new bnf.BnfAlt(pchar,slash)));
nss.name='NSS';
nss.suppressComponents=true;
const ldh=new bnf.BnfAlt(rules.ALPHANUM,dash);
const nid=new bnf.BnfConcat(rules.ALPHANUM,bnf.BnfRepeat.Between(0,30,ldh),rules.ALPHANUM);
nid.name='NID';
const assignedName=new bnf.BnfConcat(new bnf.BnfString("urn"),colon,nid,colon,nss);
assignedName.name='assigned-name';
const namestring=new bnf.BnfConcat(
    assignedName,
    bnf.BnfRepeat.Optional(rqComponents),
    bnf.BnfRepeat.Optional(new bnf.BnfConcat(hash,fragment)));

// export class Uri {
// }

//https://www.rfc-editor.org/rfc/rfc8141.html
// alpha a-zA-Z
// digit 0-9
// hex 0-9A-F

//console.log(namestring.descr());
console.log(nid.descr());

export class Urn {
    readonly nid:string;
    readonly nss:string;
    readonly rComponent:string|undefined;
    readonly qComponent:string|undefined;
    readonly fragment:string|undefined;

    constructor(nid:string,nss:string,rComponent?:string,qComponent?:string,fragment?:string) {
        this.nid=nid;
        this.nss=nss;
        this.rComponent=rComponent;
        this.qComponent=qComponent;
        this.fragment=fragment;
    }

    get formal():boolean {
        return this.nid.startsWith('uri-');
    }

    static parse(s:WindowStrish):Urn|undefined {
        s=WindowStr.coerce(s);
        const match=namestring.atStartOf(s);
        console.log(match);
        return undefined;
    }

    private static validNid(input:string):boolean {
        //These must be registered with IANA
        const re=/[a-z0-9][a-z0-9-]*[a-z0-9]/g;
        return input.match(re)!==null;
    }
}