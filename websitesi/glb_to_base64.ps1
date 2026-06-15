$ciktiYolu = "glb_data.js"

# Klasördeki tüm glb dosyalarını listele, k harfiyle başlayanı bul
$modelDizin = "img\model"
$glbDosyalari = Get-ChildItem -Path $modelDizin -Filter "*.glb"

# kürt.glb'yi bul (k ile başlayan küçük dosya)
$hedefDosya = $glbDosyalari | Where-Object { $_.Name -ne "elektrik.glb" -and $_.Name -ne "1blend.glb" } | Select-Object -First 1

if (-Not $hedefDosya) {
    Write-Host "HATA: Hedef GLB bulunamadi!" -ForegroundColor Red
    exit 1
}

Write-Host "Kullanılan dosya: $($hedefDosya.FullName)" -ForegroundColor Cyan
$bytes = [System.IO.File]::ReadAllBytes($hedefDosya.FullName)
$base64 = [Convert]::ToBase64String($bytes)
$icerik = "window.MODEL_GLB_BASE64 = `"" + $base64 + "`";"
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $ciktiYolu), $icerik, [System.Text.Encoding]::UTF8)
Write-Host "Tamamlandi: $([math]::Round($bytes.Length/1024,1)) KB -> glb_data.js" -ForegroundColor Green
