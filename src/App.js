import React from 'react';
import './App.css';
import Header from './components/header/header';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/pages/Home';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import Sidebar from './components/sidebar/sidebar';
import Settings from './components/settings/settings';
import { AvatarProvider } from './components/settings/avatarContext';
import TodoTable from './components/pages/TodoTable';
function App() {
  return (
    <Router>
      <AvatarProvider>
      <div className="App flex justify-end">
      
        <Sidebar />
        
        <div className="App-body w-full">
          <header className="App-header mb-10 pb-4 pt-4 border-b">
            <Header />
          </header>
          <div className="App-body-content pl-10 pr-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/table/:tableName" element={<TodoTable />} />
            </Routes>
          </div>
        </div>
      </div>
      </AvatarProvider>
    </Router>
  );
}

export default App;