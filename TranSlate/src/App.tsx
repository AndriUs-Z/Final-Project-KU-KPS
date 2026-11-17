// กำหนด Routes ทั้งหมดของแอป (Login, Home, History, Admin) พร้อม Route Guard 2 ระดับ
// และตั้งค่า Toast Notification ส่วนกลางสำหรับแจ้งเตือนทั้งแอปพลิเคชัน

import { Toaster } from 'react-hot-toast' 
import { Navigate, Route, Routes } from 'react-router-dom' 

// Pages 
import Login from './pages/Login'; 
import ResetPassword from './pages/ResetPassword'; 
import Home from './pages/Home'; 
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';

// Route Guards (ตัวตรวจสอบสิทธิ์ก่อนเข้าถึงหน้า)
import ProtectedRoute from './components/ProtectedRoute'; 
import AdminRoute from './components/AdminRoute'; 

const App = () => {
  return (
    <>
      {/* Popup แจ้งเตือนส่วนกลาง — แสดงที่มุมขวาบนของทุกหน้าในแอป */}
      <Toaster
        position="top-right" 
        toastOptions={{
          duration: 3000, 
          style: {
            background: "#1B3022", 
            color: "#fff",        
            borderRadius: "12px",  
            fontSize: "14px"       
          }
        }}
      />

      <Routes>
        <Route path='/' element={<Navigate to='/home' replace />} />
        
        <Route path='login' element={<Login />} />

        <Route path='reset-password' element={<ResetPassword />} />

        <Route path='home' element={<Home />} />

        <Route element={<ProtectedRoute />}>
          <Route path='history' element={<History />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path='admin' element={<AdminDashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;