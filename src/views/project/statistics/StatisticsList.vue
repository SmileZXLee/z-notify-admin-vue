<template>
  <page-header-wrapper :title="`${projectName}-${pageTitle}`">
    <a-card :bordered="false" style="margin-bottom: 10px">
      <a-row :gutter="10">
        <a-col :span="20" style="display: flex;align-items: center;">
          <strong style="margin-right: 10px">记录统计API:</strong>
          <a-input style="flex: 1;" :value="statisticsApiUrl" readonly></a-input>
        </a-col>
        <a-col :span="4">
          <a-button :span="4" type="primary" v-clipboard:copy="statisticsApiUrl" v-clipboard:success="onCopySuccess">复制到剪贴板</a-button>
        </a-col>
      </a-row>
      <a-row :gutter="10" style="margin-top: 10px">
        <a-col :span="20" style="display: flex;align-items: center;">
          <strong style="margin-right: 10px">记录并展示Badge:</strong>
          <a-input style="flex: 1;" :value="statisticsAndBadgeApiUrl" readonly></a-input>
        </a-col>
        <a-col :span="4">
          <a-button :span="4" type="primary" v-clipboard:copy="statisticsAndBadgeApiUrl" v-clipboard:success="onCopySuccess">复制到剪贴板</a-button>
        </a-col>
      </a-row>
    </a-card>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              &nbsp;
            </a-col>
            <a-col :md="16" :sm="16">
              <span class="table-page-search-submitButtons" style="display: flex;justify-content: flex-end;">
                <a-button type="primary" @click="$refs.table.refresh(true)">刷新</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <s-table
        ref="table"
        size="default"
        rowKey="key"
        :columns="columns"
        :data="loadData"
        showPagination="auto"
      >
        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm
              placement="topLeft"
              title="确定要删除吗？"
              ok-text="删除"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a style="color:red">删除</a>
            </a-popconfirm>
          </template>
        </span>
        <span slot="tag" slot-scope="text">
          <ellipsis :length="30" tooltip>{{ text || '-' }}</ellipsis>
        </span>
      </s-table>

      <create-version
        ref="createModal"
        :visible="visible"
        :loading="confirmLoading"
        :model="mdl"
        @cancel="handleCancel"
        @ok="handleOk"
      />
      <step-by-step-modal ref="modal" @ok="handleOk"/>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { STable, Ellipsis } from '@/components'
import { getStatisticsList, createVersion, updateVersion, deleteVersion } from '@/api/statistics'

import StepByStepModal from '../modules/StepByStepModal'
import CreateVersion from '../modules/CreateVersion'

const columns = [
  {
    title: 'ip',
    align: 'center',
    dataIndex: 'ip'
  },
  {
    title: 'ip归属地',
    align: 'center',
    dataIndex: 'ip_region'
  },
  {
    title: '标签',
    align: 'center',
    dataIndex: 'tag',
    scopedSlots: { customRender: 'tag' }
  },
  {
    title: '访问时间',
    align: 'center',
    dataIndex: 'createtime'
  }
]

export default {
  name: 'NoticeList',
  components: {
    STable,
    Ellipsis,
    CreateVersion,
    StepByStepModal
  },
  data () {
    this.columns = columns
    return {
      projectId: this.$route.query.projectId,
      projectName: this.$route.query.projectName,
      pageTitle: this.$route.meta.title,
      // create model
      visible: false,
      confirmLoading: false,
      mdl: null,
      currentDowenloadUrl: '',
      // 查询参数
      queryParam: {},
      // 加载数据方法 必须为 Promise 对象
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam)
        console.log('loadData request parameters:', requestParameters)
        return getStatisticsList(this.projectId, requestParameters)
          .then(res => {
            if (res.data.results.length) {
              this.currentDowenloadUrl = res.data.results[0].download_url
            }
            return res.data
          })
      },
      selectedRowKeys: [],
      selectedRows: []
    }
  },
  computed: {
    statisticsApiUrl () {
      return this.projectId ? `${process.env.VUE_APP_API_BASE_URL}/v1/public/statistics/${this.projectId}` : '无'
    },
    statisticsAndBadgeApiUrl () {
      return this.projectId ? `${process.env.VUE_APP_API_BASE_URL}/v1/public/statistics/${this.projectId}/badge` : '无'
    }
  },
  methods: {
    handleAdd () {
      console.log(this.$route.params)
      this.mdl = { download_url: this.currentDowenloadUrl }
      this.visible = true
    },
    handleEdit (record) {
      this.visible = true
      this.mdl = { ...record }
    },
    handleOk () {
      const form = this.$refs.createModal.form
      this.confirmLoading = true
      form.validateFields((errors, values) => {
        if (!errors) {
          values.project_id = this.projectId
          if (values.id) {
            // 更新
            updateVersion(values).then(res => {
              this.visible = false
              // 重置表单数据
              form.resetFields()
              // 刷新表格
              this.$refs.table.refresh()

              this.$message.success('更新成功')
            })
            .finally(() => {
              this.confirmLoading = false
            })
          } else {
            // 新增
            createVersion(values).then(res => {
              this.visible = false
              // 重置表单数据
              form.resetFields()
              // 刷新表格
              this.$refs.table.refresh()

              this.$message.success('创建成功')
            })
            .finally(() => {
              this.confirmLoading = false
            })
          }
        } else {
          this.confirmLoading = false
        }
      })
    },
    handleCancel () {
      this.visible = false

      const form = this.$refs.createModal.form
      form.resetFields() // 清理表单数据（可不做）
    },
    handleDelete (record) {
      deleteVersion(record.id).then(res => {
        this.$refs.table.refresh()
        this.$message.success('删除成功')
      })
    },
    onSelectChange (selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys
      this.selectedRows = selectedRows
    },
    onCopySuccess () {
      this.$message.success('已复制到剪贴板')
    }
  }
}
</script>
