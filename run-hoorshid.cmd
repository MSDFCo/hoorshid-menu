@echo off
rem One-click test hosting: starts the menu server + a free Cloudflare tunnel.
rem Keep this window open while testing. The public URL appears below —
rem note it changes every time the tunnel restarts.
title Hoorshid Menu - public test tunnel
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d D:\Hoorshid-project\menu

rem start the server minimized if port 4000 is not already serving
powershell -NoProfile -Command "try { Invoke-WebRequest http://localhost:4000/api/menu -UseBasicParsing -TimeoutSec 2 | Out-Null } catch { Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'server/index.js' -WorkingDirectory 'D:\Hoorshid-project\menu' -WindowStyle Hidden }"

echo.
echo  Server: http://localhost:4000
echo  Starting the public tunnel - your public URL is the https://....trycloudflare.com line below:
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:4000
