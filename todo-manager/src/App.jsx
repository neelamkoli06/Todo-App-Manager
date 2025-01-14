import React, { useEffect, useState } from "react";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "./api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Button,
  Card,
  Form,
  ListGroup,
  ProgressBar,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import { BsCheckCircle, BsFillXCircleFill, BsPencil } from "react-icons/bs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("priority");
  const [date, setDate] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
  const [filteredTodos, setFilteredTodos] = useState([]); // State to store filtered todos
  const [isFormValid, setIsFormValid] = useState(true);

  // State to track the search debounce timer
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Fetch todos from the API
  useEffect(() => {
    const getTodos = async () => {
      const data = await fetchTodos();
      setTodos(data);
      updateProgress(data);
    };

    getTodos();
  }, []);

  // Group tasks by category
  const groupByCategory = (todos) => {
    return todos.reduce((groups, todo) => {
      const category = todo.category || "Uncategorized"; 
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(todo);
      return groups;
    }, {});
  };

  // Update progress based on completed tasks
  const updateProgress = (todos) => {
    const completed = todos.filter((todo) => todo.completed).length;
    setCompletedCount(completed);
  };

  // Form Validation
  const validateForm = () => {
    return newTask && category && priority !== "priority";
  };

  // Handle Task Creation
  const handleCreateTask = async () => {
    if (!validateForm()) {
      setIsFormValid(false);
      return;
    }
    setIsFormValid(true);

    const newTodo = {
      id: Date.now(),
      title: newTask,
      completed: false,
      category,
      priority,
      date: date ? date.toISOString() : null,
    };

    // Retrieve existing tasks from localStorage
    const tasksFromStorage = JSON.parse(localStorage.getItem("tasks")) || [];
    const updatedTasks = [...tasksFromStorage, newTodo];
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));

    setTodos([...todos, newTodo]);
    setNewTask("");
    setCategory("");
    setPriority("priority");
    setDate(null);
    updateProgress([...todos, newTodo]);
    toast.success("Task added successfully!");

    // Optionally, call the API to save the task remotely
    const createdTodo = await createTodo(newTodo);
    if (createdTodo) {
      setTodos([...todos, createdTodo]);
    }
  };

  // Handle Task Deletion
  const handleDeleteTask = async (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    updateProgress(todos.filter((todo) => todo.id !== id));
    toast.success("Task removed successfully!");

    const deletedId = await deleteTodo(id);
    if (deletedId) {
      setTodos(todos.filter((todo) => todo.id !== deletedId));
    }
  };

  // Handle Task Completion Toggle
  const handleToggleCompletion = async (id) => {
    const todo = todos.find((todo) => todo.id === id);
    const updatedTodo = { ...todo, completed: !todo.completed };

    setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
    updateProgress(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));

    const updated = await updateTodo(id, updatedTodo);
    if (updated) {
      setTodos(todos.map((todo) => (todo.id === id ? updated : todo)));
    }
  };

  // Handle Task Edit
  const handleEditTask = (todo) => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", 
    });

    setEditingTask(todo);
    setNewTask(todo.title);
    setCategory(todo.category || "");
    setPriority(todo.priority || "priority");
    setDate(todo.date ? new Date(todo.date) : null);
  };

  // Handle Update Task
  const handleUpdateTask = async () => {
    if (!validateForm()) {
      setIsFormValid(false);
      return;
    }
    setIsFormValid(true);

    const updatedTodo = {
      ...editingTask,
      title: newTask,
      category,
      priority,
      date: date ? date.toISOString() : null,
    };

    setTodos(
      todos.map((todo) => (todo.id === editingTask.id ? updatedTodo : todo))
    );
    setEditingTask(null);
    setNewTask("");
    setCategory("");
    setPriority("priority");
    setDate(null);
    updateProgress(todos);
    toast.success("Task updated successfully!");

    const updated = await updateTodo(editingTask.id, updatedTodo);
    if (updated) {
      setTodos(
        todos.map((todo) => (todo.id === editingTask.id ? updated : todo))
      );
    }
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingTask(null);
    setNewTask("");
    setCategory("");
    setPriority("priority");
    setDate(null);
  };

  // Handle Search Input Change with Debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear the previous debounce timer if it exists
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set a new debounce timer that triggers the search after 3 seconds
    const timer = setTimeout(() => {
      // Filter todos based on search query
      const filtered = todos.filter((todo) =>
        todo.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTodos(filtered);
    }, 3000);

    setDebounceTimer(timer);
  };

  // Initial filtered todos are all todos, if no search
  useEffect(() => {
    setFilteredTodos(todos);
  }, [todos]);

  const totalTasks = todos.length;
  const progress = totalTasks ? (completedCount / totalTasks) * 100 : 0;

  const priorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "danger";
      case "Medium":
        return "warning";
      case "Low":
        return "secondary";
      default:
        return "primary";
    }
  };

  // Group tasks by category
  const groupedTodos = groupByCategory(filteredTodos);

  return (
    <div className="container-fluid mt-0" style={{ backgroundColor: "#CFC5F4", width: "100%"}}>
      <h1 className="text-center text-dark mb-4">To-Do Manager</h1>

      {/* Search Bar */}
      <input
        className="search"
        style={{ width: "100%", marginTop: "25px", marginBottom: "25px", padding: "10px", borderRadius: "5px" }}
        placeholder="Search here..."
        onChange={handleSearchChange}
        value={searchQuery}
      />

      <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-4" />

      {/* Task Input or Edit Form */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form.Control
            type="text"
            placeholder={editingTask ? "Edit task..." : "Enter task..."}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="mb-2"
            required
            isInvalid={!isFormValid && !newTask}
          />
          <Form.Group>
            <Form.Control
              as="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mb-2"
              required
              isInvalid={!isFormValid && !category}
            >
              <option value="">Select Category</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Control
              as="select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
              isInvalid={!isFormValid && priority === "priority"}
            >
              <option value="priority">Select Priority Level</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
            </Form.Control>
          </Form.Group>
          <DatePicker
            selected={date}
            onChange={(date) => setDate(date)}
            placeholderText="Pick a due date"
            className="form-control mb-2"
          />
          {editingTask ? (
            <>
              <Button variant="success" className="w-100 mt-3" onClick={handleUpdateTask}>
                Update Task
              </Button>
              <Button variant="secondary" className="w-100 mt-2" onClick={handleCancelEdit}>
                Cancel Edit
              </Button>
            </>
          ) : (
            <Button variant="primary" className="w-100 mt-3" onClick={handleCreateTask}>
              Add Task
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* Render Grouped Tasks */}
      {Object.keys(groupedTodos).map((category) => (
        <div key={category}>
          <h3 className="mt-4">{category}</h3>
          <Row>
            {groupedTodos[category].map((todo) => (
              <Col sm={12} md={6} lg={4} key={todo.id}>
                <Card className="mb-3 shadow-sm">
                  <Card.Body>
                    <Card.Title>{todo.title}</Card.Title>
                    <Card.Text>
                      <Badge pill bg={priorityColor(todo.priority)} className="mr-2">
                        {todo.priority}
                      </Badge>
                      {todo.category && (
                        <Badge pill bg="info">
                          {todo.category}
                        </Badge>
                      )}
                    </Card.Text>
                    {todo.date && (
                      <Card.Text>
                        <strong>Due: </strong>
                        {new Date(todo.date).toLocaleDateString()}
                      </Card.Text>
                    )}
                    <Button
                      variant={todo.completed ? "success" : "outline-secondary"}
                      onClick={() => handleToggleCompletion(todo.id)}
                      className="me-2"
                    >
                      {todo.completed ? <BsCheckCircle /> : "Mark as Complete"}
                    </Button>
                    <Button
                      variant="warning"
                      onClick={() => handleEditTask(todo)}
                      className="me-2"
                    >
                      <BsPencil /> Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteTask(todo.id)}>
                      <BsFillXCircleFill />
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default App;
