@echo off
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
call npm install
call npm run dev:all
