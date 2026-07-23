$version = "v1.9.0"
$arch = "windows_amd64"
$url = "https://github.com/bluenviron/mediamtx/releases/download/$version/mediamtx_${version}_${arch}.zip"
$dest = "resources\mediamtx"

New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host "[mediamtx] Downloading $url..."
Invoke-WebRequest -Uri $url -OutFile "$dest\mediamtx.zip" -UseBasicParsing

Write-Host "[mediamtx] Extracting..."
Expand-Archive -Path "$dest\mediamtx.zip" -DestinationPath $dest -Force
Remove-Item "$dest\mediamtx.zip" -Force

# Keep only the binary — discard sample configs
Get-ChildItem $dest | Where-Object { $_.Name -ne "mediamtx.exe" } | Remove-Item -Force -ErrorAction SilentlyContinue

if (Test-Path "$dest\mediamtx.exe") {
    $size = [math]::Round((Get-Item "$dest\mediamtx.exe").Length / 1MB, 1)
    Write-Host "[mediamtx] ✓ Binary ready at $dest\mediamtx.exe ($size MB)"
} else {
    Write-Host "[mediamtx] ✗ Download failed — binary not found"
    exit 1
}
