/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import fs from 'fs';
//CONFIG:
const dropPrefix="_o/";


//Get the content of package.json (it's fine that this is blocking)
const data=fs.readFileSync('package.json','utf8');
//Turn it into an object
const pkg=JSON.parse(data);

/**
 * Walk the pack.publishConfig arguments, and drop if specifically null
 * Note: You don't need to specify `publishConfig.publishConfig=null`
 * (it'll happen automatically)
 * @param {object} parent
 * @param {number} depth
 * @param {...string} keys 
 */
function pkgHandle(parent,depth,...keys) {
    const last=keys.pop();
    //If there's no last, we're at the root, let's iterate the base
    // props
    if (last===undefined) {
        Object.keys(pkg.publishConfig).map((k)=>pkgHandle(pkg,0,k));
        return;
    }
    //Stop the user from dropping the publishConfig
    // - if they do it last it's fine, but if early things get unpredictable
    if (depth===0 && last=="publishConfig") return;
    const value=keys.reduce((o,k)=>o[k],pkg.publishConfig)[last];
    if (value === null) {
        //If it's null, drop the key
        // NOTE: This has to be first since null is.. also an object
        delete parent[last];
    } else if (typeof value === "object") {
        for(const sub of Object.keys(value)) {
            pkgHandle(parent[last],depth+1, ...keys.concat(last,sub));
        }
    } else {
        //console.log(config);
        console.log(`Not sure what to do with ${keys.join('.')}.${last}=${value}`);
    }
}

/**
 * Confirm and drop the prefix
 * @param {number} idx 
 */
function pkgFileHandle(idx) {
    const file=pkg.files[idx];
    if (!file.startsWith(dropPrefix)) {
        console.log(`Not sure how to deal with file[${idx}]: ${file}`);
    } else {
        pkg.files[idx]=file.substring(dropPrefix.length);
    }
}

/**
 * Confirm and drop the prefix from the paths
 * @param {string} exp 
 */
function pkgExportHandle(exp) {
    for(const key of Object.keys(pkg.exports[exp])) {
        const file=pkg.exports[exp][key];
        if (!file.startsWith("./"+dropPrefix)) {
            console.log(`Not sure how to deal with export.${exp}: ${file}`);
        } else {
            pkg.exports[exp][key]="./"+file.substring(dropPrefix.length+2);
        }
    }
}

// -- -- -- -- -- -- -- -- -- -- -- --
//1. Update package with publishConfig commands
pkgHandle();
//Remove the publishConfig itself (this cannot be in)
delete pkg.publishConfig;

// -- -- -- -- -- -- -- -- -- -- -- --
//2. Update files to new location
for (let i=0;i<pkg.files.length;i++) {
    pkgFileHandle(i);
}

// -- -- -- -- -- -- -- -- -- -- -- --
//3. Update exports to new location
for(const exp of Object.keys(pkg.exports)) {
    pkgExportHandle(exp);
}

// -- -- -- -- -- -- -- -- -- -- -- --
//4. Write out the update package.json
fs.writeFileSync("./_o/package.json",JSON.stringify(pkg,null,2),'utf8');

// -- -- -- -- -- -- -- -- -- -- -- --
//5. Copy LICENSE and README.md
fs.copyFileSync("./LICENSE","./_o/LICENSE");
fs.copyFileSync("./README.md","./_o/README.md");

// -- -- -- -- -- -- -- -- -- -- -- --
