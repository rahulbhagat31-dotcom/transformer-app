# ============================================================
# fix-mojibake.ps1
# Replaces all mojibake emoji/symbol sequences with HTML entities
# in index.html and JS files
# ============================================================

# Map: mojibake string -> correct HTML entity or Unicode char
$script:replacements = [ordered]@{
    # ── 4-byte emoji starting with ðŸ (U+F0 U+9F → Ã°â€¦ / ðŸ) ──────────────────
    'ðŸ"Š' = '&#x1F4CA;'   # 📊 bar chart
    'ðŸ"‹' = '&#x1F4CB;'   # 📋 clipboard
    "ðŸ`"‚" = '&#x1F4C2;'   # 📂 open folder  (key contains U+201A low-9 quote)
    'ðŸ"„' = '&#x1F4C4;'   # 📄 page
    'ðŸ"ˆ' = '&#x1F4C8;'   # 📈 chart up
    'ðŸ"‰' = '&#x1F4C9;'   # 📉 chart down
    'ðŸ"œ' = '&#x1F4DC;'   # 📜 scroll
    'ðŸ"' = '&#x1F4CA;'   # 📊 (broken 2-byte tail variant)
    'ðŸ"®' = '&#x1F52E;'   # 🔮 crystal ball  / 📰 (\u1F4F0)
    'ðŸ"' = '&#x1F511;'   # 🔑 key (lp-demo)
    "ðŸ`"'" = '&#x1F512;'   # 🔒 lock            (key contains U+2019 right single quote)
    'ðŸ"˜' = '&#x1F518;'   # 🔘 radio button
    'ðŸ"' = '&#x1F516;'   # 🔖 bookmark
    'ðŸ"§' = '&#x1F527;'   # 🔧 wrench
    'ðŸ"¨' = '&#x1F528;'   # 🔨 hammer
    'ðŸ"©' = '&#x1F529;'   # 🔩 bolt
    'ðŸ"ª' = '&#x1F52A;'   # 🔪 knife
    'ðŸ"¬' = '&#x1F52C;'   # 🔬 microscope
    'ðŸ"­' = '&#x1F52D;'   # 🔭 telescope
    'ðŸ"±' = '&#x1F4F1;'   # 📱 phone
    'ðŸ"²' = '&#x1F532;'   # 🔲 button
    'ðŸ"³' = '&#x1F533;'   # 🔳 button
    "ðŸ'¤" = '&#x1F464;'   # 👤 person
    "ðŸ'¥" = '&#x1F465;'   # 👥 people
    "ðŸ'°" = '&#x1F4B0;'   # 💰 money
    "ðŸ'¡" = '&#x1F4A1;'   # 💡 light bulb
    "ðŸ'ˆ" = '&#x1F448;'   # 👈 point left
    "ðŸ'‰" = '&#x1F449;'   # 👉 point right
    "ðŸ'Š" = '&#x1F44A;'   # 👊 fist
    "ðŸ'‹" = '&#x1F44B;'   # 👋 wave
    "ðŸ'Œ" = '&#x1F44C;'   # 👌 ok
    "ðŸ'Ž" = '&#x1F44E;'   # 👎 thumbs down
    "ðŸ'" = '&#x1F44D;'   # 👍 thumbs up
    "ðŸ''" = '&#x1F91D;'   # 🤝 handshake
    "ðŸ'`""  = '&#x1F4A5;'   # 💥 boom
    'ðŸ†"' = '&#x1F193;'   # 🆓 free
    'ðŸ†™' = '&#x1F199;'   # 🆙 up
    'ðŸ†' = '&#x1F3C6;'   # 🏆 trophy
    'ðŸ‡' = '&#x1F347;'   # 🍇 grapes
    'ðŸˆ' = '&#x1F408;'   # 🐈 cat
    'ðŸŽ' = '&#x1F38E;'   # 🎎 dolls
    'ðŸ' = '&#x1F340;'   # 🍀 clover
    'ðŸ–' = '&#x1F596;'   # 🖖 vulcan
    'ðŸ™' = '&#x1F64F;'   # 🙏 pray
    'ðŸš€' = '&#x1F680;'   # 🚀 rocket
    'ðŸš' = '&#x1F6A8;'   # 🚨 siren
    'ðŸš§' = '&#x1F6A7;'   # 🚧 construction
    'ðŸœ' = '&#x1F3DC;'   # 🏜 desert
    'ðŸ' = '&#x1F3E1;'   # 🏡 house
    'ðŸ"' = '&#x1F3E4;'   # 🏤 european post office
    'ðŸ¥' = '&#x1F3E5;'   # 🏥 hospital
    'ðŸ¦' = '&#x1F3E6;'   # 🏦 bank
    'ðŸ§' = '&#x1F3E7;'   # 🏧 ATM
    'ðŸ¨' = '&#x1F3E8;'   # 🏨 hotel
    'ðŸ©' = '&#x1F3E9;'   # 🏩 love hotel
    'ðŸª' = '&#x1F3EA;'   # 🏪 convenience store
    'ðŸ«' = '&#x1F3EB;'   # 🏫 school
    'ðŸ¬' = '&#x1F3EC;'   # 🏬 department store
    'ðŸ­' = '&#x1F3ED;'   # 🏭 factory
    'ðŸ®' = '&#x1F3EE;'   # 🏮 red paper lantern
    'ðŸ¯' = '&#x1F3EF;'   # 🏯 japanese castle
    'ðŸ°' = '&#x1F3F0;'   # 🏰 european castle
    'ðŸ±' = '&#x1F431;'   # 🐱 cat
    "ðŸ'Z" = '&#x1F6CF;'   # 🛏 bed (fallback)

    # ── 3-byte sequences starting with â (U+E2) ─────────────────────────────
    'âœ…' = '&#x2705;'    # ✅ green check
    'âœ"' = '&#x2714;'    # ✔ heavy check
    'âœ—' = '&#x2717;'    # ✗ ballot X
    'âœ–' = '&#x2716;'    # ✖ heavy multiplication
    'âœ' = '&#x270D;'    # ✍ writing hand
    'âš¡' = '&#x26A1;'    # ⚡ lightning
    'âš ' = '&#x26A0;'    # ⚠ warning
    'âš™' = '&#x2699;'    # ⚙ gear
    'âš–' = '&#x2696;'    # ⚖ scales
    'âš"' = '&#x2693;'    # ⚓ anchor
    'â†'' = '&#x2192;'    # → right arrow
    'â†'' = '&#x2190;'    # ← left arrow
    'â†'' = '&#x2191;'    # ↑ up arrow
    'â†"' = '&#x2193;'    # ↓ down arrow
    'â†'' = '&#x21A9;'    # ↩ return arrow
    'â†'' = '&#x21AA;'    # ↪ right curl
    'â†' = '&#x2194;'    # ↔ left-right arrow
    'â—' = '&#x25CB;'    # ○ circle
    'â—Œ' = '&#x25CC;'    # ◌ dotted circle (spinner)
    'â—‰' = '&#x25C9;'    # ◉ fisheye
    'â—‹' = '&#x25CB;'    # ○ white circle
    'â–¾' = '&#x25BE;'    # ▾ small down triangle
    'â–°' = '&#x25B0;'    # ▰ filled rect
    'â–¸' = '&#x25B8;'    # ▸ right-pointing small triangle
    'â–º' = '&#x25BA;'    # ► right triangle
    'â–¼' = '&#x25BC;'    # ▼ down triangle
    'â–½' = '&#x25BD;'    # ▽ down outline triangle
    'â– ' = '&#x25A0;'    # ■ filled square
    'â—†' = '&#x25C6;'    # ◆ diamond
    'â€"' = '&#x2013;'    # – en dash
    'â€"' = '&#x2014;'    # — em dash
    "â€˜" = '&#x2018;'    # ' left single quote
    "â€™" = '&#x2019;'    # ' right single quote
    'â€œ' = '&#x201C;'    # " left double quote
    'â€' = '&#x201D;'    # " right double quote
    'â€¦' = '&#x2026;'    # … ellipsis
    'â€' = '&#x2022;'    # • bullet (some variants)
    "â€'" = '&#x2011;'    # ‑ non-breaking hyphen  (key contains U+2019)
    'â•' = '&#x2550;'    # ═ double horizontal
    'â•' = '&#x2551;'    # ║ double vertical
    'â•' = '&#x2554;'    # ╔ double top-left corner
    'â•' = '&#x255D;'    # ╝ double bottom-right corner
    'â•"' = '&#x2553;'    # ╓ top-left
    'â•–' = '&#x2556;'    # ╖ top-right
    'â•™' = '&#x2559;'    # ╙ bottom-left
    'â•œ' = '&#x255C;'    # ╜ bottom-right
    'â™' = '&#x2665;'    # ♥ heart
    'â™ ' = '&#x2660;'    # ♠ spade
    'â™¦' = '&#x2666;'    # ♦ diamond
    'â™£' = '&#x2663;'    # ♣ club
    'â™ ' = '&#x2660;'    # ♠ spade (dup)
    'â™ ' = '&#x2640;'    # ♀ female
    'â™‚' = '&#x2642;'    # ♂ male
    'â™' = '&#x2669;'    # ♩ quarter note
    'â™ ' = '&#x266A;'    # ♪ eighth note
    'â˜' = '&#x2603;'    # ☃ snowman
    'â˜€' = '&#x2600;'    # ☀ sun
    'â˜…' = '&#x2605;'    # ★ star
    'â˜†' = '&#x2606;'    # ☆ outline star
    'â—' = '&#x25CF;'    # ● filled circle
    'â—' = '&#x25C9;'    # ◉
    'â™»' = '&#x267B;'    # ♻ recycle
    'â˜­' = '&#x262D;'    # ☭
    'â˜¯' = '&#x262F;'    # ☯ yin yang
    'â‡ ' = '&#x21E0;'    # ⇠
    'â‡¢' = '&#x21E2;'    # ⇢ right dashed
    'â‡¨' = '&#x21E8;'    # ⇨ right white arrow
    "â‡'" = '&#x21D2;'    # ⇒ right double arrow  (key has U+2019)
    'â‡"' = '&#x21D4;'    # ⇔ left-right double
    'â"' = '&#x2514;'    # └ box drawing
    "â`"‚" = '&#x2502;'    # │ box line             (key contains U+201A)
    'â"€' = '&#x2500;'    # ─ horizontal line
    'â"œ' = '&#x251C;'    # ├ T-left
    'â"¤' = '&#x2524;'    # ┤ T-right

    # ── Â prefix sequences (double-encoded Latin-1 chars) ───────────────────
    'Â·' = '&middot;'    # · middle dot
    'Â©' = '&copy;'      # © copyright
    'Â®' = '&reg;'       # ® registered
    'Â°' = '&deg;'       # ° degree
    'Âµ' = '&micro;'     # µ micro
    'Â²' = '&sup2;'      # ² squared
    'Â³' = '&sup3;'      # ³ cubed
    'Â±' = '&plusmn;'    # ± plus-minus
    'Â»' = '&raquo;'     # » right angle quote
    'Â«' = '&laquo;'     # « left angle quote
    'Â ' = '&nbsp;'      # non-breaking space
    'Â' = ''            # stray Â prefix with no following char — remove

    # ── ã sequences ─────────────────────────────────────────────────────────
    'ãƒ' = '&#x30C6;'   # テ (katakana, unlikely but handle)
}

function Fix-File {
    param([string]$path)
    $orig    = Get-Content $path -Raw -Encoding UTF8
    $content = $orig
    foreach ($pair in $script:replacements.GetEnumerator()) {
        $content = $content.Replace($pair.Key, $pair.Value)
    }
    if ($content -ne $orig) {
        Set-Content $path $content -Encoding UTF8 -NoNewline
        Write-Host "FIXED: $path"
    } else {
        Write-Host "  OK : $path (no changes)"
    }
}

# ── Target files ────────────────────────────────────────────────────────────
$ProjectRoot = $PSScriptRoot -replace '\\tmp$', '\Users\Hina\OneDrive\Desktop\transformer'
# Override: script is run from project folder
$ProjectRoot = (Get-Location).Path

$htmlFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter '*.html' | Where-Object { $_.FullName -notlike '*node_modules*' }
$jsFiles   = Get-ChildItem -Path "$ProjectRoot\public\js" -Recurse -Filter '*.js'
$cssFiles  = Get-ChildItem -Path "$ProjectRoot\public\css" -Recurse -Filter '*.css'

$allFiles = @($htmlFiles) + @($jsFiles) + @($cssFiles)

Write-Host "`n=== Fixing mojibake in $($allFiles.Count) files ===`n"
foreach ($file in $allFiles) {
    Fix-File -path $file.FullName
}
Write-Host "`n=== Done ==="
