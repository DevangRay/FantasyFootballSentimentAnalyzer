
export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col bg-gray-50 font-mono">
      {/* Title */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Fantasy Sentimizer</h1>
      </header>

      {/* Text Area */}
      <section className="flex-1 flex">
        <textarea
          autoFocus
          className="w-full h-full resize-none outline-none bg-transparent p-8 text-xl leading-relaxed font-mono"
          placeholder="Start typing..."
        />
      </section>

      {/* Footer */}
      <footer className="p-4 text-center border-t border-gray-200 text-sm text-gray-500">
        <button>Fuck that, I want to upload a file</button>
      </footer>
    </main>
  );
}
