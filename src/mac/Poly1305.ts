// import { hex } from "../encoding/Hex.js";
// import { asLE } from "../endian/platform.js";
// import { IHash } from "../hash/IHash.js";
// import { safety } from "../primitive/Safety.js";
// import { U128, U128Mut } from "../primitive/U128.js";
// import { U64, U64Mut, U64MutArray } from "../primitive/U64.js";

// const blockSize=16;


// /**
//  * [Poly1305](https://datatracker.ietf.org/doc/html/rfc8439#autoid-14)
//  * ([Wiki](https://en.wikipedia.org/wiki/Poly1305))
//  * 
//  * Poly1305 is a universal hash family designed by Daniel J. Bernstein
//  * 
//  * Block size: *16 bytes*  
//  * Key size: *32 bytes*  
//  * 
//  * Specified in
//  * - [RFC8439](https://datatracker.ietf.org/doc/html/rfc8439)
//  * - ~[RFC7539](https://datatracker.ietf.org/doc/html/rfc7539)~
//  */
// export class Poly1305 implements IHash {
//     readonly blockSize = blockSize;//128
//     readonly size = blockSize;//128

//     readonly #r:Uint8Array;
//     readonly #r32:Uint32Array;
//     readonly #r2:U128;
//     readonly #s:Uint8Array;

//     //We only use 1 extra byte but to point a #b32 at it, it needs to be a multiple of 4
//     /** Temp processing block */
//     readonly #block = new Uint8Array(blockSize+4);
//     readonly #b32=new Uint32Array(this.#block.buffer);
//     /** Position of data written to block */
// 	#bPos = 0;
//     readonly #a=U64MutArray.fromLen(8);
//     readonly #a2=U128Mut.fromInt(0);


//     constructor(
//         key:Uint8Array
//     ) {
//         safety.lenExactly(key,32,'key');//256
//         this.#r=key.slice(0,16);
//         this.#r2=U128.fromBytesLE(this.#r).and(U128.fromUint32Quad(0x0fffffff,0x0ffffffc,0x0ffffffc,0x0ffffffc));
        
        
//         //asLE.i32(this.#r,0,4);
//         this.#r32=new Uint32Array(this.#r.buffer,0,4);
//         //this.#r2=U128.fromArray(this.#r32);
        
//         this.#s=key.slice(16,32);
//         asLE.i32(this.#s,0,4);

//         //Clamp r
//         this.#r32[0]&=0x0fffffff;
//         this.#r32[1]&=0x0ffffffc;
//         this.#r32[2]&=0x0ffffffc;
//         this.#r32[3]&=0x0ffffffc;

//         // console.log(`s=${hex.fromBytes(this.#s)}`);
//          console.log(`r=${hex.fromBytes(this.#r)}`);
//          console.log(`r2=${this.#r2.toString()}`);
//     }

//     private hash() {
//         //Add 1 bit at the end
//         this.#block[this.#bPos++]=1;
//         //Zero any remaining space (last block only could be !=16)
//         this.#block.fill(0,this.#bPos);
//         //while(this.#bPos<17) this.#block[this.#bPos++]=0;
//         asLE.i32(this.#block,0,4);
//         console.log(`acc=${hex.fromU64a(this.#a)}`);
//         console.log(`block=${hex.fromBytes(this.#block)}`);


//         //Add to accumulator
//         this.#a2.addEq(U128.fromArray(this.#b32));
//         this.#a.at(0).addEq(U64.fromIntUnsafe(this.#b32[0]));
//         this.#a.at(1).addEq(U64.fromIntUnsafe(this.#b32[1]));
//         this.#a.at(2).addEq(U64.fromIntUnsafe(this.#b32[2]));
//         this.#a.at(3).addEq(U64.fromIntUnsafe(this.#b32[3]));
//         this.#a.at(4).addEq(U64.fromIntUnsafe(this.#b32[4]));
//         console.log(`a+b =${hex.fromU64a(this.#a,' ')}`);

//         //Propagate carry
//         this.#a.at(1).addEq(U64.fromIntUnsafe(this.#a.at(0).high));
//         this.#a.at(2).addEq(U64.fromIntUnsafe(this.#a.at(1).high));
//         this.#a.at(3).addEq(U64.fromIntUnsafe(this.#a.at(2).high));
//         this.#a.at(4).addEq(U64.fromIntUnsafe(this.#a.at(3).high));

//         //Only use the low
//         const a=new Uint32Array(5);
//         a[0]=this.#a.at(0).low;
//         a[1]=this.#a.at(1).low;
//         a[2]=this.#a.at(2).low;
//         a[3]=this.#a.at(3).low;
//         a[4]=this.#a.at(4).low;
//         console.log(`a+b'=${hex.fromU64a(this.#a,' ')}`);
//         console.log(`A+b =${this.#a2.toString()}`);

//         //Long multiply
//         this.#a.at(0).set(U64Mut.fromIntUnsafe(a[0]).mulEq(U64.fromIntUnsafe(this.#r32[0])));
//         this.#a.at(1).set(
//             U64Mut.fromIntUnsafe(a[0]).mulEq(U64.fromIntUnsafe(this.#r32[1])).addEq(
//             U64Mut.fromIntUnsafe(a[1]).mulEq(U64.fromIntUnsafe(this.#r32[0])))
//         );
//         this.#a.at(2).set(
//             U64Mut.fromIntUnsafe(a[0]).mulEq(U64.fromIntUnsafe(this.#r32[2])).addEq(
//             U64Mut.fromIntUnsafe(a[1]).mulEq(U64.fromIntUnsafe(this.#r32[1]))).addEq(
//             U64Mut.fromIntUnsafe(a[2]).mulEq(U64.fromIntUnsafe(this.#r32[0])))
//         );
//         this.#a.at(3).set(
//             U64Mut.fromIntUnsafe(a[0]).mulEq(U64.fromIntUnsafe(this.#r32[3])).addEq(
//             U64Mut.fromIntUnsafe(a[1]).mulEq(U64.fromIntUnsafe(this.#r32[2]))).addEq(
//             U64Mut.fromIntUnsafe(a[2]).mulEq(U64.fromIntUnsafe(this.#r32[1]))).addEq(
//             U64Mut.fromIntUnsafe(a[3]).mulEq(U64.fromIntUnsafe(this.#r32[0])))
//         );
//         this.#a.at(4).set(
//             U64Mut.fromIntUnsafe(a[1]).mulEq(U64.fromIntUnsafe(this.#r32[3])).addEq(
//             U64Mut.fromIntUnsafe(a[2]).mulEq(U64.fromIntUnsafe(this.#r32[2]))).addEq(
//             U64Mut.fromIntUnsafe(a[3]).mulEq(U64.fromIntUnsafe(this.#r32[1]))).addEq(
//             U64Mut.fromIntUnsafe(a[4]).mulEq(U64.fromIntUnsafe(this.#r32[0])))
//         );
//         this.#a.at(5).set(
//             U64Mut.fromIntUnsafe(a[2]).mulEq(U64.fromIntUnsafe(this.#r32[3])).addEq(
//             U64Mut.fromIntUnsafe(a[3]).mulEq(U64.fromIntUnsafe(this.#r32[2]))).addEq(
//             U64Mut.fromIntUnsafe(a[4]).mulEq(U64.fromIntUnsafe(this.#r32[1])))
//         );
//         this.#a.at(6).set(
//             U64Mut.fromIntUnsafe(a[3]).mulEq(U64.fromIntUnsafe(this.#r32[3])).addEq(
//             U64Mut.fromIntUnsafe(a[4]).mulEq(U64.fromIntUnsafe(this.#r32[2])))
//         );
//         this.#a.at(7).set(
//             U64Mut.fromIntUnsafe(a[4]).mulEq(U64.fromIntUnsafe(this.#r32[3]))
//         );

//         //Carry
//         this.#a.at(1).addEq(U64.fromIntUnsafe(this.#a.at(0).high));
//         this.#a.at(2).addEq(U64.fromIntUnsafe(this.#a.at(1).high));
//         this.#a.at(3).addEq(U64.fromIntUnsafe(this.#a.at(2).high));
//         this.#a.at(4).addEq(U64.fromIntUnsafe(this.#a.at(3).high));
//         this.#a.at(5).addEq(U64.fromIntUnsafe(this.#a.at(4).high));
//         this.#a.at(6).addEq(U64.fromIntUnsafe(this.#a.at(5).high));
//         this.#a.at(7).addEq(U64.fromIntUnsafe(this.#a.at(6).high));

//         a[0]=this.#a.at(4).low & 0xFFFFFFFC;
//         a[1]=this.#a.at(5).low;
//         a[2]=this.#a.at(6).low;
//         a[3]=this.#a.at(7).low;

//         //LSB
//         this.#a.at(0).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(1).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(2).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(3).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(4).andEq(U64.fromIntUnsafe(0x00000003));
//         console.log(`a*r =${hex.fromU64a(this.#a,' ')}`);
//         this.#a2.mulEq(this.#r2);
//         console.log(`A*R =${this.#a2.toString()}`);


//         this.#a.at(0).addEq(U64.fromIntUnsafe(a[0])).addEq(U64.fromIntUnsafe(a[0]>>>2|a[1]<<30));
//         this.#a.at(1).addEq(U64.fromIntUnsafe(a[1])).addEq(U64.fromIntUnsafe(a[1]>>>2|a[2]<<30));
//         this.#a.at(2).addEq(U64.fromIntUnsafe(a[2])).addEq(U64.fromIntUnsafe(a[2]>>>2|a[3]<<30));
//         this.#a.at(3).addEq(U64.fromIntUnsafe(a[3])).addEq(U64.fromIntUnsafe(a[3]>>>2));

//         //Carry
//         this.#a.at(1).addEq(U64.fromIntUnsafe(this.#a.at(0).high));
//         this.#a.at(2).addEq(U64.fromIntUnsafe(this.#a.at(1).high));
//         this.#a.at(3).addEq(U64.fromIntUnsafe(this.#a.at(2).high));
//         this.#a.at(4).addEq(U64.fromIntUnsafe(this.#a.at(3).high));

//         this.#a.at(0).set(U64.fromIntUnsafe(this.#a.at(4).low &  0xFFFFFFFC));

//         //LSB
//         this.#a.at(0).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(1).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(2).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(3).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(4).andEq(U64.fromIntUnsafe(0x00000003));

//         this.#a.at(0).addEq(U64.fromIntUnsafe(a[0])).addEq(U64.fromIntUnsafe(a[0]>>2));

//         //Carry
//         this.#a.at(1).addEq(U64.fromIntUnsafe(this.#a.at(0).high));
//         this.#a.at(2).addEq(U64.fromIntUnsafe(this.#a.at(1).high));
//         this.#a.at(3).addEq(U64.fromIntUnsafe(this.#a.at(2).high));
//         this.#a.at(4).addEq(U64.fromIntUnsafe(this.#a.at(3).high));

//         //LSB
//         this.#a.at(0).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(1).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(2).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(3).andEq(U64.fromIntUnsafe(0xFFFFFFFF));
//         this.#a.at(4).andEq(U64.fromIntUnsafe(0x00000003));

//         this.#bPos=0;

//     }

//     write(data: Uint8Array): void {
// 		let nToWrite = data.length;
// 		let dPos = 0;
// 		let space = this.blockSize - this.#bPos;
// 		while (nToWrite > 0) {
// 			if (space >= nToWrite) {
// 				//More space than data, copy in verbatim
// 				this.#block.set(data.subarray(dPos), this.#bPos);
// 				//Update pos
// 				this.#bPos += nToWrite;
// 				return;
// 			}
// 			this.#block.set(data.subarray(dPos, dPos + this.blockSize), this.#bPos);
// 			this.#bPos += space;
// 			this.hash();
// 			dPos += space;
// 			nToWrite -= space;
// 			space = this.blockSize;
// 		}
//     }

//     sum(): Uint8Array {
//         return this.clone().sumIn();
//     }

//     sumIn(): Uint8Array {
//         //Process any remainder
//         if (this.#bPos>0) this.hash();
        
//         //Save the accumulator
//         const b=new Uint32Array(4);
//         b[0]=this.#a.at(0).low;
//         b[1]=this.#a.at(1).low;
//         b[2]=this.#a.at(2).low;
//         b[3]=this.#a.at(3).low;

//         this.#a.at(0).addEq(U64.fromIntUnsafe(5));

//         //Propagate carry
//         this.#a.at(1).addEq(U64.fromIntUnsafe(this.#a.at(0).high));//Same as >>32
//         this.#a.at(2).addEq(U64.fromIntUnsafe(this.#a.at(1).high));
//         this.#a.at(3).addEq(U64.fromIntUnsafe(this.#a.at(2).high));
//         this.#a.at(4).addEq(U64.fromIntUnsafe(this.#a.at(3).high));

//         //If (a + 5) >= 2^130, form a mask with the value 0x00000000. Else, 0xffffffff
//         const mask=((this.#a.at(4).low & 0x04) >>2) -1;

//         //Select between ((a - (2^130 - 5)) % 2^128) and (a % 2^128)
//         this.#a.at(0).set(U64.fromIntUnsafe((this.#a.at(0).low & ~mask) | (b[0]&mask)));
//         this.#a.at(1).set(U64.fromIntUnsafe((this.#a.at(1).low & ~mask) | (b[1]&mask)));
//         this.#a.at(2).set(U64.fromIntUnsafe((this.#a.at(2).low & ~mask) | (b[2]&mask)));
//         this.#a.at(3).set(U64.fromIntUnsafe((this.#a.at(3).low & ~mask) | (b[3]&mask)));

//         //Add secret key
//         this.#a.at(0).addEq(U64.fromIntUnsafe(this.#s[0]));
//         this.#a.at(1).addEq(U64.fromIntUnsafe(this.#s[1]));
//         this.#a.at(2).addEq(U64.fromIntUnsafe(this.#s[2]));
//         this.#a.at(3).addEq(U64.fromIntUnsafe(this.#s[3]));

//         const ret=new Uint8Array(blockSize);
//         const r32=new Uint32Array(ret.buffer);
//         r32[0]=this.#a.at(0).low;
//         r32[1]=this.#a.at(1).low;
//         r32[2]=this.#a.at(2).low;
//         r32[3]=this.#a.at(3).low;
//         asLE.i32(ret,0,4);
//         return ret;
//     }

//     reset(): void {
//         this.#bPos=0;
//         this.#block.fill(0);
//         this.#a.zero();
//     }

//     newEmpty(): IHash {
//         const ret= new Poly1305(new Uint8Array(32));
//         ret.#r.set(this.#r);
//         ret.#s.set(this.#s);
//         return ret;
//     }

//     clone(): IHash {
//         const ret= new Poly1305(new Uint8Array(32));
//         ret.#r.set(this.#r);
//         ret.#s.set(this.#s);
//         ret.#block.set(this.#block);
//         ret.#bPos=this.#bPos;
//         ret.#a.set(this.#a);
//         return ret;
//     }
// }