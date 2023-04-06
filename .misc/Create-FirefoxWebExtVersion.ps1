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

try {
	$version = (Get-Content $pathWebExtManifest | ConvertFrom-Json).version;
	$destFile = $fmtPathWebExtFile.Replace("%1", $version);
	Compress-Archive -Path $pathWebExtContent -DestinationPath $destFile;
	Write-Host "[*] DONE!`n`n> File: $($destFile)`n" -ForegroundColor Green;
}
catch {
	Write-Host "[*] Something went WRONG!`n`n> $($_)" -ForegroundColor Red;
}
