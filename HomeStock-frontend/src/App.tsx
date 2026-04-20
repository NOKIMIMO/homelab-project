import { BrowserRouter, Route, Routes,  } from 'react-router-dom';
import Header from './components/Header';
import routes from './config/routes';

const App = () => {

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full fixed top-0 z-50">
        <Header />
        {/* Main Header, pages can have ther own header */}
      </header>
      <div className="flex-grow pt-16">
        <Routes>
          {routes.map((route, index) => (
            // make a Route for each path possible later
            <Route
              key={index}
              path={route.path[0]}
              element={<route.component />}
            />
          ))}
        </Routes>
      </div>
    </div>
  );
};

function AppWrapper() {
  return (
      <BrowserRouter>
            <App />
      </BrowserRouter>
  );
}

export default AppWrapper;