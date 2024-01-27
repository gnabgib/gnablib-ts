:: This batch file just serves to call the ps1 file which NPM won't by default
:: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies?view=powershell-7.4
@powershell -NoProfile -ExecutionPolicy RemoteSigned -Command ./compress.ps1 %*
::@powershell -NoProfile -ExecutionPolicy Unrestricted -Command ./compress.ps1 