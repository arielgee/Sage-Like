##########################################################
# Name: Pack-CssFiles.ps1
# Desc: What he said.
#

#### + Variables
$zip = "C:\Program Files\7-Zip\7z.exe"
$pathRoot = $PSScriptRoot + "\..\..";
$cssFilesFolder = $pathRoot + "\Sage-Like\.customFeedPreview"
$cssFilesFilter = $cssFilesFolder + "\sl-*.css"
$outFile = $cssFilesFolder + "\sl-customFeedPreview-CSS-files.zip"


#### + Presentation
Write-Host "`n$(($MyInvocation).MyCommand) - Pack CSS files";

#### + Check exists
if(-not (Test-Path $cssFilesFilter -PathType Leaf)) {
	Write-Host "`n`nERROR: Not a single CSS file was found. (filter: '$cssFilesFilter')`n";
	exit;
}

#### + Delete old file
if(Test-Path $outFile -PathType Leaf) {
	Remove-Item $outFile;
}

#### + Packing
Write-Host "`nPacking...";
$Process = Start-Process -FilePath $zip -ArgumentList "a", "-tzip", "`"$outFile`"", "`"$cssFilesFilter`"" -PassThru -Wait -WindowStyle Hidden;
$PExitCode = $Process.ExitCode;

if($PExitCode -eq 0) {
	Write-Host "`nSuccessfully Packed`n-------------------";
	$null = Start-Process -NoNewWindow -FilePath $zip -ArgumentList "l", "`"$outFile`"" -PassThru -Wait;
} else {
	Write-Host "`nERROR: Process '7z.exe' terminated with exit code: $PExitCode`n";
}
