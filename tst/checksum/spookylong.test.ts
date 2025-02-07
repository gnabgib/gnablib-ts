import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { SpookyLong } from '../../src/checksum/Spooky';
import { U64 } from '../../src/primitive/number/U64';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('SpookyLong');

const sum_abcd = '29AC1AFD21C3900E1CE227B007087B2C';
const sum_abcdefgh = '3EE45585286282A97377595670B86E6D';
const fox =
	'The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog';
const large =
	'QYEpkVhTupA4pnu9qBHeFdErYgjNVE5ybx5YvBmd8BrV8qjk9a5YACRewSTFgm3V5K7UzKNjy9drrcWVyLfA7CdqYynCQTNWpDywRD7HWQUgvG4gPdAP86JepHtD5cBcCLmcJFxFtq4zQ7SxpzeMSYerGnVVUgrMSgd29fyiMzvUgXZbhywKcDSdX5ypNgwHQmeWR3zZ' +
	'9xAQ9GLN5PYWUKpRQL5dzRcgEk4KBLKHaW4fjNn3PaH2r3j8gCWzq4GUKWjHZnE34LiLtJv7vVJjygP2E5E757Mw5cHaNiURVz2ymTXqLiCcG75e7X99gmtjpZFMPkiGBFpqvMQ4LrVnF9ViBGq5p3pxkqFaYPd5RBNi3qVDeQN6fTzDY7AtbRNdKJchSEM6yki8iiRN' +
	'4uz6aQXxkahJWGRizvNn84EnFj28qrBUhKrKV6XKzM4bVPdDxWkWhLKgfTtfJ9NCfda7WqN4LVXnM37hRjJbQk3FbQy67zmRPg4J9XLCX8PASyr38q2aXkk62ZMyE6wmSbExcZDb9MXFwT223NXvaxk5dJnkTirUAyrBZLSdkvCx83xjDPLPwvYYANKgz26NjkWFSpMh' +
	'kPMdmYGtp2WHchFGhBYi5GScttnt6ywxKpukHZiqpPMMAvrnGwbFWLnkjgcmTi2zJE5XReJFRWjLapCaLEUeMTBvFGLKcVyBSPpuewtM8N9LrZ6WanhBEth9qgawxqvzBRXcKyWLTa6KQZX3bGRBwuqCd2jtePZGuKBVunbRGNKbZEnfxDiMycJvEy3VBLD4edxv8Ba3' +
	'kDPnL6qFMLtqMeEevQeDXrZr9wBk4yKGUmBQftdLZGdfurQ9z6aKGmyviMpKeDHuvYuYPnLVJWMTLFfxGLTegnm2AKpVPSTte9YHpnYAbRZkJHctj7RBvQpvRmiSSL2P78Ub2mTr3RCyqQ4HNaUrrrHtxp2zZJdyeTGMESmgQbiefHjCb3yEfbtVabbmHQGiqMNmfCuw' +
	'5JgTuyGEErk5K2L6rkK9mUZGHGcV3Dqc7YzWQD8whE682mQfuptGSkPxp5zccf95NBbYvyDnRWAyFxR9UAVJJmjPgdUSBBSjyX7XY9h2bDTCTgkaHagHGzphFtHwTkzxAF7qczQ7bduDUqzHa8iaaT3wJTkLCSV2Yp76P2275Zk3YVe8UuzEQTkAYSVYbruJS6TSHwmK' +
	'9mNfcp4V6UWpAQyrYACZLAwchnkeDk9GjqMy8JS3KMMSLfLG5UUaCQ9bRETeMcWwCn8JDchHPZcMLrcwGXcawFTxHrqpumrjfFeReDBBHDKm9ktR8Aq96xvg7ANPpYx7tdKqkxuJBZemu5pVvKNagKmfKx2LN4BL8gAFB7nu5DjLHCW9p74GW2xX79u75GdCyLHQBwPP' +
	'xrJeQYDYtEYz7mPLQnJVJGMBnf7yNQXCJ2HCvAJMaWUdfRic7kAtGdkHqu9WLgLi3LabcjLfcnCLFpfZLRpQKWaSKHrCJiN2tX599GzqVafTTgQhZbbwQ3dk4iCC4HLt5GagWgJjk2Tx2khk8SWPmBXxtaVFy9P8yufiUQeLMwdDYqGzwF8UmFPxfqc8ebEA3fdSe9Tu' +
	'6xtcYTpVAtq9A34aePGzDPq5Ryax9d75GcwNrheKheZjxQYB939PwaSwZbbE2QBYUL4WYX2pLypjLy2vgvKbbFaNypCydAqjJqVRSVVTXbGTrGpcPX9AYjnGaMaF73Kg3MiSfQKfYzS5np4mjPJyX7G72GBfV6yiJZhyWH2eeTaMxcR35xDK4prSKi5Dwg6rYY9uEMRT' +
	'KMqwp9BSiqZXm6vWdqgfr7L36JNwA37ygPKtwTwSGqRVijy4eAkcagTqRMrU3Rr5Z3MPKDhJ2D6uAWt3QnUEpYWkxtycu3JVbDvmdtLUBubSDk2N3JDZ9BqNVC9UeX5pkZg465g5VntLj7H8TgvBkBU3Nu5AD9hzxf68bLfKKLiDPrhM9rVxyrbqCpdPG6ffDyrMGeWH';

const string_tests: [string, string][] = [
	['', 'EAD03033DCF83712B919A80440B73F4E'],
	['a', '92437B426D09C41A128B195B47F0B584'],
	['ab', 'D189BE5118559E8B8F7EFC969EA558C9'],
	['abc', '4DF32BDF1B119EE746DFABD1F8D909CF'],
	['abcd', sum_abcd],
	['abcdefgh', sum_abcdefgh],
	['message digest', 'F10C215CB70B03707A91096347D3D44C'],
	['hello', '47DFB25D7EC8A088D8E71435C90FEA56'],
	['hello, world', '11F6B2EC1517946C4D658CC686AA28EC'],
	//200 chars > 192, should use long
	[large, '242105FF3E9B7EC465CD7515C36B776B'],
	//wikipedia: 219 bytes
	[fox, 'F1B71C6AC5AF39E7B69363A60DD29C49'],
];
for (const [src, expect] of string_tests) {
	tsts(`SpookyLong(${src})`, () => {
		const hash = new SpookyLong();
		hash.write(utf8.toBytes(src));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const altSeed: [U64, U64] = [U64.fromInt(1), U64.zero];
const alt_seed_tests: [Uint8Array, string][] = [
	[new Uint8Array(0), '56CB02C75F911EE2FC2FE69AF0D0092E'],
	[Uint8Array.of(1, 2, 3), '009933E165F0584756F1C2CB746B6919'],
];
for (const [data, expect] of alt_seed_tests) {
	tsts(`SpookyLong([${data.length}],altSeed)`, () => {
		const hash = new SpookyLong(...altSeed);
		hash.write(data);
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new SpookyLong();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(hex.fromBytes(s.sum()), '5873CBD39D508B83F3F9B0532C891DE1');
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new SpookyLong();
	s.write(ascii_abcd);
	assert.is(hex.fromBytes(s.sum()), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(hex.fromBytes(s.sum()), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
