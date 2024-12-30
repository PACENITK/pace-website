import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow mt-16">
        {/*  main content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center">Welcome to PACE</h1>
          <p className="text-center mt-4">Professional Association of Civil Engineers</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;