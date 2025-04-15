<template>
    <div class="flex-container">
        <img src="../../public/icon.png" style="width: 73px; height: 73px; border-radius: 12px; margin-top: 32px" />
        <div style="margin-top: 12px; font-weight: 600; font-size: 14px">Ruler</div>
        <div style="margin-top: 12px">Version: {{ version }}</div>
        <div style="margin-top: 12px">{{ clientId }}</div>
        <div style="margin-top: 12px; text-align: left; margin-left: 72px; display: flex">
            <div style="width: 60px">GitHub:</div>
            <div
                style="color: rgb(44, 105, 211); font-weight: 600; text-decoration: underline; cursor: pointer"
                @click="openExternal('https://github.com/tiny-power/ruler')"
            >
                https://github.com/tiny-power/ruler
            </div>
        </div>
        <div style="margin-top: 8px; text-align: left; margin-left: 72px; display: flex">
            <div style="width: 60px">Website:</div>
            <div
                style="color: rgb(44, 105, 211); font-weight: 600; text-decoration: underline; cursor: pointer"
                @click="openExternal('https://tinybrief.app/about?type=ruler')"
            >
                https://tinybrief.app/about?type=ruler
            </div>
        </div>
    </div>
</template>

<script>
import { ClientJS } from 'clientjs'
export default {
    data() {
        return {
            version: '1.0.0',
            clientId: ''
        }
    },
    mounted() {
        this.version = require('../../package.json').version
        const client = new ClientJS()
        this.clientId = client.getFingerprint()
    },
    methods: {
        async openExternal(url) {
            await window.ipcRenderer.invoke('openExternal', url)
        }
    }
}
</script>

<style scoped>
.flex-container {
    background: #f5f0ec;
    box-sizing: border-box;
    width: 100%;
    height: 300px;
    text-align: center;
    font-size: 13px;
}
</style>
