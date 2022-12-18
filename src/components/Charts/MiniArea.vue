<template>
  <div class="antv-chart-mini">
    <div class="chart-wrapper" :style="{ height: 46 }">
      <v-chart :force-fit="true" :height="height" :data="chartData" :padding="[36, 0, 18, 0]">
        <v-tooltip />
        <v-smooth-area position="x*y" />
      </v-chart>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
const orginData = []
const beginDay = new Date().getTime()

for (let i = 0; i < 10; i++) {
  orginData.push({
    x: moment(new Date(beginDay - 1000 * 60 * 60 * 24 * i)).format('YYYY-MM-DD'),
    y: 0
  })
}

const tooltip = [
  'x*y',
  (x, y) => ({
    name: x,
    value: y
  })
]
const scale = [{
  dataKey: 'x',
  min: 2
}, {
  dataKey: 'y',
  title: '时间',
  min: 1,
  max: 22
}]

export default {
  name: 'MiniArea',
  props: {
    days10CountList: {
      type: Array,
      default: function () {
        return []
      }
    }
  },
  computed: {
    chartData () {
      return this.orginData.map(data => {
        data.y = (this.days10CountList.find(i => i.date === data.x) || { count: 0 }).count
        return data
      })
    }
  },
  data () {
    return {
      orginData,
      tooltip,
      scale,
      height: 100
    }
  }
}
</script>

<style lang="less" scoped>
  @import "chart";
</style>
