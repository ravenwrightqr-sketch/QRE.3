import FlowManager from "../flow/FlowManager";

export default function AssetControlPanel({
 asset
}:{
 asset:any
}){


return (

<div>

<h2>
{asset.slug}
</h2>


<FlowManager

assetId={
 asset.id
}

/>


</div>

)

}