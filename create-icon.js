// Essence On 아이콘 생성 (node create-icon.js)
// PowerShell System.Drawing으로 PNG 렌더링 → ICO 패키징
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const psTmp = path.join(os.tmpdir(), 'essenceon_icon.ps1');

const psScript = `
Add-Type -AssemblyName System.Drawing

function Make-Icon {
    param([int]$size, [string]$outPath, [bool]$badge)

    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode    = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint= [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # 어두운 원형 배경
    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,20,20,40))
    $g.FillEllipse($bg, 0, 0, $size-1, $size-1)

    # 파란 테두리 링
    $ring = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,0,180,216), [float]($size*0.04))
    $off  = [int]($size*0.025)
    $g.DrawEllipse($ring, $off, $off, $size-1-$off*2, $size-1-$off*2)

    # "A" 글자
    $fA  = New-Object System.Drawing.Font('Segoe UI', ($size*0.56), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $bA  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,0,180,216))
    $sf  = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rA  = New-Object System.Drawing.RectangleF(0, -($size*0.08), $size, $size)
    $g.DrawString('A', $fA, $bA, $rA, $sf)

    if ($badge) {
        # "on" 뱃지 (우하단, 초록)
        $fOn  = New-Object System.Drawing.Font('Segoe UI', ($size*0.20), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $bOn  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,74,222,128))
        $g.DrawString('on', $fOn, $bOn, ($size*0.53), ($size*0.68))
    }

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Make-Icon -size 256 -outPath "$env:TEMP\essenceon_256.png" -badge $true
Make-Icon -size 48  -outPath "$env:TEMP\essenceon_48.png"  -badge $true
Make-Icon -size 32  -outPath "$env:TEMP\essenceon_32.png"  -badge $true
Make-Icon -size 16  -outPath "$env:TEMP\essenceon_16.png"  -badge $true
Write-Output "done"
`;

fs.writeFileSync(psTmp, psScript, 'utf8');

try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psTmp}"`, { stdio: 'pipe' });
} catch (e) {
    console.error('PowerShell 실패:', e.message);
    process.exit(1);
}

// ── PNG 4개를 ICO로 패키징 ──
const sizes  = [256, 48, 32, 16];
const pngs   = sizes.map(s => {
    const p = path.join(os.tmpdir(), `essenceon_${s}.png`);
    return fs.readFileSync(p);
});

// ICO 헤더 (6 bytes) + 디렉터리 엔트리 × 4 (각 16 bytes) + PNG 데이터
const COUNT    = sizes.length;
const DIR_OFF  = 6 + COUNT * 16;

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);      // reserved
header.writeUInt16LE(1, 2);      // type: ICO
header.writeUInt16LE(COUNT, 4);  // 이미지 수

let dataOffset = DIR_OFF;
const entries  = [];
for (let i = 0; i < COUNT; i++) {
    const e = Buffer.alloc(16);
    const sz = sizes[i];
    e[0] = sz === 256 ? 0 : sz; // 256은 0으로 표기
    e[1] = sz === 256 ? 0 : sz;
    e[2] = 0;  // 팔레트 없음
    e[3] = 0;  // reserved
    e.writeUInt16LE(1,   4);
    e.writeUInt16LE(32,  6);
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(dataOffset,    12);
    dataOffset += pngs[i].length;
    entries.push(e);
}

const ico = Buffer.concat([header, ...entries, ...pngs]);
const icoPath = path.join(__dirname, 'icon.ico');
fs.writeFileSync(icoPath, ico);

// tray용 icon.png (32×32)
fs.copyFileSync(path.join(os.tmpdir(), 'essenceon_32.png'), path.join(__dirname, 'icon.png'));

// 임시 파일 정리
[psTmp, ...sizes.map(s => path.join(os.tmpdir(), `essenceon_${s}.png`))].forEach(f => {
    try { fs.unlinkSync(f); } catch {}
});

console.log(`아이콘 생성 완료: ${icoPath} (${ico.length} bytes)`);
