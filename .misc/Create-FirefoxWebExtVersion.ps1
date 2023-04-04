##########################################################
# Name: Create-FirefoxWebExtVersion.ps1
# Desc: Create Web extension version zip file
#

#### + Variables
$pathWebExtSource = "c:\Users\arielg\DevWork\WebExtensions\Sage-Like\Sage-Like";
$pathWebExtContent = $pathWebExtSource + "\*";
$pathWebExtManifest = $pathWebExtSource + "\manifest.json";
$fmtPathWebExtFile = "c:\Users\arielg\DevWork\WebExtensions\.publish\Sage-Like-v%1.zip"

try {
	$version = (Get-Content $pathWebExtManifest | ConvertFrom-Json).version;
	$destFile = $fmtPathWebExtFile.Replace("%1", $version);
	Compress-Archive -Path $pathWebExtContent -DestinationPath $destFile;
	Write-Host " [*] DONE!`n`n   > File: $($destFile)`n" -ForegroundColor Green;
}
catch {
	Write-Host " [*] Something went WRONG!`n" -ForegroundColor Red;
}
