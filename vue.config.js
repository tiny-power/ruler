const CompressionPlugin = require('compression-webpack-plugin')
module.exports = {
    publicPath: './',
    productionSourceMap: false,
    devServer: {
        open: true,
        host: '0.0.0.0',
        port: 8081,
        https: false,
        hotOnly: true,
        proxy: {
            '/api': {
                target: 'https://api.tinybrief.app',
                ws: true,
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    },
    configureWebpack: config => {
        if (process.env.NODE_ENV === 'production') {
            // 为生产环境修改配置...
            config.mode = 'production'
            return {
                plugins: [
                    new CompressionPlugin({
                        test: /\.js$|\.html$|\.css/, //匹配文件名
                        threshold: 10240, //对超过10k的数据进行压缩
                        deleteOriginalAssets: false //是否删除原文件
                    })
                ]
            }
        }
    },
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            preload: 'src/preload.js',
            builderOptions: {
                productName: 'Ruler',
                appId: 'com.tiny.tiny.ruler',
                copyright: 'Copyright © 2024 tiny. All Rights Reserved.',
                artifactName: '${name}-${version}-${os}-${arch}.${ext}',
                win: {
                    icon: './public/icon.png',
                    requestedExecutionLevel: 'highestAvailable',
                    target: [
                        {
                            target: 'nsis',
                            arch: ['x64', 'ia32']
                        }
                    ]
                },
                linux: {
                    icon: 'build/icon.png',
                    target: [
                        {
                            target: 'deb',
                            arch: ['x64', 'arm64'] // 'armv7l'
                        }
                    ],
                    category: 'Utility'
                },
                mac: {
                    icon: './public/icon.icns',
                    target: [
                        {
                            target: 'dmg',
                            arch: ['x64', 'arm64']
                        }
                    ]
                },
                nsis: {
                    oneClick: false, // 一键安装
                    guid: 'government-affairs-tiny-ruler', //注册表名字，不推荐修改
                    perMachine: true, // 是否开启安装时权限限制（此电脑或当前用户）
                    allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
                    allowToChangeInstallationDirectory: true, // 允许修改安装目录
                    createDesktopShortcut: true, // 创建桌面图标
                    createStartMenuShortcut: true, // 创建开始菜单图标
                    shortcutName: 'Ruler' // 图标名称
                },
                asar: true,
                extraResources: [
                    {
                        from: 'node_modules/screenshot-desktop/lib/win32/screenCapture_1.3.2.bat',
                        to: './app.asar.unpacked/screenCapture_1.3.2.bat'
                    },
                    {
                        from: 'node_modules/screenshot-desktop/lib/win32/app.manifest',
                        to: './app.asar.unpacked/app.manifest'
                    }
                ]
            }
        }
    }
}
