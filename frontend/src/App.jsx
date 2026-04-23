import { useEffect, useState } from "react";
import { apiRequest } from "./api";

const operations = ["uppercase", "lowercase", "reverse", "word_count"];

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    inputText: "",
    operation: "uppercase",
  });
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      const data = await apiRequest("/api/tasks", {}, token);
      setTasks(data);
      if (selectedTask) {
        const found = data.find((task) => task._id === selectedTask._id);
        setSelectedTask(found || null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    loadTasks();
    const timer = setInterval(loadTasks, 4000);
    return () => clearInterval(timer);
  }, [token]);

  async function handleAuth(e) {
    e.preventDefault();
    setError("");

    try {
      if (authMode === "register") {
        await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(authForm),
        });
        setAuthMode("login");
        return;
      }

      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
        }),
      });
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setError("");

    try {
      await apiRequest(
        "/api/tasks",
        {
          method: "POST",
          body: JSON.stringify(taskForm),
        },
        token,
      );
      setTaskForm({ title: "", inputText: "", operation: "uppercase" });
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runTask(taskId) {
    try {
      await apiRequest(`/api/tasks/${taskId}/run`, { method: "POST" }, token);
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
    setSelectedTask(null);
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="card">
          <h1>AI Task Platform</h1>
          <p>Create and run async text operations.</p>
          <form onSubmit={handleAuth}>
            {authMode === "register" && (
              <input
                placeholder="Name"
                value={authForm.name}
                onChange={(e) =>
                  setAuthForm({ ...authForm, name: e.target.value })
                }
              />
            )}
            <input
              placeholder="Email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
            />
            <button type="submit">
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>
          <button
            className="ghost"
            onClick={() =>
              setAuthMode(authMode === "login" ? "register" : "login")
            }
          >
            Switch to {authMode === "login" ? "Register" : "Login"}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <header>
        <h1>AI Task Platform</h1>
        <button onClick={logout}>Logout</button>
      </header>

      <section className="panel">
        <h2>Create Task</h2>
        <form onSubmit={handleCreateTask}>
          <input
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm({ ...taskForm, title: e.target.value })
            }
            required
          />
          <textarea
            placeholder="Input text"
            value={taskForm.inputText}
            onChange={(e) =>
              setTaskForm({ ...taskForm, inputText: e.target.value })
            }
            required
          />
          <select
            value={taskForm.operation}
            onChange={(e) =>
              setTaskForm({ ...taskForm, operation: e.target.value })
            }
          >
            {operations.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Tasks</h2>
          {tasks.length === 0 && <p>No tasks yet.</p>}
          {tasks.map((task) => (
            <div className="task-item" key={task._id}>
              <div>
                <strong>{task.title}</strong>
                <p>{task.operation}</p>
                <small>Status: {task.status}</small>
              </div>
              <div className="actions">
                <button onClick={() => setSelectedTask(task)}>View</button>
                <button onClick={() => runTask(task._id)}>Run</button>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h2>Task Details</h2>
          {!selectedTask && <p>Select a task.</p>}
          {selectedTask && (
            <div>
              <p>
                <strong>Title:</strong> {selectedTask.title}
              </p>
              <p>
                <strong>Status:</strong> {selectedTask.status}
              </p>
              <p>
                <strong>Result:</strong> {selectedTask.result || "-"}
              </p>
              <p>
                <strong>Error:</strong> {selectedTask.errorMessage || "-"}
              </p>
              <h3>Logs</h3>
              <ul>
                {(selectedTask.logs || []).map((log, idx) => (
                  <li key={idx}>{log.message}</li>
                ))}
              </ul>
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </section>
    </div>
  );
}

export default App;
