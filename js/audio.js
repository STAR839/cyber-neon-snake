/**
 * 音频管理器 - 处理游戏中的所有音频效果和背景音乐
 * @version 1.0.0
 */
class AudioManager {
    /**
     * 创建音频管理器实例
     */
    constructor() {
        // 检查Web Audio API支持
        this.supported = window.AudioContext || window.webkitAudioContext;
        if (!this.supported) {
            console.warn('当前浏览器不支持Web Audio API，音频功能将被禁用');
            return;
        }

        // 创建音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 音频缓存
        this.audioBuffers = {};
        
        // 当前播放的音频源
        this.sources = {};
        
        // 主音量控制
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        // 音效音量控制
        this.sfxGain = this.audioContext.createGain();
        this.sfxGain.connect(this.masterGain);
        
        // 音乐音量控制
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.masterGain);
        
        // 音频设置
        this.settings = {
            masterVolume: 0.7,
            musicVolume: 0.5,
            sfxVolume: 0.8,
            musicEnabled: true,
            sfxEnabled: true
        };
        
        // 应用初始音量设置
        this.applyVolumeSettings();
        
        // 音频文件路径
        this.audioFiles = {
            eat: 'audio/eat.mp3',
            gameOver: 'audio/game_over.mp3',
            move: 'audio/move.mp3',
            powerUp: 'audio/power_up.mp3',
            achievement: 'audio/achievement.mp3',
            menuSelect: 'audio/menu_select.mp3',
            buttonClick: 'audio/button_click.mp3',
            backgroundMusic: 'audio/background_music.mp3'
        };
        
        // 初始化标志
        this.initialized = false;
    }

    /**
     * 初始化音频管理器，加载所有音频文件
     * @returns {Promise} 初始化完成的Promise
     */
    async init() {
        if (!this.supported) return Promise.resolve();
        
        try {
            // 加载所有音频文件
            const loadPromises = Object.entries(this.audioFiles).map(([name, path]) => {
                return this.loadAudio(name, path);
            });
            
            await Promise.all(loadPromises);
            this.initialized = true;
            console.log('音频管理器初始化完成');
            return Promise.resolve();
        } catch (error) {
            console.error('音频管理器初始化失败:', error);
            return Promise.reject(error);
        }
    }

    /**
     * 加载音频文件
     * @param {string} name - 音频名称
     * @param {string} url - 音频文件URL
     * @returns {Promise} 加载完成的Promise
     */
    loadAudio(name, url) {
        return new Promise((resolve, reject) => {
            // 创建一个空的音频元素作为备用
            const audioElement = new Audio();
            audioElement.src = url;
            
            // 尝试使用Fetch API加载音频文件
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`无法加载音频文件 ${url}: ${response.status} ${response.statusText}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.audioBuffers[name] = audioBuffer;
                    resolve();
                })
                .catch(error => {
                    console.warn(`使用Web Audio API加载音频失败，将使用Audio元素作为备用: ${error.message}`);
                    // 使用Audio元素作为备用
                    this.audioBuffers[name] = audioElement;
                    resolve();
                });
        });
    }

    /**
     * 播放音效
     * @param {string} name - 音效名称
     * @param {Object} options - 播放选项
     * @param {number} options.volume - 音量 (0-1)
     * @param {number} options.loop - 是否循环播放
     */
    playSfx(name, options = {}) {
        if (!this.supported || !this.initialized || !this.settings.sfxEnabled) return;
        
        const buffer = this.audioBuffers[name];
        if (!buffer) {
            console.warn(`音效 ${name} 未找到`);
            return;
        }
        
        // 设置默认选项
        const defaultOptions = {
            volume: 1,
            loop: false
        };
        
        const finalOptions = {...defaultOptions, ...options};
        
        try {
            // 检查是否是AudioBuffer或Audio元素
            if (buffer instanceof AudioBuffer) {
                // 使用Web Audio API播放
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.loop = finalOptions.loop;
                
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = finalOptions.volume;
                
                source.connect(gainNode);
                gainNode.connect(this.sfxGain);
                
                source.start(0);
                
                // 存储音频源引用以便后续控制
                if (!this.sources[name]) {
                    this.sources[name] = [];
                }
                this.sources[name].push(source);
                
                // 非循环音效播放完成后自动清理
                if (!finalOptions.loop) {
                    source.onended = () => {
                        const index = this.sources[name].indexOf(source);
                        if (index !== -1) {
                            this.sources[name].splice(index, 1);
                        }
                    };
                }
            } else if (buffer instanceof HTMLAudioElement) {
                // 使用Audio元素播放
                buffer.volume = finalOptions.volume * this.settings.sfxVolume * this.settings.masterVolume;
                buffer.loop = finalOptions.loop;
                buffer.currentTime = 0;
                buffer.play().catch(e => console.warn('播放音频失败:', e));
            }
        } catch (error) {
            console.error(`播放音效 ${name} 失败:`, error);
        }
    }

    /**
     * 播放背景音乐
     * @param {string} name - 音乐名称
     * @param {Object} options - 播放选项
     * @param {number} options.volume - 音量 (0-1)
     * @param {boolean} options.loop - 是否循环播放
     */
    playMusic(name, options = {}) {
        if (!this.supported || !this.initialized || !this.settings.musicEnabled) return;
        
        // 停止当前播放的所有音乐
        this.stopMusic();
        
        const buffer = this.audioBuffers[name];
        if (!buffer) {
            console.warn(`音乐 ${name} 未找到`);
            return;
        }
        
        // 设置默认选项
        const defaultOptions = {
            volume: 1,
            loop: true
        };
        
        const finalOptions = {...defaultOptions, ...options};
        
        try {
            // 检查是否是AudioBuffer或Audio元素
            if (buffer instanceof AudioBuffer) {
                // 使用Web Audio API播放
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.loop = finalOptions.loop;
                
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = finalOptions.volume;
                
                source.connect(gainNode);
                gainNode.connect(this.musicGain);
                
                source.start(0);
                
                // 存储音乐源引用
                this.currentMusic = {
                    source,
                    gainNode,
                    name
                };
            } else if (buffer instanceof HTMLAudioElement) {
                // 使用Audio元素播放
                buffer.volume = finalOptions.volume * this.settings.musicVolume * this.settings.masterVolume;
                buffer.loop = finalOptions.loop;
                buffer.currentTime = 0;
                buffer.play().catch(e => console.warn('播放音乐失败:', e));
                
                // 存储音乐引用
                this.currentMusic = {
                    element: buffer,
                    name
                };
            }
        } catch (error) {
            console.error(`播放音乐 ${name} 失败:`, error);
        }
    }

    /**
     * 停止播放特定音效
     * @param {string} name - 音效名称
     */
    stopSfx(name) {
        if (!this.supported || !this.initialized) return;
        
        const sources = this.sources[name];
        if (sources && sources.length > 0) {
            sources.forEach(source => {
                try {
                    source.stop(0);
                } catch (error) {
                    // 忽略已经停止的音频源
                }
            });
            this.sources[name] = [];
        }
        
        // 检查是否有Audio元素
        const buffer = this.audioBuffers[name];
        if (buffer instanceof HTMLAudioElement) {
            buffer.pause();
            buffer.currentTime = 0;
        }
    }

    /**
     * 停止播放所有背景音乐
     */
    stopMusic() {
        if (!this.supported || !this.initialized) return;
        
        if (this.currentMusic) {
            if (this.currentMusic.source) {
                try {
                    this.currentMusic.source.stop(0);
                } catch (error) {
                    // 忽略已经停止的音频源
                }
            } else if (this.currentMusic.element) {
                this.currentMusic.element.pause();
                this.currentMusic.element.currentTime = 0;
            }
            this.currentMusic = null;
        }
    }

    /**
     * 暂停所有音频
     */
    pauseAll() {
        if (!this.supported || !this.initialized) return;
        
        // 暂停音乐
        if (this.currentMusic) {
            if (this.currentMusic.element) {
                this.currentMusic.element.pause();
            }
        }
        
        // 暂停音效（仅适用于Audio元素）
        Object.values(this.audioBuffers).forEach(buffer => {
            if (buffer instanceof HTMLAudioElement) {
                buffer.pause();
            }
        });
        
        // 暂停音频上下文
        if (this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    /**
     * 恢复所有音频
     */
    resumeAll() {
        if (!this.supported || !this.initialized) return;
        
        // 恢复音频上下文
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // 恢复音乐（如果启用）
        if (this.settings.musicEnabled && this.currentMusic) {
            if (this.currentMusic.element) {
                this.currentMusic.element.play().catch(e => console.warn('恢复音乐失败:', e));
            }
        }
    }

    /**
     * 设置主音量
     * @param {number} volume - 音量值 (0-1)
     */
    setMasterVolume(volume) {
        if (!this.supported) return;
        
        this.settings.masterVolume = Math.max(0, Math.min(1, volume));
        this.applyVolumeSettings();
    }

    /**
     * 设置音效音量
     * @param {number} volume - 音量值 (0-1)
     */
    setSfxVolume(volume) {
        if (!this.supported) return;
        
        this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
        this.applyVolumeSettings();
    }

    /**
     * 设置音乐音量
     * @param {number} volume - 音量值 (0-1)
     */
    setMusicVolume(volume) {
        if (!this.supported) return;
        
        this.settings.musicVolume = Math.max(0, Math.min(1, volume));
        this.applyVolumeSettings();
    }

    /**
     * 启用/禁用音效
     * @param {boolean} enabled - 是否启用音效
     */
    enableSfx(enabled) {
        if (!this.supported) return;
        
        this.settings.sfxEnabled = enabled;
        if (!enabled) {
            // 停止所有音效
            Object.keys(this.sources).forEach(name => {
                this.stopSfx(name);
            });
        }
    }

    /**
     * 启用/禁用音乐
     * @param {boolean} enabled - 是否启用音乐
     */
    enableMusic(enabled) {
        if (!this.supported) return;
        
        this.settings.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        } else if (this.currentMusic) {
            // 恢复之前的音乐
            this.playMusic(this.currentMusic.name);
        }
    }

    /**
     * 应用音量设置到音频节点
     */
    applyVolumeSettings() {
        if (!this.supported) return;
        
        // 设置主音量
        this.masterGain.gain.value = this.settings.masterVolume;
        
        // 设置音效音量
        this.sfxGain.gain.value = this.settings.sfxEnabled ? this.settings.sfxVolume : 0;
        
        // 设置音乐音量
        this.musicGain.gain.value = this.settings.musicEnabled ? this.settings.musicVolume : 0;
        
        // 更新HTML音频元素的音量
        Object.entries(this.audioBuffers).forEach(([name, buffer]) => {
            if (buffer instanceof HTMLAudioElement) {
                if (this.currentMusic && this.currentMusic.element === buffer) {
                    // 更新音乐音量
                    buffer.volume = this.settings.musicVolume * this.settings.masterVolume;
                } else {
                    // 更新音效音量
                    buffer.volume = this.settings.sfxVolume * this.settings.masterVolume;
                }
            }
        });
    }

    /**
     * 获取当前音频设置
     * @returns {Object} 音频设置对象
     */
    getSettings() {
        return {...this.settings};
    }

    /**
     * 应用音频设置
     * @param {Object} settings - 音频设置对象
     */
    applySettings(settings) {
        if (!this.supported) return;
        
        // 更新设置
        this.settings = {...this.settings, ...settings};
        
        // 应用音量设置
        this.applyVolumeSettings();
        
        // 应用音效启用/禁用设置
        if (settings.hasOwnProperty('sfxEnabled')) {
            this.enableSfx(settings.sfxEnabled);
        }
        
        // 应用音乐启用/禁用设置
        if (settings.hasOwnProperty('musicEnabled')) {
            this.enableMusic(settings.musicEnabled);
        }
    }

    /**
     * 销毁音频管理器，释放资源
     */
    destroy() {
        if (!this.supported) return;
        
        // 停止所有音频
        this.stopMusic();
        Object.keys(this.sources).forEach(name => {
            this.stopSfx(name);
        });
        
        // 关闭音频上下文
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(e => console.warn('关闭音频上下文失败:', e));
        }
        
        // 清除引用
        this.audioBuffers = {};
        this.sources = {};
        this.currentMusic = null;
        this.initialized = false;
    }
}

// 导出音频管理器
window.AudioManager = AudioManager;