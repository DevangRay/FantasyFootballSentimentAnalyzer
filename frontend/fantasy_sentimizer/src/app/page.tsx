import { Button } from "@/components/ui/button";
import HomePage from "@/app/components/pages/HomePage";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-gray-50 font-mono">
      {/* Title */}
      <header className="flex flex-row justify-between border-b p-4 text-center ">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Fantasy Sentimizer</h1>

        <div className="shrink-0">
          <Button>
            <a href="/" className="text-white-700 hover:text-white-900">
              Home
            </a>
          </Button>
        </div>
      </header>

      <HomePage />
    </main>
  );
}
