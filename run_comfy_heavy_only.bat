@echo off
:: 设置字符集为 UTF-8，防止中文乱码
chcp 65001 >nul

echo ========================================================
echo             ComfyUI 独立启动脚本 (Heavy 配置)
echo ========================================================

:: ----------------------------------------------------------
:: 路径与参数配置 (来源于 run_heavy.bat)
:: ----------------------------------------------------------
set "COMFY_DIR=D:\AIGC\ComfyUI"
set "COMFY_PYTHON=D:\AIGC\python_embeded\python.exe"
set "COMFY_PORT=8188"

:: 显存优化：尝试解决 CUDA OOM 碎片化问题
set "PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True"

:: 参数：智能显存优化模式 (增加 --cpu-vae 以应对 6GB 显存)
set "COMFY_ARGS=--windows-standalone-build --lowvram --fp16-vae --force-fp16 --disable-cuda-malloc --cpu-vae"

echo [INFO] 正在检查环境...
echo        目录: %COMFY_DIR%

if not exist "%COMFY_DIR%" (
    echo [ERROR] 错误：找不到 ComfyUI 目录 "%COMFY_DIR%"
    echo         请检查 run_heavy.bat 中的路径是否正确。
    pause
    exit /b
)

if exist "%COMFY_PYTHON%" (
    echo [INFO] 使用指定 Python: %COMFY_PYTHON%
) else (
    echo [WARN] 未找到指定 Python，尝试调用系统 python
    set "COMFY_PYTHON=python"
)

echo [INFO] 正在以 Heavy 配置启动 ComfyUI (新窗口)...
echo        端口: %COMFY_PORT%
echo        参数: %COMFY_ARGS%
echo.

:: 使用 start 启动新终端运行，并保持原窗口关闭或继续
start "ComfyUI Heavy Server" /D "%COMFY_DIR%" cmd /k """%COMFY_PYTHON%"" ""%COMFY_DIR%\main.py"" --port %COMFY_PORT% %COMFY_ARGS%"

echo [SUCCESS] ComfyUI 已在独立窗口启动。
timeout /t 3
exit
