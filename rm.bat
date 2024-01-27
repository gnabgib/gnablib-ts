:: Copyright 2024 the gnablib contributors MPL-1.1
:: - Allow `rm -rf` to work in windows (by converting to rmdir /s/q)
@echo off
::setlocal EnableDelayedExpansion
setlocal
::: rm OPTS DIR
:::   OPTS Expected to be -rf (like linux remove/recursive-force)
:::   DIR Expected to be a bare directory (no leading or trailing slash) relative to current
:::
::: eg. rm -rf dist

::Need both arguments
if "%~1"=="" (
    findstr "^:::" "%~f0"&GOTO:eof
)
if "%~2"=="" (
    call:red Expecting two arguments
    findstr "^:::" "%~f0"&GOTO:eof
)

::Make sure arg 1 is valid
if NOT "%~1"=="-rf" (
    call:red Expecting opts=-rf
    findstr "^:::" "%~f0"&GOTO:eof
)

::Figure out working directory
call:cwd cwd

::Figure out folder, if it ends in a slash (\/) remove it
call:strip-trail-slash %2 fold
set "fullfold=%cwd%%fold%"

if EXIST "%fullfold%\" (
    rmdir /s /q %fullfold%
) else (
    call:red Folder not found: %fold%
)
GOTO:eof


::-------------------------------------
::strip-slash <IN: folder> <RET: corrected>
:: -removes a trailing / or \ character if found
:strip-trail-slash
setlocal
set "a=%~1"
set "last=%a:~-1%"
if "%last%" == "/" (
    set "a=%a:~0,-1%"
) else if "%last%" == "\" (
    set "a=%a:~0,-1%"
)
endlocal & set "%2=%a%"
GOTO:eof

::-------------------------------------
:: Current working directory <RET:string>
:cwd
set "%1=%~dp0"
GOTO:eof

::-------------------------------------
:: Render text in red (and then reset)
:red
echo [31m%*[0m
GOTO:eof