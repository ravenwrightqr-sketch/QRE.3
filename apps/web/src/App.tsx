import {BrowserRouter,Routes,Route,Navigate} from "react-router-dom";
import Login from "./pages/Login";
import UniversalCreate from "./pages/UniversalCreate";
import Dashboard from "./pages/Dashboard";
import AssetDashboard from "./pages/AssetDashboard";
import EventDashboard from "./pages/EventDashboard";
import CollectDataDashboard from "./pages/CollectDataDashboard";
import KnowledgeDashboard from "./pages/KnowledgeDashboard";
import LearningDashboard from "./pages/LearningDashboard";
import CollaborationDashboard from "./pages/CollaborationDashboard";
import QreInfo from "./pages/QreInfo";
import ExperiencePreview from "./pages/ExperiencePreview";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateAsset from "./pages/admin/CreateAsset";
import Checkout from "./pages/Checkout";
import Scan from "./pages/scan";
import Contribution from "./pages/Contribution";
import Store from "./pages/store";
import Product from "./pages/product";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";
import {useAuth} from "./components/auth/authContext";

export default function App(){
  const{isAuthed,loading}=useAuth();
  if(loading)return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#030509",color:"#00ffcc"}}>LOADING QRE NODE...</div>;
  const gate=(el:JSX.Element)=>(isAuthed?el:<Navigate to="/login"/>);
  return <BrowserRouter><Routes>
    <Route path="/login" element={isAuthed?<Navigate to="/dashboard" replace/>:<Login/>}/>
    <Route path="/" element={isAuthed?<Navigate to="/dashboard"/>:<Navigate to="/login"/>}/>
    <Route path="/dashboard" element={gate(<UniversalCreate/>)}/>
    <Route path="/dashboard/legacy" element={gate(<Dashboard/>)}/>
    <Route path="/dashboard/info" element={gate(<QreInfo/>)}/>
    <Route path="/dashboard/assets/:slug" element={gate(<AssetDashboard/>)}/>
    <Route path="/dashboard/assets/:slug/event" element={gate(<EventDashboard/>)}/>
    <Route path="/dashboard/assets/:slug/collect" element={gate(<CollectDataDashboard/>)}/>
    <Route path="/dashboard/assets/:slug/knowledge" element={gate(<KnowledgeDashboard/>)}/>
    <Route path="/dashboard/assets/:slug/learning" element={gate(<LearningDashboard/>)}/>
    <Route path="/dashboard/assets/:slug/collaboration" element={gate(<CollaborationDashboard/>)}/>
    <Route path="/experience/preview" element={gate(<ExperiencePreview/>)}/>
    <Route path="/admin" element={gate(<AdminDashboard/>)}/>
    <Route path="/admin/create" element={gate(<CreateAsset/>)}/>
    <Route path="/checkout/:slug" element={<Checkout/>}/>
    <Route path="/scan/:slug" element={<Scan/>}/>
    <Route path="/s/:slug" element={<Scan/>}/>
    <Route path="/add/:slug" element={<Contribution/>}/>
    <Route path="/product/:slug" element={<Product/>}/>
    <Route path="/store" element={<Store/>}/>
    <Route path="/success" element={<Success/>}/>
    <Route path="/cancel" element={<Cancel/>}/>
    <Route path="*" element={<Navigate to="/"/>}/>
  </Routes></BrowserRouter>
}
