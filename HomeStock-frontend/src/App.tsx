import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from '@components/Header';
import routes from '@config/routes';

const App = () => {

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full fixed top-0 z-50">
        <Header />
        {/* Main Header, pages can have their own header */}
      </header>
      <div className="grow pt-16">
        <Routes>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path[0]}
              element={<route.component />}
            >
              {/* Render child routes */}
              {route.children && route.children.map((child, idx) => (
                <Route
                  key={idx}
                  path={child.path[0]}
                  element={<child.component />}
                />
              ))}
            </Route>
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