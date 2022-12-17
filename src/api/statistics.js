import request from '@/utils/request'

const api = {
  getStatisticsList: '/v1/statistics/statistics/:projectId'
}

export default api

// 查询访问统计列表
export function getStatisticsList (id, params) {
  return request({
    url: api.getStatisticsList.replace(':projectId', id),
    method: 'get',
    params
  })
}
