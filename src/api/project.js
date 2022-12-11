import request from '@/utils/request'

const api = {
  getProjectList: '/v1/project/projects',
  createProject: '/v1/project/project',
  updateProject: '/v1/project/project',
  deleteProject: '/v1/project/project'
}

export default api

// 查询项目列表
export function getProjectList (params) {
  return request({
    url: api.getProjectList,
    method: 'get',
    params
  })
}

// 创建项目
export function createProject (params) {
  return request({
    url: api.createProject,
    method: 'post',
    data: params
  })
}

// 更新项目
export function updateProject (params) {
  return request({
    url: `${api.deleteProject}/${params.id}`,
    method: 'put',
    data: params
  })
}

// 删除项目
export function deleteProject (projectId) {
  return request({
    url: `${api.deleteProject}/${projectId}`,
    method: 'delete'
  })
}
