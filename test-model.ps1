param(
    [Parameter(Mandatory=$true)]
    [string]$Model
)

$env:QRE_MODEL_TRANSPORT="openrouter"
$env:QRE_OPENROUTER_MODEL=$Model
$env:QRE_AUTHOR_DEBUG_RAW="true"

Write-Host ""
Write-Host "============================================================"
Write-Host " QRE MODEL: $env:QRE_OPENROUTER_MODEL"
Write-Host "============================================================"
Write-Host ""

pnpm --filter @qre/api exec tsx --input-type=module -e "import { buildAuthorRealityGraph } from './src/services/authorRealityGraph.ts'; import { discoverAuthorCreativeDirection } from './src/services/authorCreativeDiscovery.ts'; const clean=(value)=>String(value ?? '').replace(/\s+/g,' ').trim(); const test={name:'TINY_IDENTITY',subject:'Milo',facts:['Milo loves walks','Milo loves bacon','Milo loves small dogs'],domainContext:{experienceMode:'IDENTITY',category:'DOG TAG',subjectType:'DOG',outputType:'LIVING DOG TAG'}}; const graph=buildAuthorRealityGraph({prompt:'Diagnose Phase A Creative Discovery only.',subject:test.subject,facts:test.facts,sourceMoments:[],memoryContext:[],trajectory:[]}); const events=graph.events.map((event)=>({id:event.id,text:clean(event.label)})).filter((event)=>event.text); discoverAuthorCreativeDirection({events,relations:graph.relations.map((relation)=>({from:relation.from,to:relation.to,kind:relation.kind,strength:relation.strength})),requestedLens:'NONE',memory:[],domainContext:test.domainContext}).then((discovery)=>{ console.log('\n=== PHASE A DIAGNOSTIC: '+test.name+' ==='); console.log('MODEL:', discovery.model); console.log('MODEL CALLS:', discovery.modelCalls); console.log('\nSELECTED:'); console.log(JSON.stringify(discovery.discovery.selected,null,2)); console.log('\nCANDIDATES:'); console.log(JSON.stringify(discovery.discovery.candidates,null,2)); }).catch((error)=>{ console.error(error); process.exit(1); });"