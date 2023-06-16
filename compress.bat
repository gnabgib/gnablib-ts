@echo off
:: This batch file just serves to call the ps1 file which NPM won't by default
powershell -NoProfile -ExecutionPolicy Unrestricted -Command ./compress.ps1