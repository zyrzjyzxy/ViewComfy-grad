@echo off
:: 设置字符集为 UTF-8，防止中文乱码
chcp 65001 >nul

echo ========================================================
echo             ViewComfy + Heavy ComfyUI 启动
echo ========================================================

:: ----------------------------------------------------------
:: 1. 启动 Heavy ComfyUI (新窗口)
:: ----------------------------------------------------------
set "COMFY_DIR=D:\AIGC\ComfyUI"
set "COMFY_PYTHON=D:\AIGC\python_embeded\python.exe"
set "COMFY_PORT=8188"
:: ComfyUI 启动参数（可选）：--lowvram / --medvram / --disable-smart-memory / --fp16-vae / --force-fp16
:: 推荐（8-12GB）：--lowvram --fp16-vae --force-fp16 --disable-smart-memory  （低显存且压内存）
:: 大 VAE（Flux/Wan/SDXL）：优先包含 --fp16-vae，若异常可移除或切换 --medvram
set "COMFY_ARGS=--windows-standalone-build --lowvram --fp16-vae --force-fp16 --disable-smart-memory --disable-cuda-malloc --cpu-vae"

echo [1/2] 正在启动 Heavy ComfyUI...
echo       目标路径: %COMFY_DIR%

if exist "%COMFY_DIR%" (
	if exist "%COMFY_PYTHON%" (
		echo [INFO] 使用指定 Python: %COMFY_PYTHON%
	) else (
		echo [WARN] 未找到指定 Python，改用系统 python
		set "COMFY_PYTHON=python"
	)

	start "ComfyUI Heavy Server" /D "%COMFY_DIR%" cmd /k """%COMFY_PYTHON%"" ""%COMFY_DIR%\main.py"" --port %COMFY_PORT% %COMFY_ARGS%"
	echo [INFO] 等待 ComfyUI 启动...
	@REM timeout /t 120 /nobreak >nul
	@REM start "" "http://127.0.0.1:%COMFY_PORT%"
) else (
	echo [ERROR] 未找到 Heavy ComfyUI 目录 "%COMFY_DIR%"
	echo         请修改脚本中的 COMFY_DIR 后再试。
)

echo.

:: ----------------------------------------------------------
:: 2. 启动 ViewComfy (当前窗口)
:: ----------------------------------------------------------
echo [2/2] 正在启动 ViewComfy...
echo       当前目录: %~dp0

cd /d "%~dp0"

if not exist "node_modules" (
	echo [INFO] 初次运行？正在安装项目依赖...
	call npm install
)

@REM start "" "http://127.0.0.1:3000"
call npm run dev

pause