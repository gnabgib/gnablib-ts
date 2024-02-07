/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { BnfAlt, BnfChar, BnfConcat, BnfString, BnfRepeat } from '../abnf/bnf.js';
import { rules } from "../abnf/rules.js";
import { WindowStr,WindowOrString } from "./WindowStr.js";

//URI or URL? All URLs are URI

// URI https://www.rfc-editor.org/rfc/rfc3986#page-16
const subDelimiters= BnfAlt.Split("!$&'()*+,;=",undefined,'sub-delims');
const genDelimiters=BnfAlt.Split(":/?#[]@",undefined,'gen-delims');
/*Non standard*/const slash=new BnfChar('/');
/*Non standard*/const questionMark=new BnfChar('?');
/*Non standard*/const colon=new BnfChar(':');
/*Non standard*/const at=new BnfChar('@');
/*Non standard*/const hash=new BnfChar('#');
/*Non standard*/const dcolon=new BnfString("::");
/*Non standard*/const dslash=new BnfString("//");
/*Non standard*/const dash=new BnfChar('-');
const reserved=new BnfAlt(subDelimiters,genDelimiters);
reserved.name='reserved';
const unreserved=new BnfAlt(rules.ALPHA,rules.DIGIT,dash,rules.DOT,new BnfChar('_'),new BnfChar('~'));
unreserved.name='unreserved';
const pctEncoded=new BnfConcat(new BnfChar('%'),rules.HEXDIG,rules.HEXDIG);
pctEncoded.name='pct-encoded';
const pchar=new BnfAlt(unreserved,pctEncoded,subDelimiters,colon,at);
pchar.name='pchar';
pchar.suppressComponents=true;
const fragment=BnfRepeat.ZeroPlus(new BnfAlt(pchar,slash,questionMark),'fragment');
fragment.suppressComponents=true;
const query=BnfRepeat.ZeroPlus(new BnfAlt(pchar,slash,questionMark),'query');
query.suppressComponents=true;
const segment=BnfRepeat.ZeroPlus(pchar,'segment');
const segmentNz=BnfRepeat.OnePlus(pchar,'segment-nz');
const segmentNzNc=BnfRepeat.OnePlus(new BnfAlt(unreserved,pctEncoded,subDelimiters,at),'segment-nz-nc');
/*Non standard*/const pathSegment=new BnfConcat(slash,segment);
pathSegment.suppressComponents=true;
const pathRootless=new BnfConcat(segmentNz,BnfRepeat.ZeroPlus(pathSegment));
pathRootless.name='path-rootless';
const pathNoscheme=new BnfConcat(segmentNzNc,BnfRepeat.ZeroPlus(pathSegment));
pathNoscheme.name='path-noscheme';
const pathAbsolute=new BnfConcat(slash,BnfRepeat.Optional(new BnfConcat(segmentNz,BnfRepeat.ZeroPlus(pathSegment))));
pathAbsolute.name='path-absolute';
const pathAbempty=BnfRepeat.ZeroPlus(pathSegment,'path-abempty');
const path=new BnfAlt(
    pathAbempty,//begins with / or is empty
    pathAbsolute,//begins with / but not //
    pathNoscheme,//beings with a non-colon segment
    pathRootless,//begins with a segment
    rules.EMPTY//zero characters (this is a useful definition?)
    );
path.name='path';
const regName=BnfRepeat.ZeroPlus(new BnfAlt(unreserved,pctEncoded,subDelimiters),'reg-name');
regName.suppressComponents=true;
//const decOct=rules.DECIMAL_OCTET;
//const ipv4Address=rules.IPv4_ADDRESS;
const h16=BnfRepeat.Between(1,4,rules.HEXDIG,'h16');
const ls32=new BnfAlt(new BnfConcat(h16,colon,h16),rules.IPv4_ADDRESS);
ls32.name='ls32'
const h16_colon=new BnfConcat(h16,colon);
const ipv6Address=new BnfAlt(
    new BnfConcat(BnfRepeat.Exactly(6,h16_colon),ls32),
    new BnfConcat(dcolon,BnfRepeat.Exactly(5,h16_colon),ls32),
    new BnfConcat(BnfRepeat.Optional(h16),dcolon,BnfRepeat.Exactly(4,h16_colon),ls32),
    new BnfConcat(BnfRepeat.Optional(new BnfConcat(BnfRepeat.Between(0,1,h16_colon),h16)),dcolon,BnfRepeat.Exactly(3,h16_colon),ls32),
    new BnfConcat(BnfRepeat.Optional(new BnfConcat(BnfRepeat.Between(0,2,h16_colon),h16)),dcolon,BnfRepeat.Exactly(2,h16_colon),ls32),
    new BnfConcat(BnfRepeat.Optional(new BnfConcat(BnfRepeat.Between(0,3,h16_colon),h16)),dcolon,h16_colon,ls32),
    new BnfConcat(BnfRepeat.Optional(new BnfConcat(BnfRepeat.Between(0,4,h16_colon),h16)),dcolon,ls32),
    new BnfConcat(BnfRepeat.Optional(new BnfConcat(BnfRepeat.Between(0,5,h16_colon),h16)),dcolon,h16),
    new BnfConcat(BnfRepeat.Optional(new BnfConcat(BnfRepeat.Between(0,6,h16_colon),h16)),dcolon),
);
ipv6Address.name='IPv6address';
const ipvFuture=new BnfConcat(new BnfChar("v"),BnfRepeat.OnePlus(rules.HEXDIG),rules.DOT,
    BnfRepeat.OnePlus(new BnfAlt(unreserved,subDelimiters,colon)));
ipvFuture.name='IPvFuture';
const ipLiteral=new BnfConcat(new BnfChar("["),new BnfAlt(ipv6Address,ipvFuture),new BnfChar("]"));
ipLiteral.name='IP-literal';
const port=BnfRepeat.ZeroPlus(rules.DIGIT,'port');
const host=new BnfAlt(ipLiteral,rules.IPv4_ADDRESS,regName);
host.name='host';
const userInfo=BnfRepeat.ZeroPlus(new BnfAlt(unreserved,pctEncoded,subDelimiters,colon));
userInfo.name='userinfo';
const authority=new BnfConcat(
    BnfRepeat.Optional(new BnfConcat(userInfo,at)),
    host,
    BnfRepeat.Optional(new BnfConcat(colon,port)));
authority.name='authority';
const scheme=new BnfConcat(
    rules.ALPHA,
    BnfRepeat.ZeroPlus(new BnfAlt(rules.ALPHA,rules.DIGIT,new BnfChar('+'),dash,rules.DOT)))
scheme.name='scheme';
scheme.suppressComponents=true;
const relativePart=new BnfAlt(
    new BnfConcat(dslash,authority,pathAbempty),
    pathAbsolute,
    pathNoscheme,
    rules.EMPTY
);
relativePart.name='relative-part';
const relativeRef=new BnfConcat(
    relativePart,
    BnfRepeat.Optional(new BnfConcat(questionMark,query)),
    BnfRepeat.Optional(new BnfConcat(hash,fragment))
);
relativeRef.name='relative-ref';
const heirPart=new BnfAlt(
    new BnfConcat(dslash,authority,pathAbempty),
    pathAbsolute,
    pathRootless,
    rules.EMPTY
);
heirPart.name='heir-part';
const absoluteUri=new BnfConcat(scheme,colon,heirPart,BnfRepeat.Optional(new BnfConcat(questionMark,query)));
absoluteUri.name='absolute-URI';
// export const uri=new BnfConcat(
//     scheme,colon,
//     heirPart,
//     BnfRepeat.Optional(new BnfConcat(questionMark,query)),
//     BnfRepeat.Optional(new BnfConcat(hash,fragment))
// );
// uri.name='URI';
// const uriReference=new Alt(uri,relativeRef);
// uriReference.name='URI-reference';

// URN
const qComponent=new BnfConcat(pchar,BnfRepeat.ZeroPlus(new BnfAlt(pchar,slash,questionMark)));
qComponent.name='q-component';
qComponent.suppressComponents=true;
const rComponent=new BnfConcat(pchar,BnfRepeat.ZeroPlus(new BnfAlt(pchar,slash,questionMark)));
rComponent.name='r-component';
rComponent.suppressComponents=true;
const rqComponents=new BnfConcat(
    BnfRepeat.Optional(new BnfConcat(new BnfString("?+"),rComponent)),
    BnfRepeat.Optional(new BnfConcat(new BnfString("?="),qComponent))
);
rqComponents.name='rq-components';
const nss=new BnfConcat(pchar,BnfRepeat.ZeroPlus(new BnfAlt(pchar,slash)));
nss.name='NSS';
nss.suppressComponents=true;
const ldh=new BnfAlt(rules.ALPHANUM,dash);
const nid=new BnfConcat(rules.ALPHANUM,BnfRepeat.Between(0,30,ldh),rules.ALPHANUM);
nid.name='NID';
const assignedName=new BnfConcat(new BnfString("urn"),colon,nid,colon,nss);
assignedName.name='assigned-name';
const namestring=new BnfConcat(
    assignedName,
    BnfRepeat.Optional(rqComponents),
    BnfRepeat.Optional(new BnfConcat(hash,fragment)));

// export class Uri {
// }

//https://www.rfc-editor.org/rfc/rfc8141.html
// alpha a-zA-Z
// digit 0-9
// hex 0-9A-F

//console.log(namestring.descr());
//console.log(nid.descr());

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

    static parse(s:WindowOrString):Urn|undefined {
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