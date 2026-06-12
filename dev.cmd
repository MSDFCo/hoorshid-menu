@echo off
rem Dev launcher used by the preview tool — ensures Node is on PATH.
set "PATH=C:\Program Files\nodejs;%PATH%"
rem The preview tool injects PORT for the client; Express must keep its own port.
set "PORT="
call npm run dev
