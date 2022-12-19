<template>
  <page-header-wrapper :title="`${projectName}-${pageTitle}`">
    <a-row :gutter="24">
      <a-col :sm="24" :md="12" :xl="6" :style="{ marginBottom: '24px' }">
        <chart-card :loading="loading" title="总访问人数" :total="analysisData.visitor_count">
          <a-tooltip title="根据ip区分，相同ip只算一次" slot="action">
            <a-icon type="info-circle-o" />
          </a-tooltip>
          <div>
            <trend :flag="analysisData.today_visitor_count < analysisData.yesterday_visitor_count ? 'down' : 'up'">
              <span slot="term">{{ $t('dashboard.analysis.day') }}</span>
              {{ ((analysisData.today_visitor_count - analysisData.yesterday_visitor_count) / (analysisData.yesterday_visitor_count || 1)).toFixed(1) + '%' }}
            </trend>
          </div>
          <template slot="footer">日访问人数 <span>{{ analysisData.today_visitor_count | NumberFormat }}</span></template>
        </chart-card>
      </a-col>
      <a-col :sm="24" :md="12" :xl="6" :style="{ marginBottom: '24px' }">
        <chart-card :loading="loading" title="总访问次数" :total="analysisData.view_count | NumberFormat">
          <a-tooltip title="所有ip的所有访问次数" slot="action">
            <a-icon type="info-circle-o" />
          </a-tooltip>
          <div>
            <mini-area :days10CountList="analysisData.days10_count_list"/>
          </div>
          <template slot="footer">日访问次数 <span> {{ analysisData.today_view_count | NumberFormat }}</span></template>
        </chart-card>
      </a-col>
      <a-col :sm="24" :md="12" :xl="6" :style="{ marginBottom: '24px' }">
        <chart-card :loading="loading" title="近7日总访问次数" :total="analysisData.days7_view_count | NumberFormat">
          <a-tooltip title="近7日总访问次数" slot="action">
            <a-icon type="info-circle-o" />
          </a-tooltip>
          <template slot="footer">-</template>
        </chart-card>
      </a-col>
      <a-col :sm="24" :md="12" :xl="6" :style="{ marginBottom: '24px' }">
        <chart-card :loading="loading" title="近30日总访问次数" :total="analysisData.days30_view_count | NumberFormat">
          <a-tooltip title="近30日总访问次数" slot="action">
            <a-icon type="info-circle-o" />
          </a-tooltip>
          <template slot="footer">-</template>
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
      hasMonth12BarData: false,
      pieScale,
      ipRegionPieData: [],
      pieStyle: {
        stroke: '#fff',
        lineWidth: 1
      }
    }
  },
  created () {
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
      this.loading = !this.loading
    })
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
