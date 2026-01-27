
let tasks = [
  {
    id: 1,
    title: 'Implement authentication',
    description: 'Add user login and registration',
    priority: 'High',
    status: 'completed',
    userId: 1,
    createdAt: '2024-01-27T10:00:00Z',
    deadline: '2024-01-30T23:59:59Z',
    completedAt: '2024-01-27T15:30:00Z'
  },
  {
    id: 2,
    title: 'Write API documentation',
    description: 'Create README and endpoint docs',
    priority: 'Medium',
    status: 'in-progress',
    userId: 2,
    createdAt: '2024-01-27T11:00:00Z',
    deadline: '2024-02-01T23:59:59Z'
  }
];

// Middleware to validate task data
const validateTask = (req, res, next) => {
  const { title, priority, deadline } = req.body;
  
  if (!title || title.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Title is required and must be at least 3 characters'
    });
  }
  
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (priority && !validPriorities.includes(priority.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Priority must be: low, medium, high, or critical'
    });
  }
  
  if (deadline && new Date(deadline) <= new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Deadline must be in the future'
    });
  }
  
  next();
};

// 1. GET /api/tasks - Get all tasks (with filters)
app.get('/api/tasks', (req, res) => {
  try {
    const { status, priority, userId, search } = req.query;
    let filteredTasks = [...tasks];
    
    // Apply filters
    if (status) {
      filteredTasks = filteredTasks.filter(task => 
        task.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    if (priority) {
      filteredTasks = filteredTasks.filter(task => 
        task.priority.toLowerCase() === priority.toLowerCase()
      );
    }
    
    if (userId) {
      filteredTasks = filteredTasks.filter(task => 
        task.userId === parseInt(userId)
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by priority (critical first) and deadline (earliest first)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filteredTasks.sort((a, b) => {
      if (priorityOrder[a.priority.toLowerCase()] !== priorityOrder[b.priority.toLowerCase()]) {
        return priorityOrder[a.priority.toLowerCase()] - priorityOrder[b.priority.toLowerCase()];
      }
      return new Date(a.deadline) - new Date(b.deadline);
    });
    
    res.json({
      success: true,
      count: filteredTasks.length,
      tasks: filteredTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        userId: task.userId,
        createdAt: task.createdAt,
        deadline: task.deadline,
        completedAt: task.completedAt,
        isOverdue: task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      details: error.message
    });
  }
});

// 2. GET /api/tasks/:id - Get single task
app.get('/api/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      task: {
        ...task,
        isOverdue: task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      details: error.message
    });
  }
});

// 3. POST /api/tasks - Create new task (Protected)
app.post('/api/tasks', validateTask, (req, res) => {
  try {
    const { title, description, priority = 'medium', deadline, userId } = req.body;
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to create tasks'
      });
    }
    
    const newTask = {
      id: tasks.length + 1,
      title,
      description: description || '',
      priority: priority.toLowerCase(),
      status: 'pending',
      userId: userId || 1, // Default to first user if not specified
      createdAt: new Date().toISOString(),
      deadline: deadline || null,
      createdBy: 'Task Management System v1.0'
    };
    
    tasks.push(newTask);
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task: newTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      details: error.message
    });
  }
});

// 4. PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', validateTask, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updates = req.body;
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to update tasks'
      });
    }
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Handle status change to completed
    if (updates.status === 'completed' && tasks[taskIndex].status !== 'completed') {
      updates.completedAt = new Date().toISOString();
    } else if (updates.status !== 'completed' && updates.status) {
      updates.completedAt = null;
    }
    
    // Update task
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Task updated successfully!',
      task: tasks[taskIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      details: error.message
    });
  }
});

// 5. DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to delete tasks'
      });
    }
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    
    res.json({
      success: true,
      message: 'Task deleted successfully!',
      task: deletedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      details: error.message
    });
  }
});

// 6. GET /api/tasks/stats - Get task statistics
app.get('/api/tasks/stats', (req, res) => {
  try {
    const stats = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length
      },
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        critical: tasks.filter(t => t.priority === 'critical').length
      },
      overdue: tasks.filter(t => 
        t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
      ).length,
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
        : 0
    };
    
    res.json({
      success: true,
      stats,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate statistics',
      details: error.message
    });
  }
});

// 7. GET /api/tasks/user/:userId - Get user's tasks
app.get('/api/tasks/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userTasks = tasks.filter(t => t.userId === userId);
    
    res.json({
      success: true,
      userId,
      taskCount: userTasks.length,
      tasks: userTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tasks',
      details: error.message
    });
  }
});
