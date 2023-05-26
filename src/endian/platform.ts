// IBM s390x is big endian
// https://github.com/multiarch/qemu-user-static
// https://community.ibm.com/community/user/ibmz-and-linuxone/blogs/javier-perez1/2021/01/19/endianness-guidance-for-open-source-projects
// sudo podman run --rm --privileged docker.io/multiarch/qemu-user-static --reset -p yes
// podman run -it docker.io/s390x/ubuntu
// podman run -it docker.io/s390x/node
//  uname -m =s390x

export const isLE = (() => {
	//Since TypedArrays use system-endianness, putting 1 in a U16 will be:
	// bigEndian: 0x0001
	// littleEndian: 0x0100
	//Mapping a uint8 array over the top, we can check if the first byte is not zero (LE)
	const u16 = new Uint16Array([1]);
	const u8 = new Uint8Array(u16.buffer);
	return u8[0] > 0;

	//JS seems to assume platform can only be little or big (by only using boolean endian flags)
	// .. presumably any implementations using middle will accommodate this
})();

const invert={
	/**
	 * Maybe switch byte order
	 * @param b Byte array
	 * @param pos Position of first byte
	 */
	i16(b:Uint8Array,pos=0):void {
		const t=b[pos];b[pos]=b[pos+1];b[pos]=t;
	},
	/**
	 * Maybe switch byte order
	 * @param b Byte array
	 * @param pos Position of first byte
	 */
	i32(b:Uint8Array,pos=0):void {
		let t:number;
		t=b[pos];b[pos]=b[pos+3];b[pos+3]=t;
		t=b[pos+1];b[pos+1]=b[pos+2];b[pos+2]=t;
	},
	/**
	 * Maybe switch byte order
	 * @param b Byte array
	 * @param pos Position of first byte
	 */
	i64(b:Uint8Array,pos=0):void {
		let t:number;
		t=b[pos];b[pos]=b[pos+7];b[pos+7]=t;
		t=b[pos+1];b[pos+1]=b[pos+6];b[pos+6]=t;
		t=b[pos+2];b[pos+2]=b[pos+5];b[pos+5]=t;
		t=b[pos+3];b[pos+3]=b[pos+4];b[pos+4]=t;
	},
}

const leave={
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	i16(_b:Uint8Array,_pos=0):void {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	i32(_b:Uint8Array,_pos=0):void {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	i64(_b:Uint8Array,_pos=0):void {},
}

/**
 * If platform is LE, this does nothing.  Otherwise bytes are switched from BE order
 */
export const asLE=isLE?leave:invert;
/**
 * If platform is BE, this does nothing.  Otherwise bytes are switched from LE order
 */
export const asBE=isLE?invert:leave;
export function asE(isBE:boolean) {return isBE?asBE:asLE}