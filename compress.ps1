param (
    [Parameter(HelpMessage="Source directory")]
    [string]$src = "out",

    [Parameter(HelpMessage="Target directory")]
    [string]$dest = "dist",

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

function Strip-TrailSlash {
    param ($fold)
    if ($fold -match '[\\/]$') {
        return $fold.substring(0,$fold.length-1)
    }
    return $fold
}

## -- MAIN --
$sw = [Diagnostics.Stopwatch]::StartNew()

## Clean up any trailing slashes
$src=Strip-TrailSlash $src
$dest=Strip-TrailSlash $dest

if (-not (Test-Path -path "$src\*")) {
    Write-Host -fore Red "Source not found: $src"
    exit
}

Write-Host -for DarkGray "Compress $src to $dest"

$dirs = get-childitem -path $src -directory -recurse
Write-Section -sw $sw -title "Build/clear folders"
Initialize-Indicator -size $dirs.Count
for ($i=0; $i -lt $dirs.Count; $i++) {
    $mk = $dirs[$i].FullName.Replace('\'+$src+'\','\'+$dest+'\')
    if ( -not (Test-Path $mk) ) {
        mkdir $mk >$null
    } elseif ($clean) {
        Remove-Item $mk\*.*
    }
    Update-Indicator
}
Close-Indicator

$jsFiles = ls $src -r *.js
Write-Section -sw $sw -title "Minifying JS"
Initialize-Indicator -size $jsFiles.Count
# Do the work
for ($i=0; $i -lt $jsFiles.Count; $i++) {
    $jsFile = $jsFiles[$i].FullName
    $min = $jsFile.Replace('\'+$src+'\','\'+$dest+'\')
    if ( -not (Test-Path $min) ) {
        npx terser $jsFile --compress --mangle --ecma 2016 --module -o $min
    }
    Update-Indicator
}
Close-Indicator

# With types in their own folder, this isn't needed
# $typeFiles = ls $src -r *.d.ts
# Write-Section -sw $sw -title "Copying types"
# Initialize-Indicator -size $typeFiles.Count
# # Do the work
# for ($i=0; $i -lt $typeFiles.Count; $i++) {
#     $tFile = $typeFiles[$i].FullName
#     $min = $tFile.Replace('\'+$src+'\','\'+$dest+'\')
#     if ( -not (Test-Path $min) ) {
#         Copy-Item $tFile $min
#     }
#     Update-Indicator
# }
# Close-Indicator

Write-Section -sw $sw -fore Green -title "Done"
