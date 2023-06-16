#!/bin/sh

# Create min directories
for d in $(find dist -type d); do
	MK=$(echo $d | sed -e 's/^dist/min/g')
	if [ ! -d "$MK" ]; then
		mkdir $MK
	fi
done

# Compress the js files
for j in $(find dist -type f -name "*.js"); do
	MK=$(echo $j | sed -e 's/^dist/min/g')
	npx terser $j --compress --mangle --ecma 2016 --module -o $MK
	echo $j
done

# Copy the .d.ts files across
for t in $(find dist -type f -name "*.d.ts"); do
	MK=$(echo $t | sed -e 's/^dist/min/g')
	cp $t $MK
	echo $t
done