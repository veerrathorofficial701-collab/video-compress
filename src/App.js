import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';

function App() {
  return (
    <div className="App">
      <Header />
      <main className="App-main">
        <HomePage />
      </main>
      <Footer />
    </div>
  );
}

export default App;
