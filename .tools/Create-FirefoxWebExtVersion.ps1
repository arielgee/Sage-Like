##########################################################
# Name: Create-FirefoxWebExtVersion.ps1
# Desc: Create Web extension version zip file
#

#### + Variables
$pathRoot = $PSScriptRoot + "\..\..";
$pathWebExtSource = $pathRoot + "\Sage-Like\Sage-Like";
$pathWebExtContent = $pathWebExtSource + "\*";
$pathWebExtManifest = $pathWebExtSource + "\manifest.json";
$fmtPathWebExtFile = $pathRoot + "\.publish\Sage-Like-v%1.zip"
$zipApp = "C:\Program Files\7-Zip\7z.exe"

try {
	# Remove comments from JSON before parsing
	$version = (Get-Content $pathWebExtManifest | Select-String -Pattern '^\s*//' -NotMatch | ConvertFrom-Json).version;
	$destFile = $fmtPathWebExtFile.Replace("%1", $version);

	# Compress-Archive -Path $pathWebExtContent -DestinationPath $destFile;

	$Process = Start-Process -FilePath $zipApp -ArgumentList "a", "-tzip", "`"$destFile`"", "`"$pathWebExtContent`"" -PassThru -Wait -WindowStyle Hidden;
	$PExitCode = $Process.ExitCode;

	if($PExitCode -eq 0) {
		Write-Host "[*] DONE!`n`n> File: $($destFile)`n" -ForegroundColor Green;
	} else {
		Write-Host "[*] ERROR: Process '7z.exe' terminated with exit code: $PExitCode`n" -ForegroundColor Red;
	}
}
catch {
	Write-Host "[*] Something went WRONG!`n`n> $($_)" -ForegroundColor Red;
}
