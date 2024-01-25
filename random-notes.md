
## Development

Tests are written using the swift [uvu](https://github.com/lukeed/uvu) test runner /w [uvu/assert](https://github.com/lukeed/uvu/blob/master/docs/api.assert.md)

```base
npm test 
```

Content will be output into `/dist/**` and then compressed into `/release/**`

```bash
npm run build
```

Update version
```bash
npm version patch -m "Upgrade to %s, <reason>"
```
- The publish/provenance is done on github

Review code coverage
```bash
npm run test:coverage
```

Currently excluded from build (from package.json):
- Since it's not complete, let's skip publishing Create-Update-Delete (CUD) features
		"./cud":{
			"default":"./release/cud/index.js"
		},


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