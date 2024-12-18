import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Book, Scale } from "lucide-react";

export function HelpPage() {
  return (
    <div className="container py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Help & Support</h1>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General Help</TabsTrigger>
          <TabsTrigger value="legal">Legal Research</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Using the Chat Interface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI assistant helps you navigate Finnish legal questions. Simply type your question
                  in Finnish or English, and receive accurate responses with relevant legal citations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Document Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access and manage legal documents, templates, and past conversations. All documents
                  are stored securely and can be easily referenced later.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Legal Research
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get instant access to Finnish legal resources, including legislation, case law,
                  and official guidelines from Finlex and KKV.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <ScrollArea className="h-[600px]">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Understanding Finnish Legal Sources</h3>
                <p className="mb-4">
                  Our platform integrates with official Finnish legal databases and provides access to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                  <li>Finlex - Official database of Finnish legislation</li>
                  <li>KKO Decisions - Supreme Court precedents</li>
                  <li>KKV Guidelines - Consumer protection information</li>
                  <li>Ministry Publications - Official legal guidelines</li>
                </ul>

                <h3 className="text-lg font-semibold mb-4">Citation System</h3>
                <p className="mb-4">
                  Legal citations follow the official Finnish legal citation format, ensuring accuracy
                  and traceability of all legal references.
                </p>
              </CardContent>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <ScrollArea className="h-[600px]">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    How accurate is the legal information?
                  </h3>
                  <p className="text-muted-foreground">
                    All information is based on current Finnish legislation and verified legal sources.
                    However, the system should be used as a research tool and not as a replacement
                    for professional legal advice.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    Can I use this for official legal work?
                  </h3>
                  <p className="text-muted-foreground">
                    While our platform provides accurate legal information and research tools,
                    it should be used as a supplementary resource. Always verify critical information
                    with official sources and consult legal professionals for important matters.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    How up-to-date is the legal database?
                  </h3>
                  <p className="text-muted-foreground">
                    Our system synchronizes with Finlex and other official sources regularly to
                    ensure all legal information is current. Last update timestamps are always
                    displayed with citations.
                  </p>
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
