<template>
  <a-modal
    :title="model && model.id ? '更新版本' : '新建版本'"
    :width="600"
    :visible="visible"
    :confirmLoading="loading"
    @ok="() => { $emit('ok') }"
    @cancel="() => { $emit('cancel') }"
  >
    <a-spin :spinning="loading">
      <a-form :form="form" v-bind="formLayout">
        <!-- 检查是否有 id，有id是修改。其他是新增，新增不显示主键ID -->
        <a-form-item style="display: none;" label="id">
          <a-input v-decorator="['id', { initialValue: null }]" disabled />
        </a-form-item>
        <a-form-item label="版本号">
          <a-input placeholder="请输入版本号" :maxlength="10" show-count v-decorator="['version', {rules: [{required: true, max: 10, message: '版本号不能为空且不能超过10个字符'}]}]" />
        </a-form-item>
        <a-form-item label="更新内容">
          <a-textarea :maxlength="500" show-count :autosize="{ minRows: 8, maxRows: 12 }" placeholder="请输入更新内容" v-decorator="['content', {rules: [{required: true, max: 500, message: '更新内容不能为空且不能超过500个字符'}]}]" />
        </a-form-item>
        <a-form-item label="下载地址">
          <a-input placeholder="请输入下载地址" show-count v-decorator="['download_url']" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'
// 表单字段
const fields = ['version', 'content', 'download_url', 'id']

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      default: () => false
    },
    model: {
      type: Object,
      default: () => null
    }
  },
  data () {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      }
    }
    return {
      form: this.$form.createForm(this),
      disabledDate: current => {
        return false
      }
    }
  },
  created () {
    console.log('custom modal created')

    // 防止表单未注册
    fields.forEach(v => this.form.getFieldDecorator(v))

    // 当 model 发生改变时，为表单设置值
    this.$watch('model', () => {
      this.model && this.form.setFieldsValue(pick(this.model, fields))
    })
  }
}
</script>
