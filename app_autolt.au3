; Disable AutoIt3Wrapper directives (optional)
#AutoIt3Wrapper_Run_Obfuscator=n

; Run the batch file without displaying the command prompt
Run("C:\Users\Jjay\Desktop\ThesisProject\script.bat", "", @SW_HIDE)

; Wait for the script to finish (optional)
ProcessWaitClose("script.bat")

; Exit the AutoIt script
Exit
