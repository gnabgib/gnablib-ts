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

## Contents

- [Installation](#installation)
- [License](#license)
- Features:
  - [Augmented Backus-Naur Form](#augmented-backus-naur-form-rfc5234)
  - [Checksum/Hashsum](#checksumhashsum)
  - [Command Line Interface](#command-line-interface-cli) (arguments, colour, text style)
  - [Codecs](#codec)
  - [Symmetric Encryption](#symmetric-encryption)
  - [Secure Hashing](#secure-hash)
  - [Key derivation functions](#key-derivation-function-kdf)
  - [Message Authentication Codes](#message-authentication-code-mac)
  - [EXtendable-Output Functions](#extendable-output-function-xof)
  - [DateTime](#datetime)
  - [Error Correction Code](#error-correction-codes)
  - [Endian](#endian)
  - [Primitive Types](#primitive)
  - [Seedable PseudoRandom number generators](#pseudorandom-number-generators-prng)
  - [RegExp tools](#regexp)
  - [Run time tools](#run-time) (environment vars, logging, stack traces)

Ƃ = Bytes  
b = bits


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
- [Thomson NFA (1968)](https://dl.acm.org/doi/10.1145/363347.363387) solver


### Checksum/Hashsum

A checksum; can be used to prevent/identify accidental changes.

Name|Sum size Ƃ
-|-
[Adler32](https://datatracker.ietf.org/doc/html/rfc1950)|4
[Block Check Character](https://en.wikipedia.org/wiki/Block_check_character)|1
[Cksum](https://en.wikipedia.org/wiki/Cksum)|4
[CRC24](https://datatracker.ietf.org/doc/html/rfc4880#section-6.1)|3
[CRC32](https://en.wikipedia.org/wiki/Computation_of_cyclic_redundancy_checks#CRC-32_algorithm)|4
[Fletcher16](http://www.zlib.net/maxino06_fletcher-adler.pdf)|2
[Fletcher32](http://www.zlib.net/maxino06_fletcher-adler.pdf)|4
[Fletcher64](http://www.zlib.net/maxino06_fletcher-adler.pdf)|8
[Longitudinal Redundancy Check](https://en.wikipedia.org/wiki/Longitudinal_redundancy_check)|1

The [Luhn](https://en.wikipedia.org/wiki/Luhn_algorithm) algorithm is also support, which only works on
integers/numerical digits (eg. credit cards, SI numbers)


A hash; maps some data to another, often used for hash tables, or to speed up comparison. We use the term
hashsum to distinguish from cryptographic-hashes (although *MD5* and *SHA1* were once cryptographically safe)

Name|Sum size Ƃ|Optional parameters
-------|----------------------|-------------------
[Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function#lookup2)|4|seed
[Lookup3](https://en.wikipedia.org/wiki/Jenkins_hash_function#lookup3)|4+4/8|seed
[MD5Sum](https://en.wikipedia.org/wiki/Md5sum)|16|
[Murmur3](https://en.wikipedia.org/wiki/MurmurHash#MurmurHash3)|4|seed
[SHA1Sum](https://en.wikipedia.org/wiki/Sha1sum)|20|
[Spooky v2](http://burtleburtle.net/bob/hash/spooky.html)|16|seed
[xxHash32](https://cyan4973.github.io/xxHash/)|4|seed
[xxHash64](https://cyan4973.github.io/xxHash/)|8|seed


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
- [Scream](https://xkcd.com/3054/)
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

#### Symmetric Encryption

Name|Block Ƃ|Key Ƃ|Nonce Ƃ|Features
-|-|-|-|-
[Advanced Encryption Standard (AES)](https://www.nist.gov/publications/advanced-encryption-standard-aes)|16|16, 24, 32|0|
[ARIA](http://210.104.33.10/ARIA/index-e.html)|16|16, 24, 32|0|
[Ascon-128](https://ascon.iaik.tugraz.at/index.html)|8, 16|16|16|AEAD
[Ascon-80pq](https://ascon.iaik.tugraz.at/index.html)|8|20|16|+Quantum resistance
[Blowfish](https://www.schneier.com/academic/archives/1994/09/description_of_a_new.html)|8|4-56|0|
[ChaCha20](https://en.wikipedia.org/wiki/Salsa20#ChaCha_variant)|64|16, 32|12
[ChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305)|64|32|12|AEAD
[Lightweight Encryption Algorithm (LEA)](https://en.wikipedia.org/wiki/LEA_(cipher))|16|16, 24, 32|0|
[Rabbit](https://www.ecrypt.eu.org/stream/rabbitp3.html)|16|16|0, 8|
[Salsa20](http://cr.yp.to/snuffle/spec.pdf)|64|16, 32|8
[Salsa20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#Salsa20-Poly1305_and_XSalsa20-Poly1305)|64|32|12|AEAD
[Serpent](https://www.cl.cam.ac.uk/~rja14/serpent.html)|16|16, 24, 32|0|
[Simon64](https://nsacyber.github.io/simon-speck/)|8|12, 16|0|
[Simon128](https://nsacyber.github.io/simon-speck/)|16|16, 24, 32|0|
[SM4](https://en.wikipedia.org/wiki/SM4_(cipher))|16|16|0|
[Speck64](https://nsacyber.github.io/simon-speck/)|8|12, 16|0|
[Speck128](https://nsacyber.github.io/simon-speck/)|16|16, 24, 32|0|
[Threefish256](https://www.schneier.com/academic/skein/threefish/)|16|16|~16|Tweak (nonce/AEAD)
[Threefish512](https://www.schneier.com/academic/skein/threefish/)|32|32|~16|Tweak (nonce/AEAD)
[Threefish1024](https://www.schneier.com/academic/skein/threefish/)|64|64|~16|Tweak (nonce/AEAD)
[Twofish](https://www.schneier.com/academic/twofish/)|16|16, 24, 32|0|
[XChaCha20](https://en.wikipedia.org/wiki/Salsa20#XChaCha)|64|32|24|
[XChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#XChaCha20-Poly1305_%E2%80%93_extended_nonce_variant)|64|32|24|AEAD
[XSalsa20](https://en.wikipedia.org/wiki/Salsa20#XSalsa20_with_192-bit_nonce)|64|16, 32|24|
[XSalsa20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#Salsa20-Poly1305_and_XSalsa20-Poly1305)|64|32|24|AEAD

#### Secure Hash

Cryptography hash functions that have the properties:
- Finding an input string that matches a hash value (*pre-image*) is hard
- Finding a pair of messages that generate the same hash value (*collision*) is hard

Name|Digest Ƃ|Optional parameters
-------|----------------------|-------------------
[Ascon-Hash, Ascon-HashA](https://ascon.iaik.tugraz.at/index.html)|32|-
[Blake](https://en.wikipedia.org/wiki/BLAKE_(hash_function))|32, 64|salt
[Blake2b](https://www.blake2.net/)|1-64, 32, 48, 64|key, salt, personalization
[Blake2s](https://www.blake2.net/)|1-32, 28, 32|key, salt, personalization
[Keccak](https://keccak.team/keccak.html)|1-64, 28, 32, 48, 64|capacity
[MD4†](https://datatracker.ietf.org/doc/html/rfc1320)|16†|-
[MD5†](https://datatracker.ietf.org/doc/html/rfc1321)|16†|-
[ParallelHash](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-185.pdf) (128,256)|1-64|block size, customization
[RipeMD†](https://en.wikipedia.org/wiki/RIPEMD)|16†, 20†, 32, 40|-
[SHA-1†](https://datatracker.ietf.org/doc/html/rfc3174)|20†|-
[SHA-2](https://en.wikipedia.org/wiki/SHA-2)|28, 32, 48, 64, 64/28, 64/32|-
[SHA-3](https://en.wikipedia.org/wiki/SHA-3)|28, 32, 48, 64|-
[TupleHash](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-185.pdf) (128, 256)|1-64|customization
[Whirlpool](https://web.archive.org/web/20171129084214/http://www.larc.usp.br/~pbarreto/WhirlpoolPage.html)|64|-

† No longer considered cryptographically safe

#### Key Derivation Function (KDF)

A cryptographic algorithm that derives one or more secret keys from a secret value.  Can be used to stretch keys (make them longer), or obtain a key in a particular format (eg making a key a fixed length)

- [HKDF](https://en.wikipedia.org/wiki/HKDF)
- [PBKDF2](https://www.rfc-editor.org/rfc/rfc8018#section-5.2) pbkdf2_hmac_sha1, pbkdf2_hmac_sha256, pbkdf2_hmac_sha512

#### Message Authentication Code (MAC)

Also known as an authentication tag, a short piece of information to authenticate a message.  Protect integrity, and authenticity.

Name|Tag Ƃ
-|-
[CMAC](https://datatracker.ietf.org/doc/rfc4493/)|16 (AES)
[HMAC](https://en.wikipedia.org/wiki/HMAC)|Depends on hash (Blake, Blake2, cShake, Keccak, MD4, MD5, RipeMD, Sha1, Sha2, Sha3, Shake, Whirlpool)
[HopMAC](https://www.ietf.org/archive/id/draft-irtf-cfrg-kangarootwelve-10.html#name-security-considerations)|16 (Kangaroo Twelve)
[KMAC](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|16, 32 (Keccak)
[Poly1305](https://datatracker.ietf.org/doc/html/rfc7539#autoid-14)|16

#### EXtendable-Output Function (XOF)

A secure hash that can produce output of any desired length.

Name|Capacity Ƃ|Optional parameters
-------|-----------|-------------------
[Ascon-Xof, Ascon-XofA](https://ascon.iaik.tugraz.at/index.html)|32|digest size
[cShake](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|16, 32|digest size, function name, customization
[KangarooTwelve](https://datatracker.ietf.org/doc/draft-irtf-cfrg-kangarootwelve/)|16|digest size, customization
[KmacXof](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|16, 32|digest size, key, customization
[ParallelHashXof](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|16, 32|block size, digest size, customization
[Shake](https://en.wikipedia.org/wiki/SHAKE128)|16, 32|digest size
[TupleHashXof](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|16, 32|digest size, customization
[TurboSHAKE](https://datatracker.ietf.org/doc/draft-irtf-cfrg-kangarootwelve/)|16, 32|digest size, customization

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

- Convert between big (BE) and little (LE) [Endian](https://en.wikipedia.org/wiki/Endianness) encoding 16/32/64/128 bits, or a stream of bytes.
- Detects platform endianness

Big endian is closer to the way we write numbers left-to-right in English.  `1726 = 1x1000, 7x100, 2x10, 6x1`

Little endian is the dominant ordering for processor architectures including; [x86](https://en.wikipedia.org/wiki/X86) and [RISC-V](https://en.wikipedia.org/wiki/RISC-V), [ARM](https://en.wikipedia.org/wiki/Endianness) can be either but defaults to little.  Famous big endian processors include [PDP-10](https://en.wikipedia.org/wiki/PDP-10), Motorola [68000 series](https://en.wikipedia.org/wiki/Motorola_68000_series) (early Macintosh, Amiga, Atari, Sega), [IBM Z](https://en.wikipedia.org/wiki/Z/Architecture) and [SPARC](https://en.wikipedia.org/wiki/SPARC), which can be either but default to big.

### Primitive

- BitReader / BitWriter
- Fixed TypedArray
- Lazy
- Network [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing), [IPv4](https://en.wikipedia.org/wiki/Internet_Protocol_version_4)
- Readonly TypedArray
- Scaling TypedArray
- StringBuilder
- WindowStr
- *16 bit*: uint (U16) **2Ƃ**
- *32 bit*: uint (U32), mutable uint (U32Mut), mutable uint array (U32MutArray) **4Ƃ**
- *64 bit*: int (I64), uint (U64), mutable int (I64Mut), mutable uint (U64Mut), mutable uint array (U64MutArray) **8Ƃ**
- *128 bit*: uint (U128), mutable uint (U128Mut) **16Ƃ**
- *256 bit*: uint (U256) **32Ƃ**
- *512 bit*: uint (U512) **64Ƃ**

#### Extensions:

- Bit (countBitsSet, lsbMask, reverse, countLeadZeros, nextPow2)
- Float (parseDec)
- Int (parseDec, parseHex, parseCsv)
- String (splitChars, splitLen, reverse, padStart, filter, ctEq, ctSelect)
- Uint (parseDec, parseHex, sign8, sign16, sign32, glScaleSize, toGlScaleBytes, fromGlScaleBytes)
- Uint8Array (toGlBytes, ctEq, ctSelect, incrBE, lShiftEq, xorEq)

### PseudoRandom number generators (PRNG)

#### Good PRNGs

Use one of these if you can, alphabetically sorted.  *gjrand32b* is only somewhat official and doesn't have a lot of testing.

Name|Year|Variant|State Ƃ| |Out b|Safe b
-|-:|-|-:|-|-:|-:|
[GJRand](https://gjrand.sourceforge.net/)|2005|~gjrand32b|16||32|〃
|||gjrand64|32|‡|64|〃
[Permuted Congruential Generator (PCG)](https://www.pcg-random.org/)|2014|pcg32|8|‡|32|〃
|||pcg64|16|‡|64|〃
[Small Fast Counting (SFC)](https://pracrand.sourceforge.net/RNG_engines.txt)|2010|sfc16|8||16|〃
|||sfc32|16||32|〃
|||sfc64|32|‡|64|〃
[SplitMix](https://gee.cs.oswego.edu/dl/papers/oopsla14.pdf)|2014|splitmix32|4||32|〃
|||splitmix64|8|‡|64|〃
[Tychei](https://www.researchgate.net/publication/233997772_Fast_and_Small_Nonlinear_Pseudorandom_Number_Generators_for_Computer_Simulation)|2011|tychei|16||32|〃
[Well equidistributed long-period linear (WELL)](https://en.wikipedia.org/wiki/Well_equidistributed_long-period_linear)|2006|well512|64||32|〃
[XoRoShiRo](https://prng.di.unimi.it/#intro)|2018|xoroshiro64*|8||32|〃
|||xoroshiro64**|8||32|〃
|||xoroshiro128+|16|‡|64|53
|||xoroshiro128++|16|‡|64|〃
|||xoroshiro128**|16|‡|64|〃
[XorShift+](https://en.wikipedia.org/wiki/Xorshift#xorshift+)|2003|xorshift128+|16|‡|64|〃
[XoShiRo](https://prng.di.unimi.it/#intro)|2018|xoshiro128+|16||32|24
|||xoshiro128++|16||32|〃
|||xoshiro128**|16||32|〃
|||xoshiro256+|32|‡|64|53
|||xoshiro256++|32|‡|64|〃
|||xoshiro256**|32|‡|64|〃

‡: Use U64 library to exceed JS 32bit integer constraint (may be slower)

U16
: [0 - 32767 | 0xFFFF]  
U31
: [0 - 2147483647 | 0x7FFFFFFF]  
U32
: [0 - 4294967295 | 0xFFFFFFFF]  
U64
: [0 - 18446744073709551615 | 0xFFFFFFFFFFFFFFFF]


#### Poor PRNGs

Best not to use these, there are some dragons in these waters (so if you're choosing, be aware of the limitations).  However, you might have a compatibility constraint (or love the name "Mersenne Twister").

Name|Year|Variant|State Ƃ|Out b
-|-:|-|-:|-:
[ARC4/RC4/Arcfour/Arc4random](https://en.wikipedia.org/wiki/RC4)|1997|arc4|258|8
[Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister)|1998|mt19937|2496|32
[MulBerry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c)|2017|mulberry32|4|32
[XorShift](https://www.jstatsoft.org/article/view/v008i14)|2003|xorshift128|16|32

#### Bad PRNGs

If you're curious about the lineage, or need for compatibility with an old decision, but don't chose one of these.
If you're already using one of these, consider migrating.


Name|Variant|State Ƃ|Out b
-|-|-:|-:
[Lehmer/LCG/MCG 1988](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)|all|4|31
[Marsaglia](https://groups.google.com/g/sci.math/c/6BIYd0cafQo/m/Ucipn_5T_TMJ?hl=en)|-|1|4
[Middle-Square](https://en.wikipedia.org/wiki/Middle-square_method)|-|4|n digits
MSVC (LCG)|-|4|16
[RANDU (LCG)](https://en.wikipedia.org/wiki/RANDU)|-|4|31
[XorShift 2003](https://www.jstatsoft.org/article/view/v008i14)|xorshift32|4|32
||xorshift64|8|64



### RegExp

- RegExp escape string


### Run time

- Configuration (including collecting from environment variables)
- Structured logging
- Normalize stack entries, and stack traces across engines, with colors 


## License

Copyright &copy; 2022-2025 gnablib contributors

[MPL-1.1](LICENSE)
