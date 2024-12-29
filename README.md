# gnablib

A lean, zero dependency library to provide a useful base for your project.  Checksums, cryptography, codecs, date-times,
error-checking-codes, logging, pseudorandom number generation.  The tools you need for any project.  Secure build pipeline, provenance signed and typed.

[![CI](https://github.com/gnabgib/gnablib-ts/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/gnabgib/gnablib-ts/actions)
[![NPM ver](https://img.shields.io/npm/v/gnablib?color=33cd56&logo=npm)](https://www.npmjs.com/package/gnablib)
[![install size](https://packagephobia.com/badge?p=gnablib)](https://packagephobia.com/result?p=gnablib)
[![deps](https://img.shields.io/librariesio/release/npm/gnablib)](https://libraries.io/npm/gnablib)
![LoC](https://tokei.rs/b1/github/gnabgib/gnablib-ts)
![](coverage.svg)

<!-- 
Too new (npms.io seems to be abandoned):
![npms.io (maintenance)](https://img.shields.io/npms-io/final-score/gnablib) 
Says zero.. probably always will?
![Depfu](https://img.shields.io/depfu/dependencies/github/gnabgib/gnablib-ts)
Says not found in red.. like that's bad
-->


## Installation

This module is available through [NPM](https://www.npmjs.com/package/gnablib). There are no install scripts, decrease your risk by explicitly preventing (`--ignore-scripts`)

```bash
(pnpm|npm) install gnablib --ignore-scripts
```

To verify provenance:

```bash
npm audit signatures
```

## Details


### Augmented Backus-Naur Form /[rfc5234](https://datatracker.ietf.org/doc/html/rfc5234)

- [Operators](https://datatracker.ietf.org/doc/html/rfc5234#section-3)
- Definition of [core rules](https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1)


### Algorithms

- Weighted Random Sampling
- Next power of 2
- [Thomson NFA (1968)](https://dl.acm.org/doi/10.1145/363347.363387) solver


### Checksum/Hash

A checksum; can be used to prevent/identify accidental changes.  A hash; maps some data to another, often
used for hash tables, or to speed up comparison.

Name|Sum size bits|Optional parameters
-------|----------------------|-------------------
[adler32](https://datatracker.ietf.org/doc/html/rfc1950)|32|
[Block check character](https://en.wikipedia.org/wiki/Block_check_character)|8|
[cksum](https://en.wikipedia.org/wiki/Cksum)|32|
[CRC24](https://datatracker.ietf.org/doc/html/rfc4880#section-6.1)|24|
[CRC32](https://en.wikipedia.org/wiki/Computation_of_cyclic_redundancy_checks#CRC-32_algorithm)|32|
[fletcher](http://www.zlib.net/maxino06_fletcher-adler.pdf)|16, 32, 64|
[Longitudinal redundancy check](https://en.wikipedia.org/wiki/Longitudinal_redundancy_check)|8|
[Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function#lookup2)|32|seed
[Lookup3](https://en.wikipedia.org/wiki/Jenkins_hash_function#lookup3)|32+32/64|seed
[Luhn](https://en.wikipedia.org/wiki/Luhn_algorithm)|3.5|
[MD5Sum](https://en.wikipedia.org/wiki/Md5sum)|128|
[Murmur3](https://en.wikipedia.org/wiki/MurmurHash#MurmurHash3)|32|seed
[SHA1Sum](https://en.wikipedia.org/wiki/Sha1sum)|160|
[Spooky v2](http://burtleburtle.net/bob/hash/spooky.html)|128|seed
[xxHash](https://cyan4973.github.io/xxHash/)|32, 64|seed


### Command Line Interface (cli)

- Argument and option parsing
- Foreground, background color (8 color, 213 color, 16M colors)
- Underline, bold, faint, italic, blink, invert, hide, strike-through, overline text styles
- Terminal controls & style (cursor move, screen/line clear)


### Codec

- [ASCII85](https://en.wikipedia.org/wiki/Ascii85)
- [Base32, zBase32, Base32Hex](https://www.gnabgib.com/tools/base32/), [Crockford32](https://www.crockford.com/base32.html)
- [Base64, Base64url, B64](https://www.gnabgib.com/tools/base64/)
- [bfloat16](https://en.wikipedia.org/wiki/Bfloat16_floating-point_format)
- [Densely Packed Decimal](https://en.wikipedia.org/wiki/Densely_packed_decimal)
- [Hex](https://en.wikipedia.org/wiki/Hexadecimal)
- [IEEE754](https://en.wikipedia.org/wiki/IEEE_754) Binary
- [Proquint](http://www.gnabgib.com/tools/proquint/)
- [QuotedPrintable](https://datatracker.ietf.org/doc/html/rfc2045#section-6.7)
- [ROT13, ROT13.5, ROT47 ](https://en.wikipedia.org/wiki/ROT13)
- [URI](https://datatracker.ietf.org/doc/html/rfc3986#page-11)
- [UTF8](https://datatracker.ietf.org/doc/html/rfc3629)
- [uuencode](https://en.wikipedia.org/wiki/Uuencoding)
- UUID
- [YEnc](https://en.wikipedia.org/wiki/YEnc)


### Crypto

#### Block

- [Cipher Block Chaining (CBC)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher_block_chaining_(CBC))
- [Cipher FeedBack (CFB)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher_feedback_(CFB))
- [Counter (CTR)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR))
- [Electronic CodeBook (ECB)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Electronic_codebook_(ECB))
- [Output FeedBack (OFB)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher_feedback_(CFB))

CBC or CTR are recommended by [Niels Ferguson](https://en.wikipedia.org/wiki/Niels_Ferguson) and [Bruce Schneier](https://www.schneier.com/blog/about/). 
ECB should not be used.

#### Padding

- [ANSI X9.23](https://www.ibm.com/support/knowledgecenter/en/linuxonibm/com.ibm.linux.z.wskc.doc/wskc_c_l0wskc58.html) / ISO 10126 padding
- [ISO 7816-4 padding](https://en.wikipedia.org/wiki/ISO/IEC_7816)
- [ISO 9797-1 padding 2](https://en.wikipedia.org/wiki/ISO/IEC_9797-1)
- [PKCS#7](https://tools.ietf.org/html/rfc5652#section-6.3) / PKCS#5 padding
- Zero / Null padding

#### Symmetric

Name|Block size|Key size|Nonce size|Features
-|-|-|-|-
[Advanced Encryption Standard (AES)](https://www.nist.gov/publications/advanced-encryption-standard-aes)|16|16, 24, 32|0|
[Ascon-128](https://ascon.iaik.tugraz.at/index.html)|8|16|16|AEAD
[Ascon-128a](https://ascon.iaik.tugraz.at/index.html)|16|16|16|AEAD
[Ascon-80pq](https://ascon.iaik.tugraz.at/index.html)|8|20|16|AEAD, Resistance to quantum adversary
[Blowfish](https://www.schneier.com/academic/archives/1994/09/description_of_a_new.html)|8|4-56|0|
[ChaCha20](https://en.wikipedia.org/wiki/Salsa20#ChaCha_variant)|64|16, 32|12
[ChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305)|64|32|12|AEAD
[Rabbit](https://www.ecrypt.eu.org/stream/rabbitp3.html)|16|16|0, 8|
[Salsa20](http://cr.yp.to/snuffle/spec.pdf)|64|16, 32|8
[Salsa20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#Salsa20-Poly1305_and_XSalsa20-Poly1305)|64|32|12|AEAD
[Twofish](https://www.schneier.com/academic/twofish/)|16|16, 24, 32|0|
[XChaCha20](https://en.wikipedia.org/wiki/Salsa20#XChaCha)|64|32|24|
[XChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#XChaCha20-Poly1305_%E2%80%93_extended_nonce_variant)|64|32|24|AEAD
[XSalsa20](https://en.wikipedia.org/wiki/Salsa20#XSalsa20_with_192-bit_nonce)|64|16, 32|24|
[XSalsa20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#Salsa20-Poly1305_and_XSalsa20-Poly1305)|64|32|24|AEAD

#### Secure Hash

Cryptography hash functions that have the properties:
- Finding an input string that matches a hash value (*pre-image*) is hard
- Finding a pair of messages that generate the same hash value (*collision*) is hard

Name|Digest sizes|Optional parameters
-------|----------------------|-------------------
[Ascon-Hash, Ascon-HashA](https://ascon.iaik.tugraz.at/index.html)|256|-
[Blake](https://en.wikipedia.org/wiki/BLAKE_(hash_function))|256, 512|salt
[Blake2b](https://www.blake2.net/)|8-512, 256, 384, 512|key, salt, personalization
[Blake2s](https://www.blake2.net/)|8-256, 224, 256|key, salt, personalization
[Keccak](https://keccak.team/keccak.html)|8-512, 224, 256, 384, 512|capacity
[MD4†](https://datatracker.ietf.org/doc/html/rfc1320)|128†|-
[MD5†](https://datatracker.ietf.org/doc/html/rfc1321)|128†|-
[ParallelHash](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-185.pdf) (128,256)|8-512|block size, customization
[RipeMD†](https://en.wikipedia.org/wiki/RIPEMD)|128†, 160†, 256, 320|-
[SHA-1†](https://datatracker.ietf.org/doc/html/rfc3174)|160†|-
[SHA-2](https://en.wikipedia.org/wiki/SHA-2)|224, 256, 384, 512, 512/224, 512/256|-
[SHA-3](https://en.wikipedia.org/wiki/SHA-3)|224, 256, 384, 512|-
[TupleHash](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-185.pdf) (128, 256)|8-512|customization
[Whirlpool](https://web.archive.org/web/20171129084214/http://www.larc.usp.br/~pbarreto/WhirlpoolPage.html)|512|-

† No longer considered cryptographically safe

#### Key Derivation Function (KDF)

A cryptographic algorithm that derives one or more secret keys from a secret value.  Can be used to stretch keys (make them longer), or obtain a key in a particular format (eg making a key a fixed length)

- [HKDF](https://en.wikipedia.org/wiki/HKDF)
- [PBKDF2](https://www.rfc-editor.org/rfc/rfc8018#section-5.2) pbkdf2_hmac_sha1, pbkdf2_hmac_sha256, pbkdf2_hmac_sha512

#### Message Authentication Code (MAC)

Also known as an authentication tag, a short piece of information to authenticate a message.  Protect integrity, and authenticity.

Name|Tag Size
-|-
[CMAC](https://datatracker.ietf.org/doc/rfc4493/)|16 (AES)
[HMAC](https://en.wikipedia.org/wiki/HMAC)|Depends on hash (Blake, Blake2, cShake, Keccak, MD4, MD5, RipeMD, Sha1, Sha2, Sha3, Shake, Whirlpool)
[HopMAC](https://www.ietf.org/archive/id/draft-irtf-cfrg-kangarootwelve-10.html#name-security-considerations)|16 (Kangaroo Twelve)
[KMAC](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|16, 32 (Keccak)
[Poly1305](https://datatracker.ietf.org/doc/html/rfc7539#autoid-14)|16

#### EXtendable-Output Function (XOF)

A secure hash that can produce output of any desired length.

Name|Capacities|Optional parameters
-------|-----------|-------------------
[Ascon-Xof, Ascon-XofA](https://ascon.iaik.tugraz.at/index.html)|256|digest size
[cShake](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|128, 256|digest size, function name, customization
[KangarooTwelve](https://datatracker.ietf.org/doc/draft-irtf-cfrg-kangarootwelve/)|128|digest size, customization
[KmacXof](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|128, 256|digest size, key, customization
[ParallelHashXof](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|128, 256|block size, digest size, customization
[Shake](https://en.wikipedia.org/wiki/SHAKE128)|128, 256|digest size
[TupleHashXof](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|128, 256|digest size, customization
[TurboSHAKE](https://datatracker.ietf.org/doc/draft-irtf-cfrg-kangarootwelve/)|128, 256|digest size, customization

### DateTime

- Year, Month, Day
- Hour, Minute, Second, Millisecond, Microsecond
- DateTimeLocal, DateTimeUtc, DateOnly, TimeOnly
- Duration, DurationExact
- DateTime*.lt|lte|eq|gt|gte|neq - Compare two date-times
- DateTime*.add|sub - Add or subtract Duration|DurationExact from a date-time
- DateTime*.diff|diffExact - Get the difference between two dates in y/m/d/h/* or d/h/*

### Error Correction Codes

- [Reed Solomon](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction)


### Endian

- [Big](https://en.wikipedia.org/wiki/Endianness)
- Little


### Net

- [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing)
- [IPv4](https://en.wikipedia.org/wiki/Internet_Protocol_version_4)
- IpTree


### Primitive

- Fixed TypedArray
- Int64
- Lazy
- Readonly TypedArray
- Scaling TypedArray
- StringBuilder
- UInt16, UInt32, UInt64, UInt128, UInt256
- U32MutArra, U64MutArray
- UInt, UIntMut
- WindowStr

#### Extensions:

- Bit
- Int
- String
- Uint8Array

### Pseudorandom number generators (PRNG)

- [Lehmer/MCG](https://en.wikipedia.org/wiki/Lehmer_random_number_generator) - generate integers [0 - 2147483646]
- [Marsaglia](https://groups.google.com/g/sci.math/c/6BIYd0cafQo/m/Ucipn_5T_TMJ?hl=en) -
  possible to calculate in your head
- [Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister) - generate integers [0 - 4294967295]
- [Middle-Square](https://en.wikipedia.org/wiki/Middle-square_method) -
  in practice flawed since the period is often short and will converge towards the same number or loop after repeated times
- [MSVC](https://orlp.net/blog/when-random-isnt/) - generate integers [0 - 2147483647]
- [RANDU](https://en.wikipedia.org/wiki/RANDU) -
  a famously bad PRNG, generate integers [0 - 2147483647]
- SplitMix32 - generate integers [0 - 4294967295], SplitMix64, the default pseudo-random number generator algorithm in Java - generate integers [0 - 18446744073709551615]
- [XorShift](https://www.jstatsoft.org/article/view/v008i14) 
32 range [0 - 4294967295], 
64 range [0 - 18446744073709551615], 
128 range [0 - 4294967295], 
128+ & 128+v8 range [0 - 18446744073709551615]
- [XoShiRo128](https://prng.di.unimi.it/#intro) - xoshiro128+, xoshiro128++, xoshiro128** - generate integers [0 - 4294967295]

### RegExp

- RegExp escape string


### RunTime

- Configuration (including collecting from environment variables)
- Structured logging
- Normalize stack entries, and stack traces across engines, with colors 


## License

[MPL-1.1](LICENSE)
