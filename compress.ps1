param (
    [Parameter(HelpMessage="Clean release directory first")]
    [Switch]$clean = $false
)

# Build a progress bar [<sp>] where there's a space for each element
function Initialize-Indicator {
    param ($size)
    Write-Host -NoNewline "["
    for ($i=0; $i -lt $size; $i++) {Write-Host -NoNewline " "}
    Write-Host -NoNewline "]`r["
}
# Update progress bar with a "." instead of " " (no other output can happen after Initialize-Indicator)
function Update-Indicator {
    Write-Host -NoNewline "."
}
# End the progress bar and move on
function Close-Indicator {
    Write-Host "] "
}
# Write a section head, including timing information
function Write-Section {
    param ($sw,$title,$fore="Cyan")
    Write-Host -fore DarkGray $sw.Elapsed -NoNewline
    Write-Host -NoNewline " "
    Write-host $title -fore $fore
}


## -- MAIN --
$sw = [Diagnostics.Stopwatch]::StartNew()

$dirs = get-childitem dist -directory -recurse
Write-Section -sw $sw -title "Build/clear folders"
Initialize-Indicator -size $dirs.Count
for ($i=0; $i -lt $dirs.Count; $i++) {
    $mk = $dirs[$i].FullName.Replace('\dist\','\release\')
    if ( -not (Test-Path $mk) ) {
        mkdir $mk >$null
    } elseif ($clean) {
        Remove-Item $mk\*.*
    }
    Update-Indicator
}
Close-Indicator

$jsFiles = ls dist -r *.js
Write-Section -sw $sw -title "Minifying JS"
Initialize-Indicator -size $jsFiles.Count
# Do the work
for ($i=0; $i -lt $jsFiles.Count; $i++) {
    $src = $jsFiles[$i].FullName
    $min = $src.Replace('\dist\','\release\')
    if ( -not (Test-Path $min) ) {
        npx terser $src --compress --mangle --ecma 2016 --module -o $min
    }
    Update-Indicator
}
Close-Indicator

$typeFiles = ls dist -r *.d.ts
Write-Section -sw $sw -title "Copying types"
Initialize-Indicator -size $typeFiles.Count
# Do the work
for ($i=0; $i -lt $typeFiles.Count; $i++) {
    $src = $typeFiles[$i].FullName
    $min = $src.Replace('\dist\','\release\')
    if ( -not (Test-Path $min) ) {
        Copy-Item $src $min
    }
    Update-Indicator
}
Close-Indicator

Write-Section -sw $sw -fore Green -title "Done"
