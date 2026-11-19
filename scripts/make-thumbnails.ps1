<#
.SYNOPSIS
  Generates lightweight JPEG thumbnails for the collection viewer's filmstrip.

.DESCRIPTION
  The full-size artwork is only requested when it is shown on the viewer stage; the
  filmstrip uses these small copies instead. Output is written to images/thumbs/<collection>/
  with lowercase, hyphenated file names. Re-run after adding or replacing artwork, then
  update the matching <template> in index.html.

  Windows only: uses System.Drawing, so no extra dependencies are required.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/make-thumbnails.ps1
#>
[CmdletBinding()]
param(
  [ValidateRange(64, 2048)] [int] $MaxSize = 400,
  [ValidateRange(1, 100)] [int] $Quality = 80
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$collections = [ordered]@{
  ghostai = "images/Gallery/GhostAI Tyler, TX - US"
  etx     = "images/Gallery/ETX Tyler, TX - US"
  jelexie = "images/Gallery/Jelexie Bakeshop"
  reldev  = "images/projects/reldev"
}

$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters 1
$encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter (
  [System.Drawing.Imaging.Encoder]::Quality, [long] $Quality
)

function ConvertTo-Slug([string] $Name) {
  return ($Name.ToLowerInvariant() -replace "[^a-z0-9]+", "-").Trim("-")
}

foreach ($collection in $collections.GetEnumerator()) {
  $sourceDirectory = Join-Path $root $collection.Value
  $targetDirectory = Join-Path $root "images/thumbs/$($collection.Key)"
  New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null

  $files = Get-ChildItem -LiteralPath $sourceDirectory -File |
    Where-Object { $_.Extension -match "^\.(jpe?g|png)$" }

  foreach ($file in $files) {
    $output = Join-Path $targetDirectory ((ConvertTo-Slug $file.BaseName) + ".jpg")
    $source = [System.Drawing.Image]::FromFile($file.FullName)
    try {
      # Use doubles explicitly; Math.Min(int, double) would otherwise truncate the scale to 0.
      $scale = [Math]::Min([double] 1, [double] $MaxSize / [Math]::Max($source.Width, $source.Height))
      $width = [int] [Math]::Round($source.Width * $scale)
      $height = [int] [Math]::Round($source.Height * $scale)

      $bitmap = New-Object System.Drawing.Bitmap $width, $height
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        # JPEG has no alpha channel; flatten any transparency onto white.
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.DrawImage($source, 0, 0, $width, $height)
        $bitmap.Save($output, $jpeg, $encoderParameters)
      }
      finally {
        $graphics.Dispose()
        $bitmap.Dispose()
      }
    }
    finally {
      $source.Dispose()
    }

    $size = [Math]::Round((Get-Item -LiteralPath $output).Length / 1KB)
    Write-Host ("{0,-8} {1} ({2}x{3}, {4} KB)" -f $collection.Key, (Split-Path -Leaf $output), $width, $height, $size)
  }
}
