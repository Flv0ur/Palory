import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'tasks'

const getStoredTasks = () => {
  if (typeof localStorage === 'undefined') return []

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Unable to read saved tasks', error)
    return []
  }
}

const createEmptyTask = () => ({
  title: '',
  notes: '',
  recommendedDate: '',
  deadline: '',
})

function App() {
  const [tasks, setTasks] = useState(() => getStoredTasks())
  const [form, setForm] = useState(createEmptyTask)

  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const totals = useMemo(
    () => ({
      all: tasks.length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [tasks]
  )

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
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setTasks((current) => [newTask, ...current])
    setForm(createEmptyTask())
  }

  const toggleCompleted = (taskId) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Palory Productivity
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Task capture
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Add a title, notes, and the dates you want to track. Your tasks are saved locally
            so you can come back later and keep moving.
          </p>
        </header>

        <div className="space-y-8">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Create a task</p>
                <p className="text-sm text-slate-500">Fields marked with * are required.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                Local storage active
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Task title *</span>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Draft weekly priorities"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  required
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Key steps, links, or context for this task."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Recommended date</span>
                <input
                  type="date"
                  name="recommendedDate"
                  value={form.recommendedDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Deadline</span>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="reset"
                onClick={() => setForm(createEmptyTask())}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-800"
              >
                Clear
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Save task
              </button>
            </div>
          </form>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Task list</p>
                <p className="text-sm text-slate-500">
                  {totals.all === 0
                    ? 'No tasks yet—start by adding one above.'
                    : `${totals.completed} of ${totals.all} completed`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                Saved locally as "{STORAGE_KEY}"
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Capture your first task to see it appear here.
              </div>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">{task.title}</p>
                        {task.completed && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Done
                          </span>
                        )}
                      </div>
                      {task.notes && <p className="text-sm text-slate-600">{task.notes}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {task.recommendedDate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                            <span className="h-2 w-2 rounded-full bg-blue-400" aria-hidden />
                            Recommended: {task.recommendedDate}
                          </span>
                        )}
                        {task.deadline && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                            <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden />
                            Deadline: {task.deadline}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                          <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden />
                          Created: {new Date(task.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCompleted(task.id)}
                      className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      {task.completed ? 'Mark as active' : 'Mark as done'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
