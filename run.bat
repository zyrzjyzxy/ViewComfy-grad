@echo off
:: 设置命令行编码为 UTF-8，防止中文乱码
chcp 65001 >nul

echo ========================================================
echo             ViewComfy 联合启动脚本（防黑图优化版）
echo ========================================================

:: ----------------------------------------------------------
:: 1. 启动 ComfyUI (新窗口)
:: ----------------------------------------------------------
set "COMFY_DIR=E:\sd\crazy\ComfyUI"
set "COMFY_PYTHON=E:\sd\sd-webui-aki-v4.8\python\python.exe"

:: 防黑图核心参数（SDXL + ControlNet 专用）：
:: --fp32-vae      : VAE 强制 fp32（防 NaN/黑图，最稳）
:: --windows-standalone-build : portable 环境必须
:: --disable-cuda-malloc : 防 CUDA 内存分配 bug
:: --disable-smart-memory : 关闭智能内存（有时更稳）
:: 如果还是黑，可加 --cpu-vae（VAE offload 到 CPU，超稳但慢）
:: 如果显存很足，想加速，可试 --fp16-unet（但先别加）
:: set "COMFY_ARGS=--windows-standalone-build --fp32-vae --disable-cuda-malloc --disable-smart-memory"

:: 如果你显卡是 RTX 30/40 系 + 想更激进防黑，可换成：
set "COMFY_ARGS=--windows-standalone-build --force-fp32 --disable-smart-memory --disable-cuda-malloc --fp32-vae"

echo [1/2] 正在启动 ComfyUI...
echo       目标路径: %COMFY_DIR%
echo       使用参数: %COMFY_ARGS%

if exist "%COMFY_DIR%" (
    if exist "%COMFY_PYTHON%" (
        echo [INFO] 使用指定 Python: %COMFY_PYTHON%
    ) else (
        echo [WARN] 未找到指定 Python，改用系统 python
        set "COMFY_PYTHON=python"
    )

    :: 直接用指定 Python 启动，指定 main.py 绝对路径避免 cwd 误判
    start "ComfyUI Server" /D "%COMFY_DIR%" cmd /k """%COMFY_PYTHON%"" ""%COMFY_DIR%\main.py"" --port 8188 %COMFY_ARGS%"
    echo [INFO] 等待 ComfyUI 启动...
    timeout /t 30 /nobreak >nul
    :: 自动打开 ComfyUI 页面
    start "" "http://127.0.0.1:8188"
) else (
    echo [ERROR] 警告：未找到 ComfyUI 目录 "%COMFY_DIR%"
    echo         请确认路径是否存在，或者手动修改本脚本中的 COMFY_DIR 变量。
)

echo.

:: ----------------------------------------------------------
:: 2. 启动 ViewComfy (当前窗口)
:: ----------------------------------------------------------
echo [2/2] 正在启动 ViewComfy...
echo       当前目录: %~dp0

cd /d "%~dp0"

:: 检查依赖是否存在，简单的检查
if not exist "node_modules" (
    echo [INFO] 初次运行？正在安装项目依赖...
    call npm install
)

:: 启动 Next.js 开发服务器
start "" "http://127.0.0.1:3000"
call npm run dev

pause