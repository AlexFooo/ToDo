import React from "react";
import { supabase } from '../../supabase/supabaseClient';

const LogoutButton = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <button
      className="text-red w-full px-4 py-2 rounded-md hover:opacity-80 transition-opacity duration-300"
      onClick={handleLogout}
    >
      <span className="font-bold">Logout</span>
    </button>
  );
};

export default LogoutButton;