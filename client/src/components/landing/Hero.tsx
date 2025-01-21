import { Button } from "../ui/button";
import { ArrowRight, Book, Scale, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export function Hero() {
  return (
    <div className="relative isolate">
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Hero content */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Finnish Legal Assistant
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Your AI-powered guide through Finnish legal documents. Get instant insights, translations, and expert analysis of legal texts in both Finnish and English.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/chat">
              <Button size="lg" className="gap-2">
                Start Using Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/legal">
              <Button variant="outline" size="lg">
                View Legal Resources
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature section */}
        <div className="mx-auto mt-20 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5">
              <div className="flex items-center gap-4">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">Natural Conversations</h3>
              </div>
              <p className="mt-4 text-gray-600">
                Ask questions in natural language and get clear, contextual responses about Finnish legal matters.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5">
              <div className="flex items-center gap-4">
                <Book className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">Document Analysis</h3>
              </div>
              <p className="mt-4 text-gray-600">
                Upload legal documents for instant analysis, summaries, and key point extraction in both Finnish and English.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5">
              <div className="flex items-center gap-4">
                <Scale className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold">Legal Research</h3>
              </div>
              <p className="mt-4 text-gray-600">
                Access a comprehensive database of Finnish legal resources, precedents, and interpretations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
