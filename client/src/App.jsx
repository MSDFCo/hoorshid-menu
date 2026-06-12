import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n.jsx';
import MenuPage from './pages/Menu.jsx';
import AdminPage from './pages/Admin.jsx';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
