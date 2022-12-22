<template>
  <page-header-wrapper :title="projectName ? `${projectName}-${pageTitle}` : ' '">
    <template slot="extra">
      <div style="display: flex;align-items: center;">
        <template v-if="!$route.query.projectId">
          <span style="font-weight: bold">当前项目：</span>
          <div style="width: 200px;">
            <a-select v-model="currentProjectItem" :labelInValue="true" :options="projectOptions" placeholder="无可选项目" style="width: 200px;"></a-select>
          </div>
        </template>
        <a-button v-if="!noProject" type="primary" icon="ordered-list" @click="handle2StatisticsDetail" style="margin-left: 10px;">查看统计详情</a-button>
        <a-button type="primary" icon="sync" @click="doGetStatisticsAnalysis" style="margin-left: 10px;">刷新</a-button>

      </div>
    </template>
    <template v-if="!noProject">
      <a-row :gutter="24">
        <!-- 今日访问次数 -->
        <a-col :sm="24" :md="12" :xl="6" :style="{ marginBottom: '24px' }">
          <chart-card style="height: 170px;" :loading="loading" title="今日访问次数" :total="analysisData.today_view_count | NumberFormat">
            <a-tooltip title="今日访问次数" slot="action">
              <a-icon type="info-circle-o" />
            </a-tooltip>
            <div>
              <mini-area type="hour" :list="analysisData.hour24_count_list"/>
            </div>
            <template slot="footer">
              <trend v-if="analysisData.yesterday_view_count" :flag="analysisData.today_view_count < analysisData.yesterday_view_count ? 'down' : 'up'">
                <span slot="term">比昨日</span>
                {{ ((analysisData.today_view_count - analysisData.yesterday_view_count) / (analysisData.yesterday_view_count || 1) * 100).toFixed(1) + '%' }}
              </trend>
              <span v-else>-</span>
            </template>
          </chart-card>
        </a-col>
        <!-- 近7日访问次数 -->
        <a-col :sm="24" :md="12" :xl="6" :style="{ marginBottom: '24px' }">
          <chart-card style="height: 170px;" :loading="loading" title="近7日访问次数" :total="analysisData.days7_view_count | NumberFormat">
            <a-tooltip title="近7日访问次数" slot="action">
              <a-icon type="info-circle-o" />
            </a-tooltip>
            <div>
              <mini-area type="date" :list="analysisData.days10_count_list"/>
            </div>
            <template slot="footer">
              <trend v-if="analysisData.last_days7_view_count" :flag="analysisData.days7_view_count < analysisData.last_days7_view_count ? 'down' : 'up'">
                <span slot="term">比上个7日</span>
                {{ ((analysisData.days7_view_count - analysisData.last_days7_view_count) / (analysisData.last_days7_view_count) * 100).toFixed(1) + '%' }}
              </trend>
              <span v-else>-</span>
            </template>
          </chart-card>
        </a-col>
        <!-- 总访问人数 -->
        <a-col :sm="24" :md="12" :xl="6" :style="{ marginBottom: '24px' }">
          <chart-card style="height: 170px;" :loading="loading" title="总访问人数" :total="analysisData.visitor_count">
            <a-tooltip title="根据ip区分，相同ip只算一次" slot="action">
              <a-icon type="info-circle-o" />
            </a-tooltip>
            <div>
              今日访问人数 <span>{{ analysisData.today_visitor_count | NumberFormat }}</span>
            </div>
            <template slot="footer">
              <trend v-if="analysisData.yesterday_visitor_count" :flag="analysisData.today_visitor_count < analysisData.yesterday_visitor_count ? 'down' : 'up'">
                <span slot="term">比昨日</span>
                {{ ((analysisData.today_visitor_count - analysisData.yesterday_visitor_count) / (analysisData.yesterday_visitor_count || 1) * 100).toFixed(1) + '%' }}
              </trend>
              <span v-else>-</span>
            </template>
          </chart-card>
        </a-col>
        <!-- 总访问次数 -->
        <a-col :sm="24" :md="12" :xl="6" :style="{ marginBottom: '24px' }">
          <chart-card style="height: 170px;" :loading="loading" title="总访问次数" :total="analysisData.view_count | NumberFormat">
            <a-tooltip title="所有ip的所有访问次数" slot="action">
              <a-icon type="info-circle-o" />
            </a-tooltip>
            <div>
              IP归属地总个数 <span> {{ analysisData.ip_region_count_list.length | NumberFormat }}</span>
            </div>
            <template slot="footer">近30日访问次数 <span> {{ analysisData.days30_view_count | NumberFormat }}</span></template>
          </chart-card>
        </a-col>
      </a-row>

      <div class="antd-pro-pages-dashboard-analysis-twoColLayout" :class="!isMobile && 'desktop'">
        <a-row :gutter="24" type="flex">
          <a-col :xl="12" :lg="24" :md="24" :sm="24" :xs="24">
            <a-card :loading="loading" :bordered="false" title="近12个月访问统计" :style="{ height: '100%' }">
              <bar v-if="hasMonth12BarData" :data="month12BarData"/>
              <div class="empty" style="height: 300px;display: flex;align-items: center;justify-content: center;" v-else>
                <Empty />
              </div>
            </a-card>
          </a-col>
          <a-col :xl="12" :lg="24" :md="24" :sm="24" :xs="24">
            <a-card class="antd-pro-pages-dashboard-analysis-salesCard" :loading="loading" :bordered="false" title="各IP归属地占比" :style="{ height: '100%' }">
              <div>
                <div v-if="ipRegionPieData.length">
                  <v-chart :force-fit="true" :height="300" :data="ipRegionPieData" :scale="pieScale">
                    <v-tooltip :showTitle="false" dataKey="item*percent" />
                    <v-axis />
                    <!-- position="right" :offsetX="-140" -->
                    <v-legend dataKey="item"/>
                    <v-pie position="percent" color="item" :vStyle="pieStyle" :label="['count', {formatter: (val, item) => { return item.point.item + ': ' + val + '次'}}]" />
                    <v-coord type="theta" :radius="0.75" :innerRadius="0.6" />
                  </v-chart>
                </div>
                <div class="empty" v-else>
                  <Empty />
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </template>
    <div v-else style="margin-top: 80px;">
      <Empty description="请先添加项目"/>
    </div>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import { Empty } from 'ant-design-vue'
import {
  ChartCard,
  MiniArea,
  MiniBar,
  MiniProgress,
  RankList,
  Bar,
  Trend,
  NumberInfo
} from '@/components'
import { baseMixin } from '@/store/app-mixin'

import { getStatisticsAnalysis } from '@/api/statistics'
import { getProjectListForSelect } from '@/api/project'

const month12BarData = []
for (let i = 0; i < 12; i += 1) {
  month12BarData.push({
    x: moment().startOf('month').subtract(11 - i, 'month').format('YY/MM'),
    y: Math.floor(Math.random() * 1000) + 200
  })
}

const DataSet = require('@antv/data-set')

const pieScale = [{
  dataKey: 'percent',
  min: 0,
  formatter: '.0%'
}]

export default {
  name: 'Analysis',
  mixins: [baseMixin],
  components: {
    ChartCard,
    MiniArea,
    MiniBar,
    MiniProgress,
    RankList,
    Bar,
    Trend,
    NumberInfo,
    Empty
  },
  data () {
    return {
      projectId: this.$route.query.projectId,
      projectName: this.$route.query.projectName,
      pageTitle: this.$route.meta.title,
      currentProjectItem: null,
      noProject: false,
      analysisData: {
        'days10_count_list': [],
        'days30_view_count': 0,
        'days7_view_count': 0,
        'months12_count_list': [],
        'today_view_count': 0,
        'today_visitor_count': 0,
        'view_count': 0,
        'visitor_count': 0,
        'yesterday_view_count': 0,
        'yesterday_visitor_count': 0,
        'ip_region_count_list': []
      },
      loading: true,

      month12BarData,
      projectOptions: [],
      hasMonth12BarData: false,
      pieScale,
      ipRegionPieData: [],
      pieStyle: {
        stroke: '#fff',
        lineWidth: 1
      }
    }
  },
  watch: {
    currentProjectItem (newVal) {
      localStorage.setItem('currentProject', JSON.stringify(newVal))
      this.projectId = newVal.key || newVal.value
      this.projectName = newVal.label
      this.doGetStatisticsAnalysis()
    }
  },
  created () {
    if (this.projectId) {
      this.doGetStatisticsAnalysis()
    } else {
      let currentProject = localStorage.getItem('currentProject')
      if (currentProject) {
        currentProject = JSON.parse(currentProject)
      }
      getProjectListForSelect().then(res => {
        this.projectOptions = res.data
        if (res.data.length) {
          if (currentProject && res.data.find(i => i.value === currentProject.key)) {
            this.currentProjectItem = currentProject
          } else {
            this.currentProjectItem = res.data[0]
          }
        } else {
          this.noProject = true
        }
      })
    }
  },
  methods: {
    doGetStatisticsAnalysis () {
      this.loading = true
      getStatisticsAnalysis(this.projectId).then(res => {
        this.analysisData = res.data
        this.hasMonth12BarData = res.data.months12_count_list.length
        this.month12BarData = this.month12BarData.map(data => {
          data.count = (res.data.months12_count_list.find(m => {
            const mDate = m.date.substring(2, 7).replace('-', '/')
            return mDate === data.x
          }) || { count: 0 }).count
          return data
        })

        const dv = new DataSet.View().source(res.data.ip_region_count_list.map(data => {
          return { item: data.region, count: data.count }
        }))
        dv.transform({
          type: 'percent',
          field: 'count',
          dimension: 'item',
          as: 'percent'
        })
        this.ipRegionPieData = dv.rows
      }).finally(() => {
        this.loading = false
      })
    },
    handle2StatisticsDetail () {
      this.$router.push({ path: `/project/statistics-list`, query: { 'projectId': this.projectId, 'projectName': this.projectName } })
    }
  }
}
</script>

<style lang="less" scoped>
  .empty {
    width: 100%;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .extra-wrapper {
    line-height: 55px;
    padding-right: 24px;

    .extra-item {
      display: inline-block;
      margin-right: 24px;

      a {
        margin-left: 24px;
      }
    }
  }

  .antd-pro-pages-dashboard-analysis-twoColLayout {
    position: relative;
    display: flex;
    display: block;
    flex-flow: row wrap;
  }

  .antd-pro-pages-dashboard-analysis-salesCard {
    height: calc(100% - 24px);
    :deep(.ant-card-head) {
      position: relative;
    }
  }

  .dashboard-analysis-iconGroup {
    i {
      margin-left: 16px;
      color: rgba(0,0,0,.45);
      cursor: pointer;
      transition: color .32s;
      color: black;
    }
  }
  .analysis-salesTypeRadio {
    position: absolute;
    right: 54px;
    bottom: 12px;
  }
</style>
