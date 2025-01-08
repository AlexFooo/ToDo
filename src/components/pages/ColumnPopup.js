import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase/supabaseClient";

const ColumnPopup = ({ closePopup, loadColumns, menuItemId }) => {
    const [columnName, setColumnName] = useState("");
    const popupRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                closePopup();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closePopup]);

    const handleAddColumn = async () => {
        if (!columnName.trim()) return;

        const { error } = await supabase
            .from("columns")
            .insert([{ name: columnName, order: 0, menu_item_id: menuItemId }]);

        if (error) {
            console.error("Error adding column:", error);
        } else {
            loadColumns(menuItemId);
            closePopup();
        }
    };

    return (
        <div className="fixed z-10 inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div ref={popupRef} className="bg-white p-4 rounded shadow-lg relative">
                <button
                    onClick={closePopup}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    &times;
                </button>
                <h2 className="text-lg font-bold mb-2">Add Column</h2>
                <input
                    type="text"
                    value={columnName}
                    onChange={(e) => setColumnName(e.target.value)}
                    className="border p-2 mb-2 w-full"
                    placeholder="Column Name"
                />
                <button
                    onClick={handleAddColumn}
                    className="bg-blue-500 text-white p-2 rounded mr-2"
                >
                    Add
                </button>
                <button
                    onClick={closePopup}
                    className="bg-gray-500 text-white p-2 rounded"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ColumnPopup;