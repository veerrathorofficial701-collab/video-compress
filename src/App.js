import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';

export default function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <main className="App-main"><HomePage /></main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
