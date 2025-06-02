@echo off
echo [VITE RESET] 개발 서버 종료 중...
taskkill /f /im node.exe > nul 2>&1

echo [VITE RESET] .vite 캐시 폴더 삭제 중...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo [VITE RESET] .vite 캐시 삭제 완료
) else (
    echo [VITE RESET] .vite 캐시가 존재하지 않음
)

echo [VITE RESET] 개발 서버 재시작...
call npm run dev
pause