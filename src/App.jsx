import { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEYS = {
  tasks: 'tasks',
  categories: 'categories',
}

const palette = ['#0f172a', '#0ea5e9', '#1e293b', '#14b8a6', '#f59e0b', '#6366f1']

const getStored = (key, fallback) => {
  if (typeof localStorage === 'undefined') return fallback

  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : fallback
  } catch (error) {
    console.error(`Unable to read saved ${key}`, error)
    return fallback
  }
}

const createEmptyTask = (categoryId = '') => ({
  title: '',
  notes: '',
  recommendedDate: '',
  deadline: '',
  categoryId,
})

const BirdLogo = () => (
  <svg
    className="h-12 w-12"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="wing" x1="50" x2="180" y1="40" y2="150" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    <path
      d="M36 104c44-6 78-34 90-62 8 26 32 50 56 58-32 10-66 38-78 76-10-24-28-40-52-50"
      fill="url(#wing)"
      opacity="0.9"
    />
    <path
      d="M34 104c14 4 30 12 40 26 8-16 22-30 38-40-11-6-24-10-40-10-15 0-29 8-38 24Z"
      fill="#14b8a6"
      opacity="0.85"
    />
    <path d="M88 68c24-14 52-18 70-6-14 2-28 10-36 26" fill="#0f172a" opacity="0.2" />
    <circle cx="146" cy="66" r="8" fill="#0f172a" />
    <circle cx="150" cy="64" r="3" fill="#0ea5e9" />
    <path d="M162 76c-6-3-8-10-6-16 4 4 9 7 14 8" fill="#f59e0b" />
  </svg>
)

function App() {
  const [categories, setCategories] = useState(() => getStored(STORAGE_KEYS.categories, []))
  const [tasks, setTasks] = useState(() => getStored(STORAGE_KEYS.tasks, []))
  const [form, setForm] = useState(() => createEmptyTask(''))
  const [newCategory, setNewCategory] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(palette[1])
  const [activeTab, setActiveTab] = useState('home')
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, target: null })
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [navOpen, setNavOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryDraft, setCategoryDraft] = useState({ name: '', color: palette[0] })
  const boardRef = useRef(null)

  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm((current) => ({ ...current, categoryId: categories[0].id }))
    }
  }, [categories, form.categoryId])

  const totals = useMemo(
    () => ({
      all: tasks.length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [tasks]
  )

  const tasksByCategory = useMemo(() => {
    const grouped = categories.map((category) => ({
      ...category,
      tasks: tasks.filter((task) => task.categoryId === category.id && !task.completed),
    }))

    const uncategorized = tasks.filter(
      (task) =>
        !task.completed &&
        (!task.categoryId || !categories.some((category) => category.id === task.categoryId))
    )

    if (uncategorized.length > 0) {
      grouped.push({
        id: 'uncategorized',
        name: 'No category',
        color: palette[2],
        tasks: uncategorized,
        isGenerated: true,
      })
    }

    return grouped
  }, [categories, tasks])

  useEffect(() => {
    const close = () => setContextMenu({ open: false, x: 0, y: 0, target: null })
    const onEsc = (event) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('click', close)
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', onEsc)
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedTitle = form.title.trim()
    if (!trimmedTitle) return

    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`,
      title: trimmedTitle,
      notes: form.notes.trim(),
      recommendedDate: form.recommendedDate,
      deadline: form.deadline,
      categoryId: form.categoryId,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setTasks((current) => [newTask, ...current])
    setForm(createEmptyTask(form.categoryId))
  }

  const startEditing = (task) => {
    setEditingTaskId(task.id)
    setEditDraft({
      title: task.title,
      notes: task.notes,
      recommendedDate: task.recommendedDate,
      deadline: task.deadline,
      categoryId: task.categoryId,
    })
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setEditDraft((current) => ({ ...current, [name]: value }))
  }

  const saveEdit = () => {
    if (!editingTaskId || !editDraft?.title?.trim()) return
    setTasks((current) =>
      current.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title: editDraft.title.trim(),
              notes: editDraft.notes,
              recommendedDate: editDraft.recommendedDate,
              deadline: editDraft.deadline,
              categoryId: editDraft.categoryId,
            }
          : task
      )
    )
    setEditingTaskId(null)
    setEditDraft(null)
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setEditDraft(null)
  }

  const addCategory = (name, resetFn) => {
    const trimmed = name.trim()
    if (!trimmed) return

    const color = newCategoryColor || palette[categories.length % palette.length]
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cat-${Date.now()}`

    const exists = categories.some((category) => category.id === id)
    const finalId = exists ? `${id}-${categories.length}` : id

    const created = { id: finalId, name: trimmed, color }
    setCategories((current) => [...current, created])
    if (resetFn) resetFn('')
    setNewCategoryColor(palette[(categories.length + 1) % palette.length])
    setForm((current) => ({ ...current, categoryId: finalId }))
  }

  const handleCategorySubmit = (event) => {
    event.preventDefault()
    const name = newCategory.trim()
    if (!name) return

    addCategory(name, setNewCategory)
  }

  const startCategoryEdit = (category) => {
    setEditingCategoryId(category.id)
    setCategoryDraft({ name: category.name, color: category.color })
    setContextMenu({ open: false, x: 0, y: 0, target: null })
  }

  const handleCategoryDraftChange = (event) => {
    const { name, value } = event.target
    setCategoryDraft((current) => ({ ...current, [name]: value }))
  }

  const saveCategoryEdit = () => {
    if (!editingCategoryId || !categoryDraft.name.trim()) return
    setCategories((current) =>
      current.map((cat) =>
        cat.id === editingCategoryId
          ? { ...cat, name: categoryDraft.name.trim(), color: categoryDraft.color || cat.color }
          : cat
      )
    )
    setEditingCategoryId(null)
  }

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null)
  }

  const toggleCompleted = (taskId) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
    setContextMenu({ open: false, x: 0, y: 0, target: null })
  }

  const deleteTask = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))
    setContextMenu({ open: false, x: 0, y: 0, target: null })
  }

  const deleteCategory = (categoryId) => {
    setCategories((current) => current.filter((category) => category.id !== categoryId))
    setTasks((current) =>
      current.map((task) =>
        task.categoryId === categoryId ? { ...task, categoryId: '' } : task
      )
    )
    if (form.categoryId === categoryId) {
      setForm((current) => ({ ...current, categoryId: '' }))
    }
    setContextMenu({ open: false, x: 0, y: 0, target: null })
  }

  const openContextMenu = (event, target) => {
    event.preventDefault()
    setContextMenu({ open: true, x: event.clientX, y: event.clientY, target })
  }

  const startEditingById = (id) => {
    const task = tasks.find((item) => item.id === id)
    if (task) startEditing(task)
    setContextMenu({ open: false, x: 0, y: 0, target: null })
  }

  const toRgba = (hex, alpha = 0.1) => {
    if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
      return `rgba(15,23,42,${alpha})`
    }
    const value =
      hex.length === 4
        ? hex
            .slice(1)
            .split('')
            .map((c) => c + c)
            .join('')
        : hex.slice(1)
    const num = parseInt(value, 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const formatRelativeDate = (dateString) => {
    if (!dateString) return ''
    const parts = dateString.split('-').map(Number)
    if (parts.length !== 3 || parts.some(Number.isNaN)) return dateString

    const [year, month, day] = parts
    const target = new Date(year, month - 1, day) // local midnight
    const today = new Date()
    const diffDays =
      (new Date(today.getFullYear(), today.getMonth(), today.getDate()) - target) /
      (1000 * 60 * 60 * 24) * -1

    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays === 2) return 'Due in 2 days'
    if (diffDays === -1) return 'Due yesterday'
    if (diffDays === -2) return 'Due 2 days ago'

    const readable = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    if (diffDays > 2) return `Due ${readable}`
    return `Due ${readable}`
  }

  const activeTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  const renderHome = () => (
    <div className="flex h-full w-full gap-3 overflow-x-auto overflow-y-hidden px-3 pb-8 pt-12 items-start">
      <section className="flex w-[290px] shrink-0 flex-col gap-2 rounded-3xl bg-white/90 p-2.5 shadow-sm ring-1 ring-slate-100 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Home</p>
            <p className="text-xl font-semibold text-slate-900">Create & sort</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Local
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 text-white shadow-sm">
          <form onSubmit={handleCategorySubmit} className="flex flex-col gap-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Category</p>
              <span className="text-[11px] font-semibold text-white/70">New lane</span>
            </div>
            <input
              type="text"
              name="newCategory"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="Category name"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none transition focus:border-emerald-200 focus:ring-2 focus:ring-emerald-200/40"
            />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-100">
                Color
                <input
                  type="color"
                  name="color"
                  value={newCategoryColor}
                  onChange={(event) => setNewCategoryColor(event.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-white/20 bg-white/10 p-1"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Add category
              </button>
            </div>
          </form>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-white px-3 py-2.5 text-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Task
                </p>
                <p className="text-lg font-semibold text-slate-900">Add to a lane</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                {totals.all} total
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Task title *</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Draft weekly priorities"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Notes</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Key steps, links, or context for this task."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Action date</span>
                <input
                  type="date"
                  name="recommendedDate"
                  value={form.recommendedDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Deadline</span>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Category</span>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-1 flex items-center justify-end gap-3">
              <button
                type="reset"
                onClick={() => setForm(createEmptyTask(form.categoryId))}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
              >
                Clear
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Save task
              </button>
            </div>
          </form>
        </div>
      </section>

      {tasksByCategory.length === 0 ? (
        <section className="flex h-[calc(100vh-7rem)] w-[480px] shrink-0 items-center justify-center rounded-3xl bg-white/80 p-4 text-center text-slate-500 shadow-sm ring-1 ring-slate-100">
          Add a category or keep tasks uncategorized—either way you will see them here.
        </section>
      ) : (
        tasksByCategory.map((category) => {
          const accent = category.color || '#e2e8f0'
          return (
            <section
              key={category.id}
              className="flex h-[calc(100vh-7rem)] w-[320px] shrink-0 flex-col rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
              style={{ borderTop: `6px solid ${accent}` }}
            >
              <div
                className="mb-2 flex items-center justify-between"
                onContextMenu={(event) => {
                  if (category.isGenerated) return
                  openContextMenu(event, { type: 'category', id: category.id })
                }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {category.name}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {category.tasks.length} task{category.tasks.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span
                  className="h-3 w-3 rounded-full shadow-inner"
                  style={{ backgroundColor: category.color }}
                />
              </div>

              <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-3">
                {category.tasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 py-6 text-xs font-medium text-slate-400">
                    Drop a task here
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {category.tasks.map((task) => {
                      const isEditing = editingTaskId === task.id
                      return (
                        <li
                          key={task.id}
                          onContextMenu={(event) => {
                            event.stopPropagation()
                            openContextMenu(event, { type: 'task', id: task.id })
                          }}
                          className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                          style={{
                            borderLeft: `6px solid ${accent}`,
                            backgroundColor: toRgba(accent, 0.06),
                          }}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                name="title"
                                value={editDraft?.title ?? ''}
                                onChange={handleEditChange}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                              />
                              <textarea
                                name="notes"
                                value={editDraft?.notes ?? ''}
                                onChange={handleEditChange}
                                rows={2}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                                  Action date
                                  <input
                                    type="date"
                                    name="recommendedDate"
                                    value={editDraft?.recommendedDate ?? ''}
                                    onChange={handleEditChange}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                                  />
                                </label>
                                <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                                  Deadline
                                  <input
                                    type="date"
                                    name="deadline"
                                    value={editDraft?.deadline ?? ''}
                                    onChange={handleEditChange}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                                  />
                                </label>
                              </div>
                              <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                                Category
                                <select
                                  name="categoryId"
                                  value={editDraft?.categoryId ?? ''}
                                  onChange={handleEditChange}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                                >
                                  <option value="">No category</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:-translate-y-0.5 hover:shadow"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mb-2 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                              </div>
                              {task.notes && <p className="mb-2 text-xs text-slate-600">{task.notes}</p>}
                              <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                              {task.recommendedDate && (
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-10 rounded-full" style={{ backgroundColor: accent }} />
                                  <span>Action date: {formatRelativeDate(task.recommendedDate)}</span>
                                </div>
                              )}
                              {task.deadline && (
                                <div className="flex items-center gap-2">
                                  <span className="h-1.5 w-10 rounded-full bg-rose-300" />
                                  <span>Deadline: {formatRelativeDate(task.deadline)}</span>
                                </div>
                              )}
                                <div className="flex items-center gap-2 text-slate-500">
                                  <span className="h-1.5 w-10 rounded-full bg-slate-200" />
                                  <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditing(task)}
                                  className="text-[11px] font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleCompleted(task.id)}
                                  className="text-[11px] font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                                >
                                  Mark done
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
const renderAllTasks = () => (
    <div className="flex h-full w-full overflow-y-auto px-6 pb-8 pt-16">
      <section className="flex w-full flex-col rounded-3xl bg-white p-4 text-slate-900 shadow-sm ring-1 ring-slate-100">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              All tasks
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {totals.completed} / {totals.all} complete
            </p>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-3">
          {tasks.filter((task) => !task.completed).length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 py-6 text-xs font-medium text-slate-500">
              Start by adding a task on Home.
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks
                .filter((task) => !task.completed)
                .map((task) => {
                  const category = categories.find((cat) => cat.id === task.categoryId)
                  const accent = category?.color ?? '#cbd5e1'
                  const isEditing = editingTaskId === task.id
                return (
                  <li
                    key={task.id}
                    onContextMenu={(event) => openContextMenu(event, { type: 'task', id: task.id })}
                    className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                    style={{
                      borderLeft: `6px solid ${accent}`,
                      backgroundColor: toRgba(accent, 0.06),
                    }}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name="title"
                          value={editDraft?.title ?? ''}
                          onChange={handleEditChange}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <textarea
                          name="notes"
                          value={editDraft?.notes ?? ''}
                          onChange={handleEditChange}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                            Action date
                            <input
                              type="date"
                              name="recommendedDate"
                              value={editDraft?.recommendedDate ?? ''}
                              onChange={handleEditChange}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                            Deadline
                            <input
                              type="date"
                              name="deadline"
                              value={editDraft?.deadline ?? ''}
                              onChange={handleEditChange}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            />
                          </label>
                        </div>
                        <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                          Category
                          <select
                            name="categoryId"
                            value={editDraft?.categoryId ?? ''}
                            onChange={handleEditChange}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                          >
                            <option value="">No category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:-translate-y-0.5 hover:shadow"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-900"
                            style={{
                              backgroundColor: `${category?.color ?? '#334155'}33`,
                              border: `1px solid ${category?.color ?? '#334155'}`,
                              color: category?.color ?? '#0f172a',
                            }}
                          >
                            {category?.name ?? 'No category'}
                          </span>
                        </div>
                        {task.notes && <p className="mt-1 text-xs text-slate-700">{task.notes}</p>}
                        <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-600">
                          {task.recommendedDate && (
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-10 rounded-full" style={{ backgroundColor: accent }} />
                              <span>Action date: {formatRelativeDate(task.recommendedDate)}</span>
                            </div>
                          )}
                          {task.deadline && (
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-10 rounded-full bg-rose-300" />
                              <span>Deadline: {formatRelativeDate(task.deadline)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="h-1.5 w-10 rounded-full bg-slate-200" />
                            <span>Active</span>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(task)}
                            className="text-[11px] font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCompleted(task.id)}
                            className="text-[11px] font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                          >
                            Check task
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )

const renderChecked = () => (
    <div className="flex h-full w-full overflow-y-auto px-6 pb-8 pt-16">
      <section className="flex w-full flex-col rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Checked
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {completedTasks.length} item{completedTasks.length === 1 ? '' : 's'}
            </p>
          </div>
          <span className="h-2 w-2 rounded-full bg-slate-900" />
        </div>
        <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-3">
          {completedTasks.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 py-6 text-xs font-medium text-slate-400">
              Checked tasks will land here.
            </div>
          ) : (
            <ul className="space-y-3">
              {completedTasks.map((task) => {
                const category = categories.find((cat) => cat.id === task.categoryId)
                const accent = category?.color ?? '#e2e8f0'
                const isEditing = editingTaskId === task.id
                return (
                  <li
                    key={task.id}
                    onContextMenu={(event) => openContextMenu(event, { type: 'task', id: task.id })}
                    className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                    style={{
                      borderLeft: `6px solid ${accent}`,
                      backgroundColor: toRgba(accent, 0.06),
                    }}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name="title"
                          value={editDraft?.title ?? ''}
                          onChange={handleEditChange}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <textarea
                          name="notes"
                          value={editDraft?.notes ?? ''}
                          onChange={handleEditChange}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                            Action date
                            <input
                              type="date"
                              name="recommendedDate"
                              value={editDraft?.recommendedDate ?? ''}
                              onChange={handleEditChange}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                            Deadline
                            <input
                              type="date"
                              name="deadline"
                              value={editDraft?.deadline ?? ''}
                              onChange={handleEditChange}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            />
                          </label>
                        </div>
                        <label className="flex flex-col gap-1 text-[11px] text-slate-600">
                          Category
                          <select
                            name="categoryId"
                            value={editDraft?.categoryId ?? ''}
                            onChange={handleEditChange}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                          >
                            <option value="">No category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:-translate-y-0.5 hover:shadow"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-700"
                            style={{
                              backgroundColor: `${category?.color ?? '#e2e8f0'}33`,
                              border: `1px solid ${category?.color ?? '#e2e8f0'}`,
                              color: category?.color ?? '#0f172a',
                            }}
                          >
                            {category?.name ?? 'No category'}
                          </span>
                        </div>
                        {task.notes && <p className="mt-1 text-xs text-slate-600">{task.notes}</p>}
                        <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-600">
                      {task.recommendedDate && (
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-10 rounded-full" style={{ backgroundColor: accent }} />
                          <span>Action date: {formatRelativeDate(task.recommendedDate)}</span>
                        </div>
                      )}
                      {task.deadline && (
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-10 rounded-full bg-rose-300" />
                          <span>Deadline: {formatRelativeDate(task.deadline)}</span>
                        </div>
                      )}
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="h-1.5 w-10 rounded-full bg-slate-200" />
                            <span>Checked</span>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(task)}
                            className="text-[11px] font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCompleted(task.id)}
                            className="text-[11px] font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                          >
                            Move back to active
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )

  const renderTab = () => {
    if (activeTab === 'all') return renderAllTasks()
    if (activeTab === 'checked') return renderChecked()
    return renderHome()
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="relative flex h-screen">
        <header className="pointer-events-none fixed right-4 top-2 z-30 flex items-center justify-end">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 shadow-sm ring-1 ring-slate-100">
            <BirdLogo />
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-700">
              Palory Flight Board
            </p>
          </div>
        </header>

        <div className="fixed right-6 top-24 z-20">
          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={() => setNavOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-sm ring-1 ring-slate-900 transition hover:-translate-x-1 hover:shadow-md"
            >
              {navOpen ? 'Close Menu' : 'Open Menu'}
              <span className="h-2 w-2 rounded-full bg-white" />
            </button>
            <div
              className={`flex flex-col items-end gap-2 transition-all duration-200 ${
                navOpen ? 'opacity-100 translate-x-0' : 'pointer-events-none translate-x-2 opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('home')
                  setNavOpen(false)
                }}
                className={`group flex min-w-[130px] items-center justify-between gap-3 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest shadow-sm ring-1 transition hover:-translate-x-1 hover:shadow-md ${
                  activeTab === 'home'
                    ? 'bg-white text-slate-900 ring-slate-200'
                    : 'bg-white/80 text-slate-700 ring-slate-200'
                }`}
              >
                Home
                <span className="h-2 w-2 rounded-full bg-emerald-400 transition group-hover:scale-110" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all')
                  setNavOpen(false)
                }}
                className={`group flex min-w-[130px] items-center justify-between gap-3 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest shadow-sm ring-1 transition hover:-translate-x-1 hover:shadow-md ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 ring-slate-200'
                    : 'bg-white/80 text-slate-700 ring-slate-200'
                }`}
              >
                All tasks
                <span className="h-2 w-2 rounded-full bg-slate-900 transition group-hover:scale-110" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('checked')
                  setNavOpen(false)
                }}
                className={`group flex min-w-[130px] items-center justify-between gap-3 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest shadow-sm ring-1 transition hover:-translate-x-1 hover:shadow-md ${
                  activeTab === 'checked'
                    ? 'bg-white text-slate-900 ring-slate-200'
                    : 'bg-white/80 text-slate-700 ring-slate-200'
                }`}
              >
                Checked
                <span className="h-2 w-2 rounded-full bg-slate-900 transition group-hover:scale-110" />
              </button>
            </div>
          </div>
        </div>

        <div ref={boardRef} className="flex h-full w-full overflow-hidden">
          {renderTab()}
        </div>
      </div>

      {editingCategoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Edit category
                </p>
                <p className="text-lg font-semibold text-slate-900">Update lane name & color</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Name
                <input
                  type="text"
                  name="name"
                  value={categoryDraft.name}
                  onChange={handleCategoryDraftChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                Color
                <input
                  type="color"
                  name="color"
                  value={categoryDraft.color}
                  onChange={handleCategoryDraftChange}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelCategoryEdit}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCategoryEdit}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {contextMenu.open && (
        <div
          className="fixed z-50 min-w-[180px] rounded-xl bg-white p-2 text-sm shadow-lg ring-1 ring-slate-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.target?.type === 'task' && (
            <div className="flex flex-col divide-y divide-slate-100">
              <button
                type="button"
                className="flex items-center justify-between px-2 py-2 text-left text-slate-800 hover:bg-slate-50"
                onClick={() => toggleCompleted(contextMenu.target.id)}
              >
                {tasks.find((task) => task.id === contextMenu.target.id)?.completed
                  ? 'Mark active'
                  : 'Check task'}
              </button>
              <button
                type="button"
                className="flex items-center justify-between px-2 py-2 text-left text-slate-800 hover:bg-slate-50"
                onClick={() => startEditingById(contextMenu.target.id)}
              >
                Edit task
              </button>
              <button
                type="button"
                className="flex items-center justify-between px-2 py-2 text-left text-rose-600 hover:bg-rose-50"
                onClick={() => deleteTask(contextMenu.target.id)}
              >
                Delete task
              </button>
            </div>
          )}
          {contextMenu.target?.type === 'category' && (
            <div className="flex flex-col divide-y divide-slate-100">
              <button
                type="button"
                className="flex items-center justify-between px-2 py-2 text-left text-slate-800 hover:bg-slate-50"
                onClick={() => {
                  const cat = categories.find((c) => c.id === contextMenu.target.id)
                  if (cat) startCategoryEdit(cat)
                }}
              >
                Edit category
              </button>
              <button
                type="button"
                className="flex items-center justify-between px-2 py-2 text-left text-rose-600 hover:bg-rose-50"
                onClick={() => deleteCategory(contextMenu.target.id)}
              >
                Delete category
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default App
