import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase/supabaseClient';

const RegisterPopup = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const popupRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
  
    console.log('Sending data:', { email, password });
  
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Registration successful! Logging in...');
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setMessage(`Error logging in: ${loginError.message}`);
      } else {
        // Create user profile after successful login
        await createUserProfile(data.user.id);
        onClose();
      }
    }
  };

  const createUserProfile = async (userId) => {
    const { error } = await supabase.from("profiles").insert([
      { id: userId, nickname: "", first_name: "", last_name: "", birth_date: null, phone_number: "" }
    ]);

    if (error) {
      console.error("Error creating user profile:", error);
    } else {
      console.log("User profile created successfully.");
    }
  };

  const handleClickOutside = (e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 z-1">
      <div ref={popupRef} className="bg-white p-6 rounded-md shadow-md transition-transform duration-300 transform scale-95">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          &times;
        </button>
        <h2 className="text-2xl mb-4">Register</h2>
        {message && <p className="text-green-500 mb-4">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">Register</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPopup;