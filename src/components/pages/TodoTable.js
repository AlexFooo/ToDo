import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabase/supabaseClient";
import TaskPopup from "./TaskPopup";
import ColumnPopup from "./ColumnPopup";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Edit2, Trash2 } from "lucide-react";

const TodoTable = () => {
	const { tableName } = useParams();
	const [todos, setTodos] = useState([]);
	const [columns, setColumns] = useState([]);
	const [newTask, setNewTask] = useState({
		title: "",
		description: "",
		dueDate: "",
		image: null,
	});
	const [menuItemId, setMenuItemId] = useState(null);
	const [editingTask, setEditingTask] = useState(null);
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [isColumnPopupOpen, setIsColumnPopupOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState(null);
	const [userId, setUserId] = useState(null);
	const [editingColumnId, setEditingColumnId] = useState(null);
	const [newColumnName, setNewColumnName] = useState("");

	useEffect(() => {
		const fetchMenuItemId = async () => {
			const normalizedTableName = tableName.trim().toLowerCase();

			const { data, error } = await supabase
				.from("category_todo")
				.select("id")
				.eq("item_name", normalizedTableName)
				.single();

			if (error) {
				console.error("Error fetching menu item ID:", error);
			} else if (data) {
				setMenuItemId(data.id);
				await loadColumns(data.id);
				loadTasks(data.id);
			} else {
				console.warn("Menu item not found");
				setMenuItemId(null);
			}
		};

		fetchMenuItemId();
	}, [tableName]);

	const loadColumns = async (menuItemId) => {
		const { data, error } = await supabase
			.from("columns")
			.select("*")
			.eq("menu_item_id", menuItemId)
			.order("order", { ascending: true });

		if (error) {
			console.error("Error loading columns:", error);
		} else {
			setColumns(data);
		}
	};

	const loadTasks = async (menuItemId) => {
		const { data, error } = await supabase
			.from("tasks")
			.select("*")
			.eq("menu_item_id", menuItemId);

		if (error) {
			console.error("Error loading tasks:", error);
		} else {
			setTodos(data);
		}
	};

	const openAddTask = () => {
		setNewTask({
			title: "",
			description: "",
			dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
			image: null,
		});
		setEditingTask(null);
		setIsPopupOpen(true);
	};

	const closeAddTask = () => {
		setIsPopupOpen(false);
	};

	const startEditing = (todo) => {
		setNewTask({
			title: todo.title || "",
			description: todo.description || "",
			dueDate: todo.due_date || "",
			image: null,
		});
		setEditingTask(todo);
		setIsPopupOpen(true);
	};

	const deleteTodo = async (id) => {
		const { error } = await supabase.from("tasks").delete().eq("id", id);

		if (error) {
			console.error("Error deleting task:", error);
		} else {
			setTodos(todos.filter((todo) => todo.id !== id));
		}
	};

	const closeImageModal = () => {
		setSelectedImage(null);
	};

	const handleImageClick = (url) => {
		setSelectedImage(url);
	};

	const handleDeleteImage = async (todoId, url) => {
		const fileName = url.split("/").pop();
		const { error } = await supabase.storage
			.from("img")
			.remove([`${userId}/${fileName}`]);

		if (error) {
			console.error("Error deleting image:", error);
			return;
		}

		const updatedTodos = todos.map((todo) => {
			if (todo.id === todoId) {
				const updatedUrls = todo.image_url
					.split(",")
					.filter((imageUrl) => imageUrl !== url);
				return { ...todo, image_url: updatedUrls.join(",") };
			}
			return todo;
		});

		setTodos(updatedTodos);

		await supabase
			.from("tasks")
			.update({
				image_url: updatedTodos.find((todo) => todo.id === todoId).image_url,
			})
			.eq("id", todoId);
	};

	const handleDragEnd = async (result) => {
		const { destination, source, draggableId, type } = result;
		if (!destination) return;

		if (type === "COLUMN") {
			const reorderedColumns = Array.from(columns);
			const [movedColumn] = reorderedColumns.splice(source.index, 1);
			reorderedColumns.splice(destination.index, 0, movedColumn);

			setColumns(reorderedColumns);

			reorderedColumns.forEach(async (column, index) => {
				await supabase
					.from("columns")
					.update({ order: index })
					.eq("id", column.id);
			});
		} else if (type === "TASK") {
			const sourceColumnId = source.droppableId;
			const destinationColumnId = destination.droppableId;

			if (
				sourceColumnId === destinationColumnId &&
				source.index === destination.index
			)
				return;

			const sourceColumnTasks = todos.filter(
				(todo) => todo.column_id === parseInt(sourceColumnId),
			);
			const destinationColumnTasks = todos.filter(
				(todo) => todo.column_id === parseInt(destinationColumnId),
			);

			const [movedTask] = sourceColumnTasks.splice(source.index, 1);
			movedTask.column_id = parseInt(destinationColumnId);
			destinationColumnTasks.splice(destination.index, 0, movedTask);

			const updatedTodos = todos.map((todo) => {
				if (todo.id === parseInt(draggableId)) {
					return movedTask;
				}
				return todo;
			});

			setTodos(updatedTodos);

			const { error } = await supabase
				.from("tasks")
				.update({ column_id: destinationColumnId })
				.eq("id", draggableId);

			if (error) {
				console.error("Error updating task:", error);
			}
		}
	};

	const handleDeleteColumn = async (columnId) => {
		const { error } = await supabase
			.from("columns")
			.delete()
			.eq("id", columnId);

		if (error) {
			console.error("Error deleting column:", error);
		} else {
			setColumns(columns.filter((column) => column.id !== columnId));
		}
	};

	const handleEditColumn = (columnId, columnName) => {
		setEditingColumnId(columnId);
		setNewColumnName(columnName);
	};

	const handleUpdateColumnName = async (columnId) => {
		const { error } = await supabase
			.from("columns")
			.update({ name: newColumnName })
			.eq("id", columnId);

		if (error) {
			console.error("Error updating column name:", error);
		} else {
			setColumns(
				columns.map((column) =>
					column.id === columnId ? { ...column, name: newColumnName } : column,
				),
			);
			setEditingColumnId(null);
			setNewColumnName("");
		}
	};

	return (
		<div className="p-4">
			<div className="flex justify-between items-center gap-4">
				<h2 className="text-2xl font-bold mb-4 capitalize flex-1 ">
					{tableName}
				</h2>
				<button
					onClick={() => setIsColumnPopupOpen(true)}
					className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors duration-300"
				>
					Add Column
				</button>
				<button
					onClick={openAddTask}
					className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors duration-300"
				>
					Add Task
				</button>
			</div>

			{isPopupOpen && (
				<TaskPopup
					newTask={newTask}
					setNewTask={setNewTask}
					closeAddTask={closeAddTask}
					loadTasks={loadTasks}
					menuItemId={menuItemId}
					userId={userId}
					editingTask={editingTask}
					columns={columns}
				/>
			)}

			{isColumnPopupOpen && (
				<ColumnPopup
					closePopup={() => setIsColumnPopupOpen(false)}
					loadColumns={loadColumns}
					menuItemId={menuItemId}
				/>
			)}

			<DragDropContext onDragEnd={handleDragEnd}>
				<Droppable droppableId="columns" direction="horizontal" type="COLUMN">
					{(provided) => (
						<div
							className="flex space-x-4 overflow-x-auto"
							{...provided.droppableProps}
							ref={provided.innerRef}
						>
							{columns.map((column, index) => (
								<Draggable
									key={column.id}
									draggableId={column.id.toString()}
									index={index}
								>
									{(provided) => (
										<div
											{...provided.draggableProps}
											ref={provided.innerRef}
											className="min-w-[250px] bg-gray-100 p-4 rounded h-fit scrollbar"
										>
											<div
												className="flex items-center justify-between mb-2"
												{...provided.dragHandleProps}
											>
												{editingColumnId === column.id ? (
													<div className="flex items-center mb-2">
														<input
															type="text"
															value={newColumnName}
															onChange={(e) => setNewColumnName(e.target.value)}
															className="border p-1 mr-2"
														/>
														<button
															onClick={() => handleUpdateColumnName(column.id)}
															className="bg-green-500 text-white p-1 rounded"
														>
															Save
														</button>
													</div>
												) : (
													<>
														<h3 className="font-bold capitalize">
															{column.name}
														</h3>
														<div className="flex items-center">
															<Edit2
																size={16}
																className="cursor-pointer mr-2"
																onClick={() =>
																	handleEditColumn(column.id, column.name)
																}
															/>
															<Trash2
																size={16}
																className="cursor-pointer"
																onClick={() => handleDeleteColumn(column.id)}
															/>
														</div>
													</>
												)}
											</div>
											<Droppable droppableId={column.id.toString()} type="TASK">
												{(provided) => (
													<ul
														{...provided.droppableProps}
														ref={provided.innerRef}
														className="min-h-[100px]"
													>
														{todos
															.filter((todo) => todo.column_id === column.id)
															.map((todo, index) => (
																<Draggable
																	key={todo.id}
																	draggableId={todo.id.toString()}
																	index={index}
																>
																	{(provided) => (
																		<li
																			ref={provided.innerRef}
																			{...provided.draggableProps}
																			{...provided.dragHandleProps}
																			className="border p-4 mb-2 rounded shadow"
																		>
																			<h3 className="font-semibold">
																				{todo.title}
																			</h3>
																			<p>{todo.description}</p>
																			<p>
																				Due:{" "}
																				{new Date(
																					todo.due_date,
																				).toLocaleDateString()}
																			</p>
																			{todo.image_url &&
																				todo.image_url
																					.split(",")
																					.map((url, idx) => (
																						<div key={idx} className="relative">
																							<img
																								src={url}
																								alt={`Task ${todo.id} Image ${idx}`}
																								className="mt-2 w-full h-32 object-cover cursor-pointer"
																								onClick={() =>
																									handleImageClick(url)
																								}
																							/>
																							<button
																								onClick={() =>
																									handleDeleteImage(
																										todo.id,
																										url,
																									)
																								}
																								className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
																							>
																								X
																							</button>
																						</div>
																					))}
																			<button
																				onClick={() => startEditing(todo)}
																				className="bg-yellow-500 text-white p-2 rounded mt-2 mr-2"
																			>
																				Edit
																			</button>
																			<button
																				onClick={() => deleteTodo(todo.id)}
																				className="bg-red-500 text-white p-2 rounded mt-2"
																			>
																				Delete
																			</button>
																		</li>
																	)}
																</Draggable>
															))}
														{provided.placeholder}
													</ul>
												)}
											</Droppable>
										</div>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>

			{selectedImage && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center">
					<div className="relative">
						<img
							src={selectedImage}
							alt="Full"
							className="max-w-full max-h-full"
						/>
						<button
							onClick={closeImageModal}
							className="absolute top-0 right-0 m-4 text-white"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default TodoTable;
