##########################################################
# Name: Test-Locale.ps1
# Desc: What he said.
#

param(
	[Parameter(Mandatory=$true)]
	[string]$workspaceFolder,			#"C:\Users\arielg\DevWork\WebExtensions\Sage-Like"
	[Parameter(Mandatory=$true)]
	[ValidateSet('start', 'stop')]
	[string]$testAction
)


#### + Variables
$folderEN = Join-Path -Path ${workspaceFolder} -ChildPath "\Sage-Like\_locales\en"
$folderMask = Join-Path -Path ${workspaceFolder} -ChildPath "\Sage-Like\_locales\MASK-en"
$folderBackup = Join-Path -Path ${workspaceFolder} -ChildPath "\.en-backup-locale"
$fileXXTag = Join-Path -Path ${folderEN} -ChildPath 'locale-xx'


#### + Validations
$fldEN_Exist = Test-Path -Path ${folderEN}
$fldMask_Exist = Test-Path -Path ${folderMask}
$fileXXTag_Exist = Test-Path -Path ${fileXXTag} -PathType Leaf

if ( -not ${fldEN_Exist} ) {
	Write-Host "ERROR: '_locales\en' folder doesn't exists. Can't continue." -ForegroundColor red
	Write-Host
	exit 1
}

if ( (${testAction} -eq 'start') -and ( ${fldMask_Exist} -or ${fileXXTag_Exist} ) ) {
	Write-Host "ERROR: '_locales\MASK-en' folder already exists or 'locale-xx' file found. Can't start a new test." -ForegroundColor red
	Write-Host
	exit 1
}

if ( (${testAction} -eq 'stop') -and ( (-not ${fldMask_Exist}) -or (-not ${fileXXTag_Exist}) ) ) {
	Write-Host "ERROR: '_locales\MASK-en' folder doesn't exists or 'locale-xx' file not found. Can't stop a test." -ForegroundColor red
	Write-Host
	exit 1
}

# Create backup folder if it doesn't exist
if (-not (Test-Path -Path ${folderBackup})) {
	New-Item -Path ${folderBackup} -ItemType Directory | Out-Null
}

# Display status
if (${fldEN_Exist}) { Write-Host "Folder '_locales\en' exists." -ForegroundColor Green }
if (${fldMask_Exist}) { Write-Host "Folder '_locales\MASK-en' exists." -ForegroundColor Green }
if (${fileXXTag_Exist}) { Write-Host "File '_locales\en\locale-xx' exists." -ForegroundColor Green }
Write-Host

#### + Start test
if ($testAction -eq 'start') {

	# Backup messages.json before starting test
	$backupFile = Join-Path -Path ${folderBackup} -ChildPath "messages_$(Get-Date -Format "yyyy-MM-dd_HH-mm-ss").json"
	Copy-Item -Path (Join-Path -Path ${folderEN} -ChildPath "messages.json") -Destination ${backupFile} -Force

	# Rename '_locales\en' to '_locales\MASK-en' - create a safe copy of the original 'en' folder
	Rename-Item -Path ${folderEN} -NewName ${folderMask}

	# Copy '_locales\MASK-en' to '_locales\en' - actually the XX folder
	Copy-Item -Path ${folderMask} -Destination ${folderEN} -Recurse

	# Create 'locale-xx' tag file in XX folder
	New-Item -Path ${fileXXTag} -ItemType File -Force | Out-Null

	# Define source XX file path
	$sourceXXFile = Join-Path -Path ${folderEN} -ChildPath "messages.json"

	# Edit and replace content of messages.json in folderXX
	$content = Get-Content -Path ${sourceXXFile} -Raw
	$regex = [regex]'(\s+"message": ")(.+)(",)'
	$modifiedContent = $regex.Replace(${content}, {
    	param($match)
    	$match.Groups[1].Value + ($match.Groups[2].Value -creplace '[abcdefghijklmopqrstvwxyz]', 'x') + $match.Groups[3].Value
	})

	# Write modified content back to file
	Set-Content -Path ${sourceXXFile} -Value ${modifiedContent} -NoNewline

	Write-Host "The testing of the locale have BEGUN." -ForegroundColor Green
	Write-Host
	exit
}


#### + Stop test
if ($testAction -eq 'stop') {

	# Ensure the 'locale-xx' tag file exists in the current '_locales\en' folder
	if ( -not ${fileXXTag_Exist}) {
		Write-Host "ERROR: Tag file 'locale-xx' not found in '_locales\en'. Aborting to avoid removing the real 'en' folder." -ForegroundColor Red
		Write-Host
		exit 1
	}

	# Delete '_locales\en' folder that is actually the XX folder
	Remove-Item -Path ${folderEN} -Recurse -Force

	# Rename '_locales\MASK-en' back to '_locales\en' - restore the original 'en' folder
	Rename-Item -Path ${folderMask} -NewName ${folderEN}

	Write-Host "The testing of the locale has been stopped." -ForegroundColor Green
	Write-Host
	exit
}


Write-Host "WHAT THE FUCK AM I DOING HERE???" -ForegroundColor Red
Write-Host
