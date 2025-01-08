import { createContext, useContext, useState } from "react";

const AvatarContext = createContext();

export function AvatarProvider({ children }) {
	const [avatarUrl, setAvatarUrl] = useState("");

	return (
		<AvatarContext.Provider value={{ avatarUrl, setAvatarUrl }}>
			{children}
		</AvatarContext.Provider>
	);
}

export function useAvatar() {
	return useContext(AvatarContext);
}