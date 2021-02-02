##########################################################
# Name: Pack-CssFiles.ps1
# Desc: What he said.
#

#### + Variables
$zip = "C:\Program Files\7-Zip\7z.exe"
$cssFilesFilter = $PSScriptRoot + "\sl-*.css"
$outFile = $PSScriptRoot + "\sl-customFeedPreview-CSS-files.zip"


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
Write-Host "`n7z.exe exit code: $(($Process).ExitCode)";
Write-Host ".7z file size: $((Get-Item $outFile).length) bytes";
