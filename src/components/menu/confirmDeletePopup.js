import React from 'react';

const DeleteMenuItemPopup = ({ onClose, onDelete }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 z-1">
      <div className="bg-white p-6 rounded-md shadow-md transition-transform duration-300 transform scale-95">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          &times;
        </button>
        <h2 className="text-2xl mb-4">Delete Menu Item</h2>
        <p>Are you sure you want to delete this menu item?</p>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
          <button onClick={onDelete} className="px-4 py-2 bg-red-500 text-white rounded-md">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMenuItemPopup;