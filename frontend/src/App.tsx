import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ChatPage from './pages/ChatPage'
import ArchitecturePage from './pages/ArchitecturePage'
import BehindTheScenesPage from './pages/BehindTheScenesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/architecture" element={<ArchitecturePage />} />
      <Route path="/behind-the-scenes" element={<BehindTheScenesPage />} />
    </Routes>
  )
}

export default App
