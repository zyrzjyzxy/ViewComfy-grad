@echo off
:: 设置字符集为 UTF-8，防止中文乱码
chcp 65001

:: ================= 配置区域 =================
:: 设置日志文件名
set LOG_FILE=startup_log.txt

:: 设置 Python 路径
:: 情况 A: 如果你是官方整合包，通常路径是 .\python_embeded\python.exe
:: 情况 B: 如果你是手动安装 (Miniconda/Venv)，通常只需写 python
set PYTHON_PATH="E:\sd\sd-webui-aki-v4.8\python\python.exe"

:: 设置启动参数 (根据你的毕设需求已添加 --listen)
:: --listen: 允许局域网/外部程序访问
:: --port 8188: 指定端口
set ARGS=main.py --port 8188
:: ===========================================

echo.
echo 正在准备启动 ComfyUI...
echo ---------------------------------------

:: 1. 记录时间到日志文件
:: ">>" 符号表示追加内容，不会覆盖旧记录
echo ================================================== >> %LOG_FILE%
echo [启动记录] 启动时间: %date% %time% >> %LOG_FILE%
echo [系统信息] 执行命令: %PYTHON_PATH% %ARGS% >> %LOG_FILE%

:: 2. 在控制台显示反馈
echo 已将启动时间记录到 %LOG_FILE%
echo 正在执行: %PYTHON_PATH% %ARGS%
echo.

:: 3. 执行启动命令
:: 这里的 %* 允许你在运行脚本时额外手动添加参数
%PYTHON_PATH% %ARGS% %*

:: 4. 脚本结束暂停，防止报错时窗口秒关看不到错误信息
pause