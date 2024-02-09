
## Development

Tests are written using the swift [uvu](https://github.com/lukeed/uvu) test runner /w [uvu/assert](https://github.com/lukeed/uvu/blob/master/docs/api.assert.md)

### Linting
You may need eslint globally installed:
`npm install -g eslint`

Make sure dependencies (untracked) are up to date
`npm install --no-save @typescript-eslint/eslint-plugin`

And lint:`npm run lint`
Note this uses `npx` so you can't use pnpm here (alt: `pnpm exec eslint \"src/**/*.{js,ts}\"`)



### Test

```bash
npm run test 
```
Output is inline, suitable for CI type processes.

```bash
npm run test:deep
```
Output is inline, should be run on all commits, takes a bit longer than test.

```bash
npm run test:deeper
```
Output is inline, for testing intricate aspects, only run when you need to confirm almost exhaustively.

#### Coverage

```bash
npm run cover
```
Output is inline.  Coverage is configured by `.c8rc` which includes **all** files in `./src`, except
interfaces (`interfaces/I*.ts`), and drops and reports of files with 100% coverage (reduce visual clutter)

#### Coverage-Report
```bash
npm run cover:report
```
Artifacts will be output as HTML into `/_o/cover/**` (excluded from git)


### Build

```bash
npm run build
```
JS will be output into `/_o/out/**` while type definitions wil lbe output to `/_o/type/**` (both excluded from git)

#### Full build

```bash
npm run build:full
```

This will generate a coverage report (`/_o/cover/index.html`), build documentation (`/_o/doc/index.html`),
build from source (`/_o/out`) generate types (`/_o/type`) and compress the build (`/_o/dist`)

**Update version**

```bash
npm version patch -m "Upgrade to %s, <reason>"
```
- The publish/provenance is done on github


#### Compress

```bash
npm run compress
```
Content of `/_o/out/**` will be compressed into `/_o/dist/**` (excluded from git)


### Maintenance

Currently excluded from build (from package.json):
- Since it's not complete, let's skip publishing Create-Update-Delete (CUD) features
		"./cud":"./dist/cud/index.js"

Resume after checkout
```bash
pnpm install
```

Close a issue in commit:
close/closes/closed/fix/fixes/fixed/resolve/resolves/resolved #<id>
eg closes #2

Format in VSCode: CTRL+SHIFT+P: Format  

DEPS:
- Show outdated packages
npm outdated
- Update /w package.json/lock (only minor/patch)
npm update --save
- Update /w package.json/lock for major
npm install <package>@<major#>
eg: npm install c8@8
- Find a package owner
npm owner ls <pkgname>

TypeDoc plug coverage:
`npm install --save false typedoc-plugin-coverage`
- Doesn't add it to package.json, you can't add it globally (the runtime doesn't find them)

List globally installed packages:
`npm ls -g`
`pnpm ls -g`
- Note the output can be different (they have different storage locations)

### Values

`get [Symbol.toStringTag](): string`
The result of which is included in `Object.prototype.toString.call(obj)`, you'll also
see it embedded in console logs by default toStringTag returns "Object" on an object, and the output starts "object"
you've probably seen `object Object`

```ts
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
[consoleDebugSymbol](/*depth, options, inspect*/):string {}
```
The result of which is included in `console.log(obj)` (in Node) or `util.inspect(obj)`

### Floating point compare

If you have large numbers with high resolution, you may start to see floating point error in comparisons
eg 0.3!=0.3.  One way to combat that is use `toPrecision` and include significant figures (left and right of decimal place)

For example in TimeOnly, there was briefly floating point error in the following comparison:
`assert.is(tm.toSeconds(),seconds);`
both are floating point numbers.  Ended up fixing that using better calculation order, but this also works:
`assert.is(tm.toSeconds().toPrecision(11),seconds.toPrecision(11));`
The maximum value is `86399.999999` since that's how many seconds are in a day (without leap seconds)
