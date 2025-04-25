import './App.css';
import RestaurantGraphFloor from './components/floor/RestaurantGraphFloor.tsx';
import Header from './components/base/Header/Header.tsx';
import Footer from './components/base/Footer/Footer.tsx';

function App() {
  return (
    <div>
      <Header />
      <RestaurantGraphFloor />
      <Footer />
    </div>
  );
}

export default App;
