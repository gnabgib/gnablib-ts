/*! Copyright 2023 gnabgib MPL-2.0 */

import { bnf } from "../abnf/bnf.js";
import { rules } from "../abnf/rules.js";
import { WindowStr,WindowStrish } from "./WindowStr.js";

//URI or URL? All URLs are URI

// URI https://www.rfc-editor.org/rfc/rfc3986#page-16
const subDelimiters= bnf.Alt.Split("!$&'()*+,;=",undefined,'sub-delims');
const genDelimiters=bnf.Alt.Split(":/?#[]@",undefined,'gen-delims');
/*Non standard*/const slash=new bnf.Char('/');
/*Non standard*/const questionMark=new bnf.Char('?');
/*Non standard*/const colon=new bnf.Char(':');
/*Non standard*/const at=new bnf.Char('@');
/*Non standard*/const hash=new bnf.Char('#');
/*Non standard*/const dcolon=new bnf.String("::");
/*Non standard*/const dslash=new bnf.String("//");
/*Non standard*/const dash=new bnf.Char('-');
const reserved=new bnf.Alt(subDelimiters,genDelimiters);
reserved.name='reserved';
const unreserved=new bnf.Alt(rules.ALPHA,rules.DIGIT,dash,rules.DOT,new bnf.Char('_'),new bnf.Char('~'));
unreserved.name='unreserved';
const pctEncoded=new bnf.Concat(new bnf.Char('%'),rules.HEXDIG,rules.HEXDIG);
pctEncoded.name='pct-encoded';
const pchar=new bnf.Alt(unreserved,pctEncoded,subDelimiters,colon,at);
pchar.name='pchar';
pchar.suppressComponents=true;
const fragment=bnf.Repeat.ZeroPlus(new bnf.Alt(pchar,slash,questionMark),'fragment');
fragment.suppressComponents=true;
const query=bnf.Repeat.ZeroPlus(new bnf.Alt(pchar,slash,questionMark),'query');
query.suppressComponents=true;
const segment=bnf.Repeat.ZeroPlus(pchar,'segment');
const segmentNz=bnf.Repeat.OnePlus(pchar,'segment-nz');
const segmentNzNc=bnf.Repeat.OnePlus(new bnf.Alt(unreserved,pctEncoded,subDelimiters,at),'segment-nz-nc');
/*Non standard*/const pathSegment=new bnf.Concat(slash,segment);
pathSegment.suppressComponents=true;
const pathRootless=new bnf.Concat(segmentNz,bnf.Repeat.ZeroPlus(pathSegment));
pathRootless.name='path-rootless';
const pathNoscheme=new bnf.Concat(segmentNzNc,bnf.Repeat.ZeroPlus(pathSegment));
pathNoscheme.name='path-noscheme';
const pathAbsolute=new bnf.Concat(slash,bnf.Repeat.Optional(new bnf.Concat(segmentNz,bnf.Repeat.ZeroPlus(pathSegment))));
pathAbsolute.name='path-absolute';
const pathAbempty=bnf.Repeat.ZeroPlus(pathSegment,'path-abempty');
const path=new bnf.Alt(
    pathAbempty,//begins with / or is empty
    pathAbsolute,//begins with / but not //
    pathNoscheme,//beings with a non-colon segment
    pathRootless,//begins with a segment
    rules.EMPTY//zero characters (this is a useful definition?)
    );
path.name='path';
const regName=bnf.Repeat.ZeroPlus(new bnf.Alt(unreserved,pctEncoded,subDelimiters),'reg-name');
regName.suppressComponents=true;
//const decOct=rules.DECIMAL_OCTET;
//const ipv4Address=rules.IPv4_ADDRESS;
const h16=bnf.Repeat.Between(1,4,rules.HEXDIG,'h16');
const ls32=new bnf.Alt(new bnf.Concat(h16,colon,h16),rules.IPv4_ADDRESS);
ls32.name='ls32'
const h16_colon=new bnf.Concat(h16,colon);
const ipv6Address=new bnf.Alt(
    new bnf.Concat(bnf.Repeat.Exactly(6,h16_colon),ls32),
    new bnf.Concat(dcolon,bnf.Repeat.Exactly(5,h16_colon),ls32),
    new bnf.Concat(bnf.Repeat.Optional(h16),dcolon,bnf.Repeat.Exactly(4,h16_colon),ls32),
    new bnf.Concat(bnf.Repeat.Optional(new bnf.Concat(bnf.Repeat.Between(0,1,h16_colon),h16)),dcolon,bnf.Repeat.Exactly(3,h16_colon),ls32),
    new bnf.Concat(bnf.Repeat.Optional(new bnf.Concat(bnf.Repeat.Between(0,2,h16_colon),h16)),dcolon,bnf.Repeat.Exactly(2,h16_colon),ls32),
    new bnf.Concat(bnf.Repeat.Optional(new bnf.Concat(bnf.Repeat.Between(0,3,h16_colon),h16)),dcolon,h16_colon,ls32),
    new bnf.Concat(bnf.Repeat.Optional(new bnf.Concat(bnf.Repeat.Between(0,4,h16_colon),h16)),dcolon,ls32),
    new bnf.Concat(bnf.Repeat.Optional(new bnf.Concat(bnf.Repeat.Between(0,5,h16_colon),h16)),dcolon,h16),
    new bnf.Concat(bnf.Repeat.Optional(new bnf.Concat(bnf.Repeat.Between(0,6,h16_colon),h16)),dcolon),
);
ipv6Address.name='IPv6address';
const ipvFuture=new bnf.Concat(new bnf.Char("v"),bnf.Repeat.OnePlus(rules.HEXDIG),rules.DOT,
    bnf.Repeat.OnePlus(new bnf.Alt(unreserved,subDelimiters,colon)));
ipvFuture.name='IPvFuture';
const ipLiteral=new bnf.Concat(new bnf.Char("["),new bnf.Alt(ipv6Address,ipvFuture),new bnf.Char("]"));
ipLiteral.name='IP-literal';
const port=bnf.Repeat.ZeroPlus(rules.DIGIT,'port');
const host=new bnf.Alt(ipLiteral,rules.IPv4_ADDRESS,regName);
host.name='host';
const userInfo=bnf.Repeat.ZeroPlus(new bnf.Alt(unreserved,pctEncoded,subDelimiters,colon));
userInfo.name='userinfo';
const authority=new bnf.Concat(
    bnf.Repeat.Optional(new bnf.Concat(userInfo,at)),
    host,
    bnf.Repeat.Optional(new bnf.Concat(colon,port)));
authority.name='authority';
const scheme=new bnf.Concat(
    rules.ALPHA,
    bnf.Repeat.ZeroPlus(new bnf.Alt(rules.ALPHA,rules.DIGIT,new bnf.Char('+'),dash,rules.DOT)))
scheme.name='scheme';
scheme.suppressComponents=true;
const relativePart=new bnf.Alt(
    new bnf.Concat(dslash,authority,pathAbempty),
    pathAbsolute,
    pathNoscheme,
    rules.EMPTY
);
relativePart.name='relative-part';
const relativeRef=new bnf.Concat(
    relativePart,
    bnf.Repeat.Optional(new bnf.Concat(questionMark,query)),
    bnf.Repeat.Optional(new bnf.Concat(hash,fragment))
);
relativeRef.name='relative-ref';
const heirPart=new bnf.Alt(
    new bnf.Concat(dslash,authority,pathAbempty),
    pathAbsolute,
    pathRootless,
    rules.EMPTY
);
heirPart.name='heir-part';
const absoluteUri=new bnf.Concat(scheme,colon,heirPart,bnf.Repeat.Optional(new bnf.Concat(questionMark,query)));
absoluteUri.name='absolute-URI';
export const uri=new bnf.Concat(
    scheme,colon,
    heirPart,
    bnf.Repeat.Optional(new bnf.Concat(questionMark,query)),
    bnf.Repeat.Optional(new bnf.Concat(hash,fragment))
);
uri.name='URI';
const uriReference=new bnf.Alt(uri,relativeRef);
uriReference.name='URI-reference';

// URN
const qComponent=new bnf.Concat(pchar,bnf.Repeat.ZeroPlus(new bnf.Alt(pchar,slash,questionMark)));
qComponent.name='q-component';
qComponent.suppressComponents=true;
const rComponent=new bnf.Concat(pchar,bnf.Repeat.ZeroPlus(new bnf.Alt(pchar,slash,questionMark)));
rComponent.name='r-component';
rComponent.suppressComponents=true;
const rqComponents=new bnf.Concat(
    bnf.Repeat.Optional(new bnf.Concat(new bnf.String("?+"),rComponent)),
    bnf.Repeat.Optional(new bnf.Concat(new bnf.String("?="),qComponent))
);
rqComponents.name='rq-components';
const nss=new bnf.Concat(pchar,bnf.Repeat.ZeroPlus(new bnf.Alt(pchar,slash)));
nss.name='NSS';
nss.suppressComponents=true;
const ldh=new bnf.Alt(rules.ALPHANUM,dash);
const nid=new bnf.Concat(rules.ALPHANUM,bnf.Repeat.Between(0,30,ldh),rules.ALPHANUM);
nid.name='NID';
const assignedName=new bnf.Concat(new bnf.String("urn"),colon,nid,colon,nss);
assignedName.name='assigned-name';
const namestring=new bnf.Concat(
    assignedName,
    bnf.Repeat.Optional(rqComponents),
    bnf.Repeat.Optional(new bnf.Concat(hash,fragment)));

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
        s=WindowStr.Coerce(s);
        const match=namestring.atStartOf(s);
        console.log(match);
    }

    private static validNid(input:string):boolean {
        //These must be registered with IANA
        const re=/[a-z0-9][a-z0-9-]*[a-z0-9]/g;
        return input.match(re)!==null;
    }
}