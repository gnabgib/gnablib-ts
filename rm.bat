::We assume `rm -rf TARG` is provided
@echo off
IF EXIST "%2\NUL" rmdir /s /q %2