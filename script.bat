@echo off
setlocal

:: Define the Python version to install (you can change this as needed)
set PYTHON_VERSION=3.13.0
set PYTHON_INSTALLER=python-%PYTHON_VERSION%a1-amd64.exe

:: Define the name of your requirements.txt file and Flask application script
set REQUIREMENTS_FILE=requirements.txt
set APP_SCRIPT=app.py

:: Download and install Python
echo Installing Python %PYTHON_VERSION%...
if not exist %PYTHON_INSTALLER% (
    curl -o %PYTHON_INSTALLER% https://www.python.org/ftp/python/%PYTHON_VERSION%/%PYTHON_INSTALLER%
)
start /wait %PYTHON_INSTALLER% /passive

:: Install Python packages from requirements.txt
echo Installing Python packages...
python -m pip install --upgrade python
python -m ensurepip --default-pip
pip install -r %REQUIREMENTS_FILE%

:: Run your Flask application
echo Running your Flask application...
python %APP_SCRIPT%

:: Clean up the Python installer (optional)
del %PYTHON_INSTALLER%

endlocal
