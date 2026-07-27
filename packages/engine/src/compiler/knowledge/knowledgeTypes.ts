export interface KnowledgeNode {

    id:string;

    concept:string;

    domain:string;

}



export interface KnowledgeEdge {

    from:string;

    to:string;

    relationship:string;

    strength:number;

}



export interface KnowledgeGraph {

    nodes:KnowledgeNode[];

    edges:KnowledgeEdge[];

}