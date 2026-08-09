$path = 'packages/engine/src/experience/universalStoryCompiler.ts'
$text = Get-Content $path -Raw
$replacements = @{
'`${subjectName} is the thing the experience puts into focus.`' = '`${subjectName} is the subject named by the prompt.`'
'`Something about ${subjectValue} deserves a closer look: ${detail}.`' = '`${subjectName} gives the prompt a concrete detail: ${detail}.`'
'`${subjectName} connects to ${detail}, giving the moment a direction.`' = '`${subjectName} connects to ${detail}, changing what can happen next.`'
'`${subjectName} encounters something that gives the moment a direction.`' = '`${subjectName} encounters another concrete part of the premise.`'
'`The experience moves forward through ${interaction}.`' = '`${subjectName} moves forward through ${interaction}.`'
'`A second layer of ${subjectValue} comes into view.`' = '`${subjectName} exposes another concrete layer of the premise.`'
'`${cap(purpose)}. The subject now means more because of what happened around it.`' = '`${cap(purpose)}. ${subjectName} carries the result of what happened.`'
'`${subjectName} has become more meaningful through the interaction.`' = '`${subjectName} carries the result of the interaction.`'
'`The experience leaves a meaning behind, attached to ${subjectValue}.`' = '`${subjectName} retains the consequence of the interaction.`'
'`The next interaction can change what ${subjectValue} means.`' = '`${subjectName} remains open to the next interaction.`'
'`${subjectName} continues to develop through the interaction.`' = '`${subjectName} continues from the current state.`'
'`The hidden relationship around ${subjectValue} becomes visible.`' = '`${subjectName} exposes the concrete relationship carried by the premise.`'
}

foreach ($pair in $replacements.GetEnumerator()) {
  if (-not $text.Contains($pair.Key)) {
    Write-Host "MISSING: $($pair.Key)" -ForegroundColor Yellow
  }
  $text = $text.Replace($pair.Key, $pair.Value)
}

Set-Content -Path $path -Value $text -NoNewline
Write-Host 'Universal realization replacements applied.' -ForegroundColor Green
