<template>
    <div class="flex-container">
        <el-form label-position="top">
            <el-form-item label="">
                <el-input placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" v-model="licenseKey" clearable> </el-input>
            </el-form-item>
        </el-form>
        <div style="text-align: center; margin-top: 45px">
            <el-button type="primary" size="medium" @click="handleActivate" :disabled="licenseKey === ''"
                >Activate</el-button
            >
        </div>
    </div>
</template>

<script>
import { ClientJS } from 'clientjs'
const Store = require('electron-store')
const store = new Store()
export default {
    data() {
        return {
            licenseKey: ''
        }
    },
    methods: {
        async handleActivate() {
            if (this.licenseKey) {
                const client = new ClientJS()
                const params = {
                    product_id: 'Ruler',
                    client_id: client.getFingerprint(),
                    license_code: this.licenseKey
                }
                let res = await this.$axios.get('verification_license', { params })
                if (res.data.code == 200) {
                    store.set('license', true)
                    await window.ipcRenderer.invoke('closeLicense')
                } else {
                    this.$message.error(res.data.msg)
                }
            }
        }
    }
}
</script>

<style scoped>
.flex-container {
    background: #f0eff4;
    box-sizing: border-box;
    padding: 30px 30px 0px 30px;
    height: 180px;
}
::v-deep .el-input.is-disabled .el-input__inner {
    background-color: #f3f1f2;
}
::v-deep .el-input__inner {
    padding: 0 7.7px;
    background-color: #f3f1f2;
}
::v-deep .el-input-group__append {
    background-color: #f3f1f2;
    padding: 0 8px;
}
::v-deep .el-input.is-disabled .el-input__inner {
    color: #606266;
}
::v-deep .el-select {
    width: 100%;
}
::v-deep .el-radio-group {
    width: 100%;
}
::v-deep .el-radio-button {
    width: 50%;
}
::v-deep .el-radio-button__inner {
    width: 100%;
}
::v-deep .el-radio-button__inner:hover {
    color: #272727;
}
::v-deep .el-slider__bar {
    background-color: #272727;
}
::v-deep .el-slider__button {
    border: 2px solid #272727;
}
::v-deep .el-select .el-input__inner:focus {
    border-color: #272727;
}
::v-deep .el-button--primary {
    background-color: #272727;
    border-color: #272727;
}
::v-deep .el-input__inner:focus {
    border-color: #272727;
}
::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #272727;
    border-color: #272727;
}
::v-deep .el-checkbox__inner:hover {
    border-color: #272727;
}
::v-deep .el-checkbox {
    color: #272727;
    font-weight: 400;
}
::v-deep .el-checkbox__label {
    font-size: 12px;
}
::v-deep .el-checkbox__input.is-checked + .el-checkbox__label {
    color: #272727;
}
::v-deep .el-button--primary.is-disabled:hover {
    background-color: #909399;
    border-color: #909399;
}
</style>
