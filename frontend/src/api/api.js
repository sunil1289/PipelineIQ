import axios from 'axios'

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  timeout: 10000,
})

// ── Pipelines ──────────────────────────────────────────────────────────────
export const getPipelines      = ()        => api.get('/pipelines')
export const getPipelineById   = (id)      => api.get(`/pipelines/${id}`)
export const getPipelinesByJob = (jobName) => api.get(`/pipelines/job/${jobName}`)
export const getStats          = ()        => api.get('/pipelines/stats')
export const getTrend          = ()        => api.get('/pipelines/trend')
export const getJobNames       = ()        => api.get('/pipelines/jobs')
export const deletePipeline    = (id)      => api.delete(`/pipelines/${id}`)
export const deleteAllByJob    = (jobName) => api.delete(`/pipelines/job/${jobName}`)
export const updatePipeline    = (id, data)=> api.put(`/pipelines/${id}`, data)

// ── Alerts ─────────────────────────────────────────────────────────────────
export const getAlerts            = ()   => api.get('/alerts')
export const getAlertCount        = ()   => api.get('/alerts/count')
export const acknowledgeAlert     = (id) => api.put(`/alerts/${id}/acknowledge`)
export const acknowledgeAllAlerts = ()   => api.put('/alerts/acknowledge-all')

export default api