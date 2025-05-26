import React, { useState, useRef } from 'react';
import { Plus, ArrowLeft, Calendar, User, Clock, MoreHorizontal, GripVertical } from 'lucide-react';

const generateId = () => `task-${Math.random().toString(36).substr(2, 9)}`;

const KanbanBoardPage = () => {
  const projectId = "project-123";
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const draggedColumn = useRef(null);

  const initialColumnsData = {
    'todo': {
      id: 'todo',
      title: 'To Do',
      color: 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900',
      headerColor: 'bg-slate-500',
      tasks: [
        { 
          id: generateId(), 
          content: `Design homepage for Project ${projectId}`,
          priority: 'high',
          assignee: 'Sarah Chen',
          dueDate: '2024-06-15',
          tags: ['Design', 'Frontend']
        },
        { 
          id: generateId(), 
          content: 'Develop API endpoints for user authentication',
          priority: 'medium',
          assignee: 'Mike Johnson',
          dueDate: '2024-06-20',
          tags: ['Backend', 'API']
        },
        { 
          id: generateId(), 
          content: 'Set up database schema',
          priority: 'low',
          assignee: 'Alex Kim',
          dueDate: '2024-06-25',
          tags: ['Database']
        },
      ],
    },
    'inProgress': {
      id: 'inProgress',
      title: 'In Progress',
      color: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
      headerColor: 'bg-blue-500',
      tasks: [
        { 
          id: generateId(), 
          content: 'Write comprehensive API documentation',
          priority: 'high',
          assignee: 'Emma Davis',
          dueDate: '2024-06-18',
          tags: ['Documentation', 'API']
        },
        { 
          id: generateId(), 
          content: 'Implement user dashboard components',
          priority: 'medium',
          assignee: 'David Wilson',
          dueDate: '2024-06-22',
          tags: ['Frontend', 'React']
        },
      ],
    },
    'review': {
      id: 'review',
      title: 'Review',
      color: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30',
      headerColor: 'bg-amber-500',
      tasks: [
        { 
          id: generateId(), 
          content: 'Code review for payment integration',
          priority: 'high',
          assignee: 'Lisa Rodriguez',
          dueDate: '2024-06-16',
          tags: ['Review', 'Payment']
        },
      ],
    },
    'done': {
      id: 'done',
      title: 'Done',
      color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30',
      headerColor: 'bg-emerald-500',
      tasks: [
        { 
          id: generateId(), 
          content: 'Deploy application to staging environment',
          priority: 'medium',
          assignee: 'Tom Anderson',
          dueDate: '2024-06-10',
          tags: ['DevOps', 'Deployment']
        },
        { 
          id: generateId(), 
          content: 'Set up CI/CD pipeline',
          priority: 'low',
          assignee: 'Jennifer Lee',
          dueDate: '2024-06-08',
          tags: ['DevOps', 'Automation']
        },
      ],
    },
  };

  const [columns, setColumns] = useState(initialColumnsData);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleDragStart = (e, task, columnId) => {
    setDraggedTask({ task, sourceColumn: columnId });
    dragItem.current = { task, sourceColumn: columnId };
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
    setDragOverColumn(null);
    dragItem.current = null;
    dragOverItem.current = null;
    draggedColumn.current = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
    draggedColumn.current = columnId;
  };

  const handleDrop = (e, targetColumnId, targetIndex = null) => {
    e.preventDefault();
    
    if (!dragItem.current) return;

    const { task, sourceColumn } = dragItem.current;
    
    if (sourceColumn === targetColumnId && targetIndex === null) {
      return; // Same column, no specific position
    }

    const newColumns = { ...columns };
    
    // Remove task from source column
    const sourceColumnTasks = [...newColumns[sourceColumn].tasks];
    const taskIndex = sourceColumnTasks.findIndex(t => t.id === task.id);
    sourceColumnTasks.splice(taskIndex, 1);
    newColumns[sourceColumn] = {
      ...newColumns[sourceColumn],
      tasks: sourceColumnTasks
    };

    // Add task to target column
    const targetColumnTasks = [...newColumns[targetColumnId].tasks];
    const insertIndex = targetIndex !== null ? targetIndex : targetColumnTasks.length;
    targetColumnTasks.splice(insertIndex, 0, task);
    newColumns[targetColumnId] = {
      ...newColumns[targetColumnId],
      tasks: targetColumnTasks
    };

    setColumns(newColumns);
  };

  const handleTaskDrop = (e, targetColumnId, targetTaskIndex) => {
    handleDrop(e, targetColumnId, targetTaskIndex);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header Section - Compact */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Project Kanban
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID: {projectId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {['SC', 'MJ', 'ED'].map((initials, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-semibold text-white border border-white dark:border-gray-800">
                    {initials}
                  </div>
                ))}
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Add Task
              </button>
            </div>
          </div>

          {/* Stats Overview - Compact */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.values(columns).map((column) => (
              <div key={column.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.headerColor}`}></div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{column.title}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{column.tasks.length}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kanban Board - Compact and Fit to Screen */}
        <div className="grid grid-cols-4 gap-3 h-[calc(100vh-220px)]">
          {Object.values(columns).map((column) => (
            <div 
              key={column.id}
              className={`${column.color} rounded-xl p-3 flex flex-col shadow-sm border border-white/50 dark:border-gray-700/50 backdrop-blur-sm
                          ${dragOverColumn === column.id ? 'ring-2 ring-blue-400 dark:ring-blue-500 ring-opacity-50 scale-[1.01]' : ''} transition-all duration-200`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header - Compact */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/50 dark:border-gray-600/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.headerColor}`}></div>
                  <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                    {column.title}
                  </h2>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {column.tasks.length}
                  </span>
                </div>
                <button className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                  <MoreHorizontal className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Tasks Container - Compact and Scrollable */}
              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {column.tasks.map((task, index) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task, column.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleTaskDrop(e, column.id, index)}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 group cursor-grab active:cursor-grabbing hover:-translate-y-0.5
                                ${draggedTask?.task.id === task.id ? 'opacity-50' : ''}`}
                  >
                    {/* Drag Handle and Content */}
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-3 w-3 text-gray-400 dark:text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex-1 min-w-0">
                        {/* Task Content - Compact */}
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-100 leading-relaxed line-clamp-2">
                            {task.content}
                          </p>
                        </div>

                        {/* Task Tags - Compact */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span key={tagIndex} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-medium">
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Task Meta Information - Compact */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {task.priority && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority.charAt(0).toUpperCase()}
                              </span>
                            )}
                            {task.assignee && (
                              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <User className="h-2.5 w-2.5" />
                                <span className="truncate max-w-12 text-xs">{task.assignee.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Calendar className="h-2.5 w-2.5" />
                              <span className="text-xs">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty State - Compact */}
                {column.tasks.length === 0 && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Plus className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">No tasks</p>
                  </div>
                )}
              </div>

              {/* Add Task Button - Compact */}
              <button className="w-full mt-2 p-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                <Plus className="h-3 w-3" />
                Add task
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoardPage;