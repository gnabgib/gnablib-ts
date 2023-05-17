# gnablib

A library for building web/node/deno applications.

## Installation

This module is available through [NPM](https://www.npmjs.com/). There are no install scripts, decrease your risk by explicitly preventing (`--ignore-scripts`)

**PNPM**

```bash
pnpm install gnablib --ignore-scripts
```

**NPM**

```bash
npm install gnablib --ignore-scripts
```

## Details

### Augmented Backus-Naur Form /[rfc5234](https://datatracker.ietf.org/doc/html/rfc5234)

- [Operators](https://datatracker.ietf.org/doc/html/rfc5234#section-3)
- Definition of [core rules](https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1)

### Algorithms

- Weighted Random Sampling
- Next power of 2
- [Thomson NFA (1968)](https://dl.acm.org/doi/10.1145/363347.363387) solver

### Checksum

- [adler32](https://datatracker.ietf.org/doc/html/rfc1950)
- [Block check character](https://en.wikipedia.org/wiki/Block_check_character)
- [cksum](https://en.wikipedia.org/wiki/Cksum)
- [CRC32](https://en.wikipedia.org/wiki/Computation_of_cyclic_redundancy_checks#CRC-32_algorithm)
- [fletcher](http://www.zlib.net/maxino06_fletcher-adler.pdf) 16, 32, 64
- [Longitudinal redundancy check](https://en.wikipedia.org/wiki/Longitudinal_redundancy_check)
- [Luhn](https://en.wikipedia.org/wiki/Luhn_algorithm)
- [MD5Sum](https://en.wikipedia.org/wiki/Md5sum)
- [SHA1Sum](https://en.wikipedia.org/wiki/Sha1sum)

### Error Correction Codes

- [Reed Solomon](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction)

### Encoding

- [ASCII85](https://en.wikipedia.org/wiki/Ascii85)
- [Base32](https://www.gnabgib.com/tools/base32/)
- [Base64](https://www.gnabgib.com/tools/base64/)
- [Crockford32](https://www.crockford.com/base32.html)
- [Densely Packed Decimal](https://en.wikipedia.org/wiki/Densely_packed_decimal)
- [Hex](https://en.wikipedia.org/wiki/Hexadecimal)
- [IEEE754](https://en.wikipedia.org/wiki/IEEE_754)
- [Proquint](http://www.gnabgib.com/tools/proquint/)
- [QuotedPrintable](https://datatracker.ietf.org/doc/html/rfc2045#section-6.7)
- [ROT13](https://en.wikipedia.org/wiki/ROT13)
- ROT13.5
- ROT47
- [URI](https://datatracker.ietf.org/doc/html/rfc3986#page-11)
- [UTF8](https://datatracker.ietf.org/doc/html/rfc3629)
- [uuencode](https://en.wikipedia.org/wiki/Uuencoding), uudecode
- UUID
- [YEnc](https://en.wikipedia.org/wiki/YEnc)

### Endian

- [Big](https://en.wikipedia.org/wiki/Endianness)
- Little

### Hash & XOF

Hash|Digest sizes|Optional parameters
-------|----------------------|-------------------
[Blake](https://en.wikipedia.org/wiki/BLAKE_(hash_function))|256, 512|salt
[Blake2b](https://www.blake2.net/)|8-512, 256, 384, 512|key, salt, personalization
[Blake2s](https://www.blake2.net/)|8-256, 224, 256|key, salt, personalization
[Keccak](https://keccak.team/keccak.html)|8-512, 224, 256, 384, 512|capacity
[MD4](https://datatracker.ietf.org/doc/html/rfc1320)|128|-
[MD5](https://datatracker.ietf.org/doc/html/rfc1321)|128|-
[ParallelHash](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-185.pdf) (128,256)|8-512|customization
[RipeMD](https://en.wikipedia.org/wiki/RIPEMD)|128, 160, 256, 320|-
[SHA-1](https://datatracker.ietf.org/doc/html/rfc3174)|160|-
[SHA-2](https://en.wikipedia.org/wiki/SHA-2)|224, 256, 384, 512, 512/224, 512/256|-
[SHA-3](https://en.wikipedia.org/wiki/SHA-3)|224, 256, 384, 512|-
[TupleHash](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-185.pdf) (128, 256)|8-512|customization
[Whirlpool](https://web.archive.org/web/20171129084214/http://www.larc.usp.br/~pbarreto/WhirlpoolPage.html)|512|-

XOF|Capacities|Optional parameters
-------|-----------|-------------------
[cShake](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|128, 256|digest size, function name, customization
[KmacXof](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf)|128, 256|digest size, key, customization
[Shake](https://en.wikipedia.org/wiki/SHAKE128)|128, 256|digest size


### Log

- Structured logging

### KDF

- [HKDF](https://en.wikipedia.org/wiki/HKDF)

### MAC

- [HMAC](https://en.wikipedia.org/wiki/HMAC) (Blake, Blake2, cShake, Keccak, MD4, MD5, RipeMD, Sha1, Sha2, Sha3, Shake, Whirlpool)
- [KMAC](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf) (128, 256, xof128, xof256)

### Net

- [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing)
- [IPv4](https://en.wikipedia.org/wiki/Internet_Protocol_version_4)
- IpTree

### Primitive

- DateTime
- Duration
- Fixed TypedArray
- Int64
- Lazy
- Readonly TypedArray
- Scaling TypedArray
- StringBuilder
- Uint64
- WindowStr

#### Extensions:

- Bit
- Error
- Integer
- Object
- String

### Misc

- RegExp escape string

<!--
## Development

Tests are written using the swift [uvu](https://github.com/lukeed/uvu) test runner /w [uvu/assert](https://github.com/lukeed/uvu/blob/master/docs/api.assert.md)

```base
npm test
```

Content will be output into `/dist/**`

```bash
npm run build
```

Update version
```bash
npm version patch -m "Upgrade to %s, <reason>"
```

Resume after checkout
```bash
pnpm install
```

Format in VSCode: CTRL+SHIFT+P: Format
-->

## License

[MPL-2.0](LICENSE)
