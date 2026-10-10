import { Toaster } from 'react-hot-toast'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import History from './pages/History';

const App = () => {
  return (
    < >
      <Toaster position="top-right" toastOptions={{
        duration: 3000, style: {
          background: "#1B3022", color: "#fff", borderRadius: "12px", fontSize: "14px"
        }
      }} />
      <Routes>
        {/*Auth pages - No Navbar/Footer */}
        <Route path='login' element={<Login />} />

        {/* Protected pages - ต้อง login ก่อน */}
        <Route element={<ProtectedRoute />}>
          <Route path='home' element={<Home />} />
          <Route path='history' element={<History />} />
        </Route>
      </Routes>

    </>
  );
}

export default App;