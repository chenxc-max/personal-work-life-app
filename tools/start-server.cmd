@echo off
set "NODE_EXE=%~dp0node-lts\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"
"%NODE_EXE%" "%~dp0serve.mjs" > "%~dp0server.log" 2>&1
