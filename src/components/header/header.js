import React from "react";
import logo from "../../assets/logo.png";
import AuthButton from "../auth/authButton";
import MenuItems from "../menu/menuItem";

const Header = () => {
	return (
		<div className="flex justify-between items-center pl-10 pr-10">
			<a className="flex items-center gap-2" href="/">
				<img src={logo} alt="logo" className="w-full h-full max-w-[200px]" />{" "}
				<h1 className="text-2xl font-bold text-[#7305F6]">ToDo</h1>
			</a>
			<nav className="flex justify-between items-center gap-4">
				<MenuItems className="text-blue-500" />
			</nav>
			<AuthButton />
		</div>
	);
};

export default Header;
