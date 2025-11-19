import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ChatPage from './pages/ChatPage'
import ArchitecturePage from './pages/ArchitecturePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/architecture" element={<ArchitecturePage />} />
    </Routes>
  )
}

export default App
