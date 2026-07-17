# Noxis Hub Release Script
# Run this: .\scripts\release.ps1
param(
  [Parameter(Mandatory=$true)]
  [string]$Version,
  [string]$Channel = "stable"
)

Write-Host "Releasing Noxis Hub v$Version on $Channel channel" -ForegroundColor Cyan

# Step 1: Update version in package.json
$pkg = Get-Content package.json | ConvertFrom-Json
$pkg.version = $Version
$pkg | ConvertTo-Json -Depth 100 | Set-Content package.json
Write-Host "✓ Version bumped to $Version"

# Step 2: Git commit version bump
git add package.json
git commit -m "release: v$Version"
git tag "v$Version"
Write-Host "✓ Git tag created"

# Step 3: Build Next.js
Write-Host "Building Next.js..."
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed!" -ForegroundColor Red
  exit 1
}
Write-Host "✓ Next.js built"

# Step 4: Build Electron
Write-Host "Building Electron packages..."
npm run electron:build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Electron build failed!" -ForegroundColor Red
  exit 1
}
Write-Host "✓ Electron built"

# Step 5: List output files
Write-Host "`nBuild output:" -ForegroundColor Yellow
Get-ChildItem dist | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

# Step 6: Upload to Cloudflare R2
Write-Host "`nUploading to R2..." -ForegroundColor Cyan
Write-Host "Upload these files to R2 bucket/updates/$Channel/"
Get-ChildItem dist | Where-Object {
    $_.Name -like "*.exe" -or
    $_.Name -like "*.yml" -or
    $_.Name -like "*.blockmap"
  } | ForEach-Object {
    Write-Host "  → $($_.Name) ($([math]::Round($_.Length/1MB, 1)) MB)"
  }

Write-Host "`n✓ Release v$Version ready for upload" -ForegroundColor Green
Write-Host "After uploading, users will auto-update within 4 hours." -ForegroundColor Gray

# Step 7: Push git tag
git push origin "v$Version"
Write-Host "✓ Git tag pushed"
