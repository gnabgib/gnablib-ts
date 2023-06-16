# Create min directories
$dirs = get-childitem dist -directory -recurse #| foreach-object { "$_" }
for ($i=0; $i -lt $dirs.Count; $i++) {
    $mk = $dirs[$i].FullName.Replace('\dist\','\min\')
    if ( -not (Test-Path $mk) ) {
        mkdir $mk
    }
}

# Minify all JS files in dist
$jsFiles = ls dist -r *.js
for ($i=0; $i -lt $jsFiles.Count; $i++) {
    $src = $jsFiles[$i].FullName
    $min = $src.Replace('\dist\','\min\')
    #npx terser $src -o $min
    npx terser $src --compress --mangle --ecma 2016 --module -o $min
    echo $src
}

# Copy the .d.ts files across
$typeFiles = ls dist -r *.d.ts
for ($i=0; $i -lt $typeFiles.Count; $i++) {
    $src = $typeFiles[$i].FullName
    $min = $src.Replace('\dist\','\min\')
    Copy-Item $src $min
    echo $src
}
