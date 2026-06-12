@echo off
rem One-click test hosting: starts the menu server + a free Cloudflare tunnel.
rem KEEP THIS WINDOW OPEN while testing - closing it kills the public link.
rem The https://....trycloudflare.com line below is your public URL
rem (it changes every time the tunnel restarts).
title Hoorshid Menu - public test tunnel
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d D:\Hoorshid-project\menu

rem start the server minimized if port 4000 is not already serving
powershell -NoProfile -Command "try { Invoke-WebRequest http://localhost:4000/api/menu -UseBasicParsing -TimeoutSec 2 | Out-Null } catch { Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'server/index.js' -WorkingDirectory 'D:\Hoorshid-project\menu' -WindowStyle Hidden }"

echo.
echo  Server: http://localhost:4000
echo  Starting the public tunnel - look for the https://....trycloudflare.com line:
echo.

rem the request to Cloudflare sometimes times out on Iranian networks - retry up to 10 times
set tries=0
:tunnel
set /a tries+=1
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:4000
if %tries% geq 10 goto failed
echo.
echo  Tunnel dropped or could not start (attempt %tries%/10) - retrying in 5 seconds...
timeout /t 5 /nobreak >nul
goto tunnel

:failed
echo.
echo  Could not reach Cloudflare after 10 attempts. Check the internet connection
echo  and run this file again. The menu still works locally: http://localhost:4000
pause
