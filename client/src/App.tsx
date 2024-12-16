import { Switch, Route } from "wouter";
import { Home } from "@/pages/Home";
import { History } from "@/pages/History";
import { LegalPresetsPage } from "@/pages/LegalPresetsPage";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#f5f3f0]">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/history" component={History} />
            <Route path="/presets" component={LegalPresetsPage} />
            <Route>404 - Not Found</Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default App;
