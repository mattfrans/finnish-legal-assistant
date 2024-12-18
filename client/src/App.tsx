import { Switch, Route } from "wouter";
import { Home } from "@/pages/Home";
import { History } from "@/pages/History";
import { LegalPresetsPage } from "@/pages/LegalPresetsPage";
import { PricingPage } from "@/pages/PricingPage";
import { HelpPage } from "./pages/HelpPage";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DocumentPreview } from "@/components/document/DocumentPreview";
import { 
  PanelGroup,
  Panel,
  PanelResizeHandle
} from "react-resizable-panels";

function ResizeHandleBar() {
  return (
    <PanelResizeHandle className="w-1.5 bg-border/10 hover:bg-border/20 transition-colors cursor-col-resize" />
  );
}

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar */}
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
          <ResizeHandleBar />
          
          {/* Main Content */}
          <Panel 
            defaultSize={60}
            minSize={40}
            className="transition-all duration-300"
          >
            <main className="h-full overflow-y-auto bg-background">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/history" component={History} />
                <Route path="/legal" component={LegalPresetsPage} />
                <Route path="/pricing" component={PricingPage} />
                <Route path="/help" component={HelpPage} />
                <Route>
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold mb-2">404 - Sivua ei löydy</h1>
                      <p className="text-muted-foreground">Valitettavasti etsimääsi sivua ei löytynyt.</p>
                    </div>
                  </div>
                </Route>
              </Switch>
            </main>
          </Panel>
          
          {/* Document Preview Sidebar */}
          <ResizeHandleBar />
          <Panel
            defaultSize={20}
            minSize={0}
            maxSize={40}
            collapsible
          >
            <div className="h-full border-l bg-muted/30">
              <DocumentPreview />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
