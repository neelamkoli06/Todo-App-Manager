// src/api.js
import axios from 'axios';

const apiUrl = 'https://jsonplaceholder.typicode.com/todos';

export const fetchTodos = async () => {
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching todos:', error);
    return [];
  }
};

export const createTodo = async (newTodo) => {
  try {
    const response = await axios.post(apiUrl, newTodo);
    return response.data;
  } catch (error) {
    console.error('Error creating todo:', error);
    return null;
  }
};

export const updateTodo = async (id, updatedTodo) => {
  try {
    const response = await axios.put(`${apiUrl}/${id}`, updatedTodo);
    return response.data;
  } catch (error) {
    console.error('Error updating todo:', error);
    return null;
  }
};

export const deleteTodo = async (id) => {
  try {
    await axios.delete(`${apiUrl}/${id}`);
    return id;
  } catch (error) {
    console.error('Error deleting todo:', error);
    return null;
  }
};
