@echo off
cd /d "%~dp0"
start "" http://localhost:5517
node servidor.mjs
