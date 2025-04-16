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
                    oneClick: false,
                    guid: 'government-affairs-tiny-ruler',
                    perMachine: true,
                    allowElevation: true,
                    allowToChangeInstallationDirectory: true,
                    createDesktopShortcut: true,
                    createStartMenuShortcut: true,
                    shortcutName: 'Ruler',
                    installerSidebar: 'public/sidebar.bmp',
                    uninstallerSidebar: 'public/sidebar.bmp'
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
