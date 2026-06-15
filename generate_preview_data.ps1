$klasor = "img\model"
$cikti = "preview_data.js"
$icerik = ""

$modeller = @(
    "elektrik.glb",
    "krt.glb", # Konsol okuma hatasına karşı k*rt.glb gibi eşleşme de olabilir. Get-ChildItem ile alacağız.
    "1blend.glb"
)

$dosyalar = Get-ChildItem $klasor -Filter "*.glb"

foreach ($dosya in $dosyalar) {
    Write-Host "İşleniyor: $($dosya.Name)"
    $bytes = [System.IO.File]::ReadAllBytes($dosya.FullName)
    $base64 = [Convert]::ToBase64String($bytes)
    
    # Degisken adini dosya adindan turetelim (noktalari alt cizgi yap)
    $degiskenAdi = "GLB_" + ($dosya.Name -replace '[^a-zA-Z0-9]', '_').ToUpper()
    
    $icerik += "window.$degiskenAdi = `"$base64`";`n"
}

[System.IO.File]::WriteAllText((Join-Path (Get-Location) $cikti), $icerik, [System.Text.Encoding]::UTF8)
Write-Host "Tum modeller $cikti dosyasina yazildi!"
