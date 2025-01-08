import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase/supabaseClient";
import { useAvatar } from './avatarContext';

const Settings = () => {
	const [nickname, setNickname] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [birthDate, setBirthDate] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [userId, setUserId] = useState(null);
	const [avatarFile, setAvatarFile] = useState(null);
	const { avatarUrl, setAvatarUrl } = useAvatar();

	useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
  
      if (error) {
        console.error("Error getting session:", error);
        return;
      }
  
      if (session?.user) {
        setUserId(session.user.id);
        loadUserProfile(session.user.id);
      } else {
        console.log("No active session found.");
      }
    };
  
    getSession();
  }, []);

	const loadUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
  
    if (error) {
      if (error.code === 'PGRST116') {
        console.error("No user profile found for this ID.");
        // Возможно, создать профиль здесь
        await createUserProfile(userId);
      } else {
        console.error("Error loading user profile:", error);
      }
    } else {
      setNickname(data.nickname || "");
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setBirthDate(data.birth_date || "");
      setPhoneNumber(data.phone_number || "");
      if (data.avatar_file_name) {
        const fileName = data.avatar_file_name.replace(/ /g, '%20');
        const { data: urlData, error: urlError } = supabase.storage
          .from('img')
          .getPublicUrl(`avatar/${userId}/${fileName}`);
  
        if (urlError) {
          console.error('Error getting public URL:', urlError);
        } else {
          setAvatarUrl(urlData.publicUrl);
        }
      } else {
        console.log('No avatar file name found in profile data.');
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

	const handleSave = async () => {
    let avatar_file_name = null;
  
    if (avatarFile) {
      const sanitizedFileName = avatarFile.name.replace(/ /g, '_');
      const encodedFileName = encodeURIComponent(sanitizedFileName);
      avatar_file_name = sanitizedFileName;
  
      const { data, error } = await supabase.storage
        .from("img")
        .upload(`avatar/${userId}/${encodedFileName}`, avatarFile, {
          upsert: true
        });
  
      if (!error) {
				const { data: urlData, error: urlError } = supabase.storage
					.from("img")
					.getPublicUrl(`avatar/${userId}/${encodedFileName}`);

				if (!urlError) {
					setAvatarUrl(urlData.publicUrl); // Обновление URL аватара в контексте
				}
			}
    } else {
      // Если аватар не загружен, используйте существующее имя файла
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_file_name")
        .eq("id", userId)
        .single();
  
      if (profileError) {
        console.error("Error fetching current profile:", profileError);
        return;
      }
  
      avatar_file_name = profileData.avatar_file_name || null;
    }
  
    const updates = {
      id: userId,
      avatar_file_name,
      nickname,
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate || null,
      phone_number: phoneNumber,
      updated_at: new Date(),
    };
  
    const { error } = await supabase.from("profiles").upsert(updates);
  
    if (error) {
      console.error("Error updating user profile:", error);
    } else {
      alert("Profile updated successfully!");
    }
  };

	const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const newAvatarUrl = URL.createObjectURL(file);
      setAvatarUrl(newAvatarUrl);
    }
  };

	const getInitials = () => {
		if (firstName) return firstName[0];
		if (lastName) return lastName[0];
		if (nickname) return nickname[0];
		if (userId) return userId[0];
		return "";
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Settings</h1>
			<div className="mb-4">
				<label className="block text-sm font-medium mb-1">Avatar</label>
				<div className="flex items-center">
					{avatarUrl ? (
						<img
							src={avatarUrl}
							alt="Avatar"
							className="w-32 h-32 rounded-full mr-4"
						/>
					) : (
						<div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center text-2xl text-white mr-4">
							{getInitials()}
						</div>
					)}
					<label className="cursor-pointer flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full">
						<span className="text-xl">+</span>
						<input
							type="file"
							accept="image/*"
							onChange={handleAvatarChange}
							className="hidden"
						/>
					</label>
				</div>
			</div>
			<div className="mb-4">
				<label className="block text-sm font-medium mb-1">Nickname</label>
				<input
					type="text"
					value={nickname}
					onChange={(e) => setNickname(e.target.value)}
					className="w-full px-3 py-2 border rounded-md"
				/>
			</div>
			<div className="mb-4">
				<label className="block text-sm font-medium mb-1">First Name</label>
				<input
					type="text"
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
					className="w-full px-3 py-2 border rounded-md"
				/>
			</div>
			<div className="mb-4">
				<label className="block text-sm font-medium mb-1">Last Name</label>
				<input
					type="text"
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
					className="w-full px-3 py-2 border rounded-md"
				/>
			</div>
			<div className="mb-4">
				<label className="block text-sm font-medium mb-1">Birth Date</label>
				<input
					type="date"
					value={birthDate}
					onChange={(e) => setBirthDate(e.target.value)}
					className="w-full px-3 py-2 border rounded-md"
				/>
			</div>
			<div className="mb-4">
				<label className="block text-sm font-medium mb-1">Phone Number</label>
				<input
					type="text"
					value={phoneNumber}
					onChange={(e) => setPhoneNumber(e.target.value)}
					className="w-full px-3 py-2 border rounded-md"
				/>
			</div>
			<button
				onClick={handleSave}
				className="px-4 py-2 bg-blue-500 text-white rounded-md"
			>
				Save
			</button>
		</div>
	);
};

export default Settings;