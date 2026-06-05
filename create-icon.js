'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const psTmp = path.join(os.tmpdir(), 'essenceon_create_icon.ps1');

const psScript = `
Add-Type -AssemblyName System.Drawing

function New-RoundRectPath([float]$x,[float]$y,[float]$w,[float]$h,[float]$r) {
    $d = [float]($r * 2.0)
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc([System.Drawing.RectangleF]::new($x, $y, $d, $d), 180, 90)
    $p.AddArc([System.Drawing.RectangleF]::new($x + $w - $d, $y, $d, $d), 270, 90)
    $p.AddArc([System.Drawing.RectangleF]::new($x + $w - $d, $y + $h - $d, $d, $d), 0, 90)
    $p.AddArc([System.Drawing.RectangleF]::new($x, $y + $h - $d, $d, $d), 90, 90)
    $p.CloseFigure()
    return $p
}

function Fill-Round([System.Drawing.Graphics]$g,[float]$x,[float]$y,[float]$w,[float]$h,[float]$r,[System.Drawing.Brush]$br) {
    $p = New-RoundRectPath $x $y $w $h $r
    $g.FillPath($br, $p)
    $p.Dispose()
}

function Draw-Icon([int]$sz,[string]$out) {
    [float]$S = [float]$sz
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear([System.Drawing.Color]::Transparent)

    $cBg1 = [System.Drawing.Color]::FromArgb(255, 50, 35, 126)
    $cBg2 = [System.Drawing.Color]::FromArgb(255, 113, 88, 219)
    $cFace = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $cLilac = [System.Drawing.Color]::FromArgb(255, 126, 73, 226)
    $cLilac2 = [System.Drawing.Color]::FromArgb(255, 172, 139, 255)
    $cSmile = [System.Drawing.Color]::FromArgb(255, 118, 71, 215)
    $cCheek = [System.Drawing.Color]::FromArgb(95, 255, 132, 182)
    $cOn = [System.Drawing.Color]::FromArgb(255, 24, 191, 137)

    $bgBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point([int]$S, [int]$S)),
        $cBg1, $cBg2)
    Fill-Round $g 0 0 $S $S ([float]($S * 0.23)) $bgBr
    $bgBr.Dispose()

    $shine = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 255, 255, 255))
    $g.FillEllipse($shine, [float]($S * -0.18), [float]($S * -0.20), [float]($S * 0.78), [float]($S * 0.55))
    $shine.Dispose()

    $shadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 15, 9, 50))
    Fill-Round $g ([float]($S * 0.185)) ([float]($S * 0.298)) ([float]($S * 0.67)) ([float]($S * 0.49)) ([float]($S * 0.14)) $shadow
    $shadow.Dispose()

    $tailShadow = New-Object 'System.Drawing.PointF[]' 3
    $tailShadow[0] = [System.Drawing.PointF]::new([float]($S * 0.31), [float]($S * 0.742))
    $tailShadow[1] = [System.Drawing.PointF]::new([float]($S * 0.185), [float]($S * 0.895))
    $tailShadow[2] = [System.Drawing.PointF]::new([float]($S * 0.445), [float]($S * 0.742))
    $shadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 15, 9, 50))
    $g.FillPolygon($shadow, $tailShadow)
    $shadow.Dispose()

    $faceBr = New-Object System.Drawing.SolidBrush($cFace)
    Fill-Round $g ([float]($S * 0.17)) ([float]($S * 0.27)) ([float]($S * 0.67)) ([float]($S * 0.49)) ([float]($S * 0.145)) $faceBr
    $tail = New-Object 'System.Drawing.PointF[]' 3
    $tail[0] = [System.Drawing.PointF]::new([float]($S * 0.315), [float]($S * 0.735))
    $tail[1] = [System.Drawing.PointF]::new([float]($S * 0.195), [float]($S * 0.875))
    $tail[2] = [System.Drawing.PointF]::new([float]($S * 0.435), [float]($S * 0.735))
    $g.FillPolygon($faceBr, $tail)
    $faceBr.Dispose()

    $stemPen = New-Object System.Drawing.Pen($cLilac2, [float]([Math]::Max(1.0, $S * 0.018)))
    $stemPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $stemPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($stemPen, [float]($S * 0.505), [float]($S * 0.275), [float]($S * 0.505), [float]($S * 0.195))
    $stemPen.Dispose()

    $halo = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(42, 255, 255, 255))
    $g.FillEllipse($halo, [float]($S * 0.405), [float]($S * 0.065), [float]($S * 0.20), [float]($S * 0.20))
    $halo.Dispose()
    $ant = New-Object System.Drawing.SolidBrush($cLilac)
    $g.FillEllipse($ant, [float]($S * 0.445), [float]($S * 0.105), [float]($S * 0.12), [float]($S * 0.12))
    $ant.Dispose()
    $spark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 255, 255, 255))
    $g.FillEllipse($spark, [float]($S * 0.462), [float]($S * 0.123), [float]($S * 0.045), [float]($S * 0.045))
    $spark.Dispose()

    $cheek = New-Object System.Drawing.SolidBrush($cCheek)
    $g.FillEllipse($cheek, [float]($S * 0.252), [float]($S * 0.535), [float]($S * 0.125), [float]($S * 0.06))
    $g.FillEllipse($cheek, [float]($S * 0.625), [float]($S * 0.535), [float]($S * 0.125), [float]($S * 0.06))
    $cheek.Dispose()

    $eyePen = New-Object System.Drawing.Pen($cLilac, [float]([Math]::Max(1.25, $S * 0.030)))
    $eyePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $eyePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawBezier($eyePen,
        [System.Drawing.PointF]::new([float]($S * 0.285), [float]($S * 0.447)),
        [System.Drawing.PointF]::new([float]($S * 0.320), [float]($S * 0.405)),
        [System.Drawing.PointF]::new([float]($S * 0.395), [float]($S * 0.405)),
        [System.Drawing.PointF]::new([float]($S * 0.430), [float]($S * 0.447)))
    $g.DrawBezier($eyePen,
        [System.Drawing.PointF]::new([float]($S * 0.570), [float]($S * 0.447)),
        [System.Drawing.PointF]::new([float]($S * 0.605), [float]($S * 0.405)),
        [System.Drawing.PointF]::new([float]($S * 0.680), [float]($S * 0.405)),
        [System.Drawing.PointF]::new([float]($S * 0.715), [float]($S * 0.447)))
    $eyePen.Dispose()

    $smilePen = New-Object System.Drawing.Pen($cSmile, [float]([Math]::Max(1.25, $S * 0.025)))
    $smilePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $smilePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawBezier($smilePen,
        [System.Drawing.PointF]::new([float]($S * 0.368), [float]($S * 0.590)),
        [System.Drawing.PointF]::new([float]($S * 0.430), [float]($S * 0.692)),
        [System.Drawing.PointF]::new([float]($S * 0.572), [float]($S * 0.692)),
        [System.Drawing.PointF]::new([float]($S * 0.635), [float]($S * 0.590)))
    $smilePen.Dispose()

    $pill = New-Object System.Drawing.SolidBrush($cOn)
    Fill-Round $g ([float]($S * 0.615)) ([float]($S * 0.065)) ([float]($S * 0.260)) ([float]($S * 0.104)) ([float]($S * 0.052)) $pill
    $pill.Dispose()
    if ($sz -ge 48) {
        $font = New-Object System.Drawing.Font('Segoe UI', [float]($S * 0.064), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $txtBr = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.DrawString('ON', $font, $txtBr, [System.Drawing.RectangleF]::new([float]($S * 0.615), [float]($S * 0.064), [float]($S * 0.260), [float]($S * 0.104)), $sf)
        $font.Dispose(); $sf.Dispose(); $txtBr.Dispose()
    }

    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Draw-Icon 256 "$env:TEMP\\essenceon_256.png"
Draw-Icon  64 "$env:TEMP\\essenceon_64.png"
Draw-Icon  48 "$env:TEMP\\essenceon_48.png"
Draw-Icon  32 "$env:TEMP\\essenceon_32.png"
Draw-Icon  16 "$env:TEMP\\essenceon_16.png"
Write-Output "done"
`;

fs.writeFileSync(psTmp, Buffer.concat([
  Buffer.from([0xef, 0xbb, 0xbf]),
  Buffer.from(psScript, 'utf8'),
]));

try {
  const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psTmp}" 2>&1`, { stdio: 'pipe' });
  const txt = out.toString().trim();
  if (txt && txt !== 'done') console.log('[PS]', txt);
} catch (e) {
  const err = (e.stderr?.toString() || '') + (e.stdout?.toString() || '');
  console.error('PowerShell failed:\n', err || e.message);
  process.exit(1);
}

const sizes = [256, 64, 48, 32, 16];
const pngs = sizes.map((s) => fs.readFileSync(path.join(os.tmpdir(), `essenceon_${s}.png`)));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);

let dataOffset = 6 + sizes.length * 16;
const entries = [];
for (let i = 0; i < sizes.length; i += 1) {
  const e = Buffer.alloc(16);
  const sz = sizes[i];
  e[0] = sz === 256 ? 0 : sz;
  e[1] = sz === 256 ? 0 : sz;
  e[2] = 0;
  e[3] = 0;
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(dataOffset, 12);
  dataOffset += pngs[i].length;
  entries.push(e);
}

fs.writeFileSync(path.join(__dirname, 'icon.ico'), Buffer.concat([header, ...entries, ...pngs]));
fs.copyFileSync(path.join(os.tmpdir(), 'essenceon_32.png'), path.join(__dirname, 'icon.png'));

[psTmp, ...sizes.map((s) => path.join(os.tmpdir(), `essenceon_${s}.png`))].forEach((f) => {
  try { fs.unlinkSync(f); } catch {}
});

console.log('Essence On icon created ->', path.join(__dirname, 'icon.ico'));
