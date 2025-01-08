import React, { useState, useRef, useEffect, createContext } from 'react';
import { ChevronFirst, ChevronLast, MoreVertical, Plus, X, GripHorizontal } from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Link, useLocation } from "react-router-dom";
import AuthButton from "../auth/authButton";
import LogoutButton from "../auth/logout";
import AddMenuItemPopup from "../menu/addMenuItem";
import DeleteMenuItemPopup from "../menu/confirmDeletePopup";
import logo from "../../assets/logo.png";
import { supabase } from "../../supabase/supabaseClient";
import { useAvatar } from "../settings/avatarContext";

const SidebarContext = createContext();

export default function Sidebar({ children }) {
    const [expanded, setExpanded] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [customMenuItems, setCustomMenuItems] = useState([]);
    const [isAddMenuItemPopupOpen, setIsAddMenuItemPopupOpen] = useState(false);
    const [isDeleteMenuItemPopupOpen, setIsDeleteMenuItemPopupOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const location = useLocation();
    const dropdownRef = useRef(null);
    const [nickname, setNickname] = useState("");
    const { avatarUrl, setAvatarUrl } = useAvatar();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUserEmail(session?.user?.email ?? "");
            if (session?.user) {
                loadCustomMenuItems(session.user.id);
                loadUserProfile(session.user.id);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUserEmail(session?.user?.email ?? "");
            if (session?.user) {
                loadCustomMenuItems(session.user.id);
                loadUserProfile(session.user.id);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadCustomMenuItems = async (userId) => {
        const { data, error } = await supabase
            .from("category_todo")
            .select("item_name, order")
            .eq("user_id", userId)
            .order("order", { ascending: true });

        if (error) {
            console.error("Error loading custom menu items:", error);
        } else {
            setCustomMenuItems(data);
        }
    };

    const loadUserProfile = async (userId) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("nickname, avatar_file_name")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error loading user profile:", error);
        } else {
            setNickname(data.nickname || "");
            if (data.avatar_file_name) {
                const fileName = data.avatar_file_name.replace(/ /g, "%20");
                const { data: urlData, error: urlError } = supabase.storage
                    .from("img")
                    .getPublicUrl(`avatar/${userId}/${fileName}`);

                if (urlError) {
                    console.error("Error getting public URL:", urlError);
                } else {
                    setAvatarUrl(urlData.publicUrl);
                }
            }
        }
    };

    const handleAddMenuItem = async (newItem) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data, error } = await supabase
                .from("category_todo")
                .insert([{ user_id: session.user.id, item_name: newItem, order: customMenuItems.length }]);

            if (error) {
                console.error("Error adding custom menu item:", error);
            } else {
                setCustomMenuItems([...customMenuItems, { item_name: newItem, order: customMenuItems.length }]);
            }
        }
    };

    const handleDeleteMenuItem = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && itemToDelete) {
            const { error: deleteTasksError } = await supabase
                .from('tasks')
                .delete()
                .eq('menu_item_id', itemToDelete);

            if (deleteTasksError) {
                console.error('Error deleting tasks:', deleteTasksError);
            }

            const { error } = await supabase
                .from('category_todo')
                .delete()
                .eq('user_id', session.user.id)
                .eq('item_name', itemToDelete);

            if (error) {
                console.error('Error deleting custom menu item:', error);
            } else {
                setCustomMenuItems(
                    customMenuItems.filter((item) => item.item_name !== itemToDelete),
                );
                setItemToDelete(null);
                setIsDeleteMenuItemPopupOpen(false);
            }
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, source } = result;
        if (!destination) return;
        if (destination.index === source.index) return;

        const items = Array.from(customMenuItems);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        setCustomMenuItems(items);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {

            for (let i = 0; i < items.length; i++) {
                await supabase
                    .from("category_todo")
                    .update({ order: i })
                    .eq("user_id", session.user.id)
                    .eq("item_name", items[i].item_name);
            }
        }
    };

    return (
        <aside className={`h-[calc(100vh-22px)] left-0 top-0 z-10 w-full ${expanded ? "max-w-[280px]" : "max-w-[75px]"}`}>
            <nav className="h-full flex flex-col bg-white border-r shadow-sm">
                <div className="p-4 px-3 pb-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img
                            src={logo}
                            className={`overflow-hidden transition-all ${expanded ? "w-16" : "w-0"}`}
                            alt="Logo"
                        />
                        <h1
                            className={`overflow-hidden transition-all text-2xl font-bold text-[#7305F6] ${expanded ? "w-16" : "w-0"}`}
                        >
                            ToDo
                        </h1>
                    </div>
                    <button
                        onClick={() => setExpanded((curr) => !curr)}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                        {expanded ? <ChevronFirst /> : <ChevronLast />}
                    </button>
                </div>

                <SidebarContext.Provider value={{ expanded }}>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="droppableSidebar">
                            {(provided) => (
                                <ul
                                    className={`flex-1 px-3 transition-all ${expanded ? "visible" : "invisible w-0"}`}
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {userEmail && customMenuItems.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold mb-10 border-b border-gray-200 pb-2">My List</h3>
                                            {customMenuItems.map((item, index) => (
                                                <Draggable key={item.item_name} draggableId={item.item_name} index={index}>
                                                    {(provided) => (
                                                        <li
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2"
                                                        >
                                                            <span {...provided.dragHandleProps}>
                                                                <GripHorizontal size={16} className="mr-2 cursor-grab" />
                                                            </span>
                                                            <Link
                                                                to={`/table/${item.item_name.toLowerCase().replace(/\s+/g, "-")}`}
                                                                className="text-blue-500 font-bold text-lg flex-1 capitalize"
                                                            >
                                                                {item.item_name}
                                                            </Link>
                                                            <button
                                                                onClick={() => {
                                                                    setItemToDelete(item.item_name);
                                                                    setIsDeleteMenuItemPopupOpen(true);
                                                                }}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </li>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </ul>
                            )}
                        </Droppable>
                    </DragDropContext>
                </SidebarContext.Provider>

                {userEmail && (
                    <div
                        className={`p-4 transition-all ${expanded ? "visible w-full" : "invisible w-0"}`}
                    >
                        <button
                            onClick={() => setIsAddMenuItemPopupOpen(true)}
                            className="w-full px-3 py-2 bg-blue-500 text-white rounded-md flex items-center justify-center"
                        >
                            <Plus className="mr-2" /> Add Menu Item
                        </button>
                    </div>
                )}

                {isAddMenuItemPopupOpen && (
                    <AddMenuItemPopup
                        onClose={() => setIsAddMenuItemPopupOpen(false)}
                        onAdd={handleAddMenuItem}
                    />
                )}

                {isDeleteMenuItemPopupOpen && (
                    <DeleteMenuItemPopup
                        onClose={() => setIsDeleteMenuItemPopupOpen(false)}
                        onDelete={handleDeleteMenuItem}
                    />
                )}

                <div
                    className={`flex justify-center items-center mb-10 overflow-hidden transition-all ${expanded ? "w-full" : "w-0 invisible"}`}
                >
                    <AuthButton />
                </div>

                {userEmail && (
                    <div className="relative border-t flex p-3">
                        <img
                            src={avatarUrl || logo}
                            className="w-10 h-10 rounded-md"
                            alt="User Avatar"
                        />
                        <div
                            className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0 invisible"}`}
                        >
                            <div className="leading-4">
                                <h4 className="font-semibold">{nickname || "ToDo List"}</h4>
                                <span className="text-xs text-gray-600">{userEmail}</span>
                            </div>
                            <div ref={dropdownRef}>
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    <MoreVertical size={20} />
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-100 bottom-[50px] mt-2 w-48 bg-white border rounded-md shadow-lg z-20">
                                        <Link
                                            to="/settings"
                                            className="flex justify-center px-4 py-2 text-gray-800 hover:bg-gray-100"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Settings
                                        </Link>
                                        <LogoutButton />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </aside>
    );
}