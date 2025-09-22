//@typedef import 구문으로 다른 파일의 타입을 가져올 수 있음.
import axios from 'axios'
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '' })


/** @typedef {import('../types').Project} Project */


/** @returns {Promise<Project[]>} */
export async function getProjects() {
const { data } = await api.get('/projects')
return data
}

