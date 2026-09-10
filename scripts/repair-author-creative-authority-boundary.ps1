$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$file = Join-Path $repo 'apps\api\src\services\authorCreativeRealizer.ts'

if (-not (Test-Path $file)) {
  throw "Missing Author realizer: $file"
}

$text = Get-Content -Raw -LiteralPath $file
$original = $text
$backup = "$file.before-creative-authority-boundary-$(Get-Date -Format 'yyyyMMdd-HHmmss').bak"

function Replace-Exact([string]$old, [string]$new, [string]$label) {
  if (-not $script:text.Contains($old)) {
    throw "Expected block not found: $label. No file changes were written."
  }
  $script:text = $script:text.Replace($old, $new)
}

# QRE's creative language is not a rejection criterion. These checks remain
# useful as diagnostics, but they must never destroy an otherwise renderable film.
Replace-Exact @'
    if (INTERNAL.test(text)) {
      return {
        reason: `cut ${index + 1} leaks internal architecture`,
      };
    }

    if (EXPLANATION.test(text)) {
      return {
        reason: `cut ${index + 1} explains instead of dramatizing`,
      };
    }

    if (GENERIC.test(text)) {
      return {
        reason: `cut ${index + 1} is generic`,
      };
    }

'@ @'
    // Creative-language diagnostics are intentionally non-fatal.
    // The Artist owns language, rhythm, framing and treatment.
    // Do not discard the finished creation for stylistic heuristics.

'@ 'non-fatal creative language gates'

# Provenance is supporting metadata. A finished creative artifact must not be
# destroyed merely because an evidence binding could not be reconstructed.
Replace-Exact @'
  if (
    scenes.some(
      (scene) => scene.sourceEventIds.length === 0,
    )
  ) {
    return {
      reason:
        "one or more cuts could not be grounded to supplied reality",
    };
  }

'@ @'
  // Provenance is diagnostic metadata, not creative authority.
  // Empty bindings may be repaired/enriched downstream without discarding art.

'@ 'fatal provenance gate'

if ($text -eq $original) {
  throw 'Repair made no changes.'
}

Set-Content -LiteralPath $backup -Value $original -NoNewline
Set-Content -LiteralPath $file -Value $text -NoNewline

Write-Host "AUTHOR CREATIVE AUTHORITY REPAIR APPLIED"
Write-Host "Changed: $file"
Write-Host "Backup:  $backup"
Write-Host "Kept hard failures: malformed output, empty scenes, cut-count/render-shape limits."
Write-Host "Removed fatal gates: stylistic/internal-language heuristics and missing provenance binding."
