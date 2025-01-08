import React, { useState, useEffect } from "react";
import RegisterPopup from "./register";
import LoginPopup from "./login";
import { supabase } from '../../supabase/supabaseClient';

const AuthButton = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex justify-between items-center gap-4">
      {user ? null : (
        <>
          <button
            className="bg-[#F037A2] text-white px-4 py-2 rounded-md hover:opacity-80 transition-opacity duration-300"
            onClick={() => setIsRegisterOpen(true)}
          >
            <span className="font-bold">Sign Up</span>
          </button>
          <button
            className="bg-[#7305F6] text-white px-4 py-2 rounded-md hover:opacity-80 transition-opacity duration-300"
            onClick={() => setIsLoginOpen(true)}
          >
            <span className="font-bold">Sign In</span>
          </button>
        </>
      )}

      {isRegisterOpen && <RegisterPopup onClose={() => setIsRegisterOpen(false)} />}
      {isLoginOpen && <LoginPopup onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
};

export default AuthButton;