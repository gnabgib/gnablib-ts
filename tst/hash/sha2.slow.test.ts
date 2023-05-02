import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import {
	Sha224,
	Sha256,
    Sha384,
	Sha512,
} from '../../src/hash/Sha2';

const tsts = suite('SHA2/RFC 6234 | FIPS 180-4 - SLOW');

const a64_bytes=utf8.toBytes('a'.repeat(64));

tsts('Sha224: a.repeat(1000000)',()=>{
	//test 3 (slow)
	const hash=new Sha224();
	//15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);
	
	const md=hash.sum();
	assert.is(hex.fromBytes(md), '20794655980C91D8BBB4C1EA97618A4BF03F42581948B2EE4EE7AD67');
});

tsts('Sha256: a.repeat(1000000)',()=>{
	//test 3 (slow)
	const hash=new Sha256();
	//15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);
	
	const md=hash.sum();
	assert.is(hex.fromBytes(md), 'CDC76E5C9914FB9281A1C7E284D73E67F1809A48A497200E046D39CCC7112CD0');
});

tsts('Sha384: a.repeat(1000000)',()=>{
	//test 3 (slow)
	const hash=new Sha384();
	//15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);
	
	const md=hash.sum();
	assert.is(hex.fromBytes(md), '9D0E1809716474CB086E834E310A4A1CED149E9C00F248527972CEC5704C2A5B07B8B3DC38ECC4EBAE97DDD87F3D8985');
});

tsts('Sha512: a.repeat(1000000)',()=>{
	//test 3 (slow)
	const hash=new Sha512();
	//15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);
	
	const md=hash.sum();
	assert.is(hex.fromBytes(md), 'E718483D0CE769644E2E42C7BC15B4638E1F98B13B2044285632A803AFA973EBDE0FF244877EA60A4CB0432CE577C31BEB009C5C2C49AA2E4EADB217AD8CC09B');
});

tsts.run();
