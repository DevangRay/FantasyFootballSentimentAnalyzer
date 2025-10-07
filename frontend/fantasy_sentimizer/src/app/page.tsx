import HomePage from "./components/pages/HomePage";

export default function Home() {
  return (
    <main className="min-h-screen min-w-screen flex flex-col bg-gray-50 font-mono">
      {/* Title */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Fantasy Sentimizer</h1>
      </header>

      <HomePage />
    </main>
  );
}
