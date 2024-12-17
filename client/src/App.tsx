import { Switch, Route } from "wouter";
import { Home } from "@/pages/Home";
import { History } from "@/pages/History";
import { LegalPresetsPage } from "@/pages/LegalPresetsPage";
import { PricingPage } from "@/pages/PricingPage";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ContextualHelpSidebar } from "@/components/help/ContextualHelpSidebar";
import { 
  PanelGroup, 
  Panel
} from "react-resizable-panels";

function ResizeHandle() {
  return (
    <div className="w-1.5 bg-border/10 hover:bg-border/20 transition-colors cursor-col-resize" />
  );
}

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel 
            defaultSize={20} 
            minSize={0} 
            maxSize={30} 
            collapsible
          >
            <div className="h-full">
              <Sidebar />
            </div>
          </Panel>
          <ResizeHandle />
          <Panel 
            defaultSize={80}
            minSize={70} 
            className="transition-all duration-300"
          >
            <main className="h-full overflow-y-auto bg-[#f5f3f0]">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/history" component={History} />
                <Route path="/legal" component={LegalPresetsPage} />
                <Route path="/pricing" component={PricingPage} />
                <Route>404 - Not Found</Route>
              </Switch>
            </main>
          </Panel>
        </PanelGroup>
      </div>
      <ContextualHelpSidebar />
    </div>
  );
}

export default App;
