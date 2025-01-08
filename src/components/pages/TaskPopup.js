import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase/supabaseClient";

const TaskPopup = ({
    newTask,
    setNewTask,
    closeAddTask,
    loadTasks,
    menuItemId,
    userId,
    editingTask,
    columns = [],
}) => {
    const [imageFiles, setImageFiles] = useState([]);
    const [imageUrls, setImageUrls] = useState(editingTask ? editingTask.image_url.split(',') : []);
    const popupRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                closeAddTask();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeAddTask]);

    const handleImageUpload = async () => {
        if (imageFiles.length === 0) return [];

        const uploadedUrls = [];
        for (const imageFile of imageFiles) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error } = await supabase.storage
                .from("img")
                .upload(filePath, imageFile);

            if (error) {
                console.error("Error uploading image:", error);
                continue;
            }

            const { data } = supabase.storage
                .from("img")
                .getPublicUrl(filePath);

            uploadedUrls.push(data.publicUrl);
        }

        return uploadedUrls;
    };

    const handleSubmit = async () => {
        const uploadedUrls = await handleImageUpload();
        const allImageUrls = [...imageUrls, ...uploadedUrls];

        const taskData = {
            title: newTask.title,
            description: newTask.description,
            due_date: newTask.dueDate,
            image_url: allImageUrls.join(','),
            menu_item_id: menuItemId,
            column_id: editingTask ? editingTask.column_id : columns.find(col => col.name === "ToDo").id,
        };

        if (editingTask) {
            await supabase
                .from("tasks")
                .update(taskData)
                .eq("id", editingTask.id);
        } else {
            await supabase
                .from("tasks")
                .insert([taskData]);
        }

        loadTasks(menuItemId);
        closeAddTask();
    };

    const handleDeleteImage = async (url) => {
        const fileName = url.split('/').pop();
        const { error } = await supabase.storage
            .from("img")
            .remove([`${userId}/${fileName}`]);

        if (error) {
            console.error("Error deleting image:", error);
            return;
        }

        const updatedUrls = imageUrls.filter((imageUrl) => imageUrl !== url);
        setImageUrls(updatedUrls);

        if (editingTask) {
            await supabase
                .from("tasks")
                .update({ image_url: updatedUrls.join(',') })
                .eq("id", editingTask.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div ref={popupRef} className="bg-white p-4 rounded shadow-lg relative w-[500px]">
                <button
                    onClick={closeAddTask}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    &times;
                </button>
                <h2 className="text-lg font-bold mb-2">
                    {editingTask ? "Edit Task" : "Add Task"}
                </h2>
                
                <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="border p-2 mb-2 w-full"
                    placeholder="Task Title"
                />
                <textarea
                    value={newTask.description}
                    onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="border p-2 mb-2 w-full"
                    placeholder="Task Description"
                />
                <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="border p-2 mb-2 w-full"
                />
                <input
                    type="file"
                    multiple
                    onChange={(e) => setImageFiles(Array.from(e.target.files))}
                    className="border p-2 mb-2 w-full"
                />
                <button
                    onClick={handleSubmit}
                    className="bg-blue-500 text-white p-2 rounded mr-2"
                >
                    {editingTask ? "Update" : "Add"}
                </button>
                <button
                    onClick={closeAddTask}
                    className="bg-gray-500 text-white p-2 rounded"
                >
                    Cancel
                </button>
                <div className="mt-4 flex flex-wrap gap-4">
                    {imageUrls.map((url, index) => (
                        <div key={index} className="flex items-center mb-2 flex-col gap-2">
                            <img src={url} alt={`Task Image ${index}`} className="w-16 h-16 object-cover rounded-md" />
                            <button
                                onClick={() => handleDeleteImage(url)}
                                className="bg-red-500 text-white p-1 px-2 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskPopup;