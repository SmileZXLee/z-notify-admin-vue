<template>
  <page-header-wrapper :title="`${projectName}-${pageTitle}`">
    <a-card :bordered="false" style="margin-bottom: 10px">
      <a-row :gutter="10">
        <a-col :span="20" style="display: flex;align-items: center;">
          <strong style="margin-right: 10px">版本API:</strong>
          <a-input style="flex: 1;" :value="versionApiUrl" readonly></a-input>
        </a-col>
        <a-col :span="4">
          <a-button :span="4" type="primary" v-clipboard:copy="versionApiUrl" v-clipboard:success="onCopySuccess">复制到剪贴板</a-button>
        </a-col>
      </a-row>
    </a-card>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="版本号">
                <a-input v-model="queryParam.keyword" placeholder="请输入版本号"/>
              </a-form-item>
            </a-col>
            <a-col :md="16" :sm="16">
              <span class="table-page-search-submitButtons" style="display: flex;justify-content: flex-end;">
                <a-button type="primary" @click="$refs.table.refresh(true)">查询</a-button>
                <a-button style="margin-left: 8px" @click="() => this.queryParam = {}">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>
      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="handleAdd">新建</a-button>
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
              title="确定要删除这个版本吗？"
              ok-text="删除"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a style="color:red">删除</a>
            </a-popconfirm>
          </template>
        </span>
        <span slot="content" slot-scope="text">
          <ellipsis :length="30" tooltip>{{ text }}</ellipsis>
        </span>
        <span slot="download_url" slot-scope="text">
          <ellipsis :length="30" tooltip>{{ text }}</ellipsis>
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
import { getVersionList, createVersion, updateVersion, deleteVersion } from '@/api/version'

import StepByStepModal from '../modules/StepByStepModal'
import CreateVersion from '../modules/CreateVersion'

const columns = [
  {
    title: '版本号',
    dataIndex: 'version'
  },
  {
    title: '更新内容',
    dataIndex: 'content',
    scopedSlots: { customRender: 'content' }
  },
  {
    title: '下载地址',
    dataIndex: 'download_url',
    scopedSlots: { customRender: 'download_url' }
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '150px',
    scopedSlots: { customRender: 'action' }
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
        return getVersionList(this.projectId, requestParameters)
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
    versionApiUrl () {
      return this.projectId ? `${process.env.VUE_APP_API_BASE_URL}/v1/public/versions/${this.projectId}/当前版本号` : '无'
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
