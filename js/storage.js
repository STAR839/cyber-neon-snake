/**
 * 存储管理器 - 处理游戏数据的本地存储和读取
 * @version 1.0.0
 */
class StorageManager {
    /**
     * 创建存储管理器实例
     */
    constructor() {
        // 检查localStorage支持
        this.supported = this.checkSupport();
        if (!this.supported) {
            console.warn('当前浏览器不支持localStorage，存储功能将被禁用');
        }
        
        // 存储键前缀，用于区分不同游戏的存储
        this.keyPrefix = 'cyberSnake_';
        
        // 存储版本，用于处理存储格式变更
        this.storageVersion = '1.0';
        
        // 默认设置
        this.defaultSettings = {
            musicEnabled: true,
            sfxEnabled: true,
            nightMode: false,
            controlType: 'keyboard', // keyboard, touch
            difficulty: 'normal', // easy, normal, hard
            version: this.storageVersion
        };
        
        // 默认游戏统计
        this.defaultStats = {
            gamesPlayed: 0,
            highScores: {
                classic: 0,
                timeAttack: 0,
                obstacle: 0
            },
            totalScore: 0,
            totalPlayTime: 0,
            longestGame: 0,
            foodEaten: 0,
            powerUpsCollected: 0,
            deaths: 0,
            version: this.storageVersion
        };
        
        // 默认成就状态
        this.defaultAchievements = {
            // 高分成就
            highScorer: {
                id: 'highScorer',
                name: '高分达人',
                description: '在经典模式中获得100分',
                requirement: 100,
                progress: 0,
                unlocked: false,
                icon: '🏆'
            },
            // 美食家成就
            foodie: {
                id: 'foodie',
                name: '美食家',
                description: '总共吃掉50个食物',
                requirement: 50,
                progress: 0,
                unlocked: false,
                icon: '🍎'
            },
            // 长寿成就
            survivor: {
                id: 'survivor',
                name: '生存专家',
                description: '在一局游戏中存活3分钟',
                requirement: 180, // 秒
                progress: 0,
                unlocked: false,
                icon: '⏱️'
            },
            // 游戏成瘾成就
            addict: {
                id: 'addict',
                name: '游戏成瘾',
                description: '玩20局游戏',
                requirement: 20,
                progress: 0,
                unlocked: false,
                icon: '🎮'
            },
            // 全能玩家成就
            allRounder: {
                id: 'allRounder',
                name: '全能玩家',
                description: '在所有游戏模式中至少获得30分',
                requirement: 3, // 所有3种模式
                progress: 0,
                unlocked: false,
                icon: '🌟'
            }
        };
        
        // 默认皮肤状态
        this.defaultSkins = {
            // 默认皮肤（初始解锁）
            default: {
                id: 'default',
                name: '经典霓虹',
                description: '默认的霓虹蛇皮肤',
                colors: {
                    head: '#00F0FF',
                    body: '#00CCFF',
                    effect: '#00F0FF'
                },
                unlocked: true,
                selected: true
            },
            // 粉红皮肤（需解锁）
            pink: {
                id: 'pink',
                name: '霓虹粉',
                description: '在经典模式中获得50分解锁',
                colors: {
                    head: '#FF00C8',
                    body: '#FF33D6',
                    effect: '#FF00C8'
                },
                unlockRequirement: {
                    type: 'score',
                    mode: 'classic',
                    value: 50
                },
                unlocked: false,
                selected: false
            },
            // 金色皮肤（需解锁）
            gold: {
                id: 'gold',
                name: '黄金蛇',
                description: '总共吃掉30个食物解锁',
                colors: {
                    head: '#FFD700',
                    body: '#FFC800',
                    effect: '#FFD700'
                },
                unlockRequirement: {
                    type: 'food',
                    value: 30
                },
                unlocked: false,
                selected: false
            },
            // 彩虹皮肤（需解锁）
            rainbow: {
                id: 'rainbow',
                name: '彩虹蛇',
                description: '玩10局游戏解锁',
                colors: {
                    head: '#FF0000',
                    body: 'rainbow',
                    effect: 'rainbow'
                },
                unlockRequirement: {
                    type: 'games',
                    value: 10
                },
                unlocked: false,
                selected: false
            },
            // 幽灵皮肤（需解锁）
            ghost: {
                id: 'ghost',
                name: '幽灵蛇',
                description: '在一局游戏中存活2分钟解锁',
                colors: {
                    head: '#FFFFFF',
                    body: 'rgba(255, 255, 255, 0.5)',
                    effect: '#FFFFFF'
                },
                unlockRequirement: {
                    type: 'survival',
                    value: 120 // 秒
                },
                unlocked: false,
                selected: false
            },
            // 赛博朋克皮肤（需解锁）
            cyberpunk: {
                id: 'cyberpunk',
                name: '赛博朋克',
                description: '解锁3个成就后获得',
                colors: {
                    head: '#FF00FF',
                    body: '#9900FF',
                    effect: '#FF00FF'
                },
                unlockRequirement: {
                    type: 'achievements',
                    value: 3
                },
                unlocked: false,
                selected: false
            }
        };
    }

    /**
     * 检查浏览器是否支持localStorage
     * @returns {boolean} 是否支持localStorage
     */
    checkSupport() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 初始化存储管理器
     * @returns {Promise} 初始化完成的Promise
     */
    async init() {
        if (!this.supported) return Promise.resolve();
        
        try {
            // 检查存储版本并进行迁移（如果需要）
            this.checkStorageVersion();
            
            // 确保所有必要的存储项都存在
            this.ensureStorageDefaults();
            
            console.log('存储管理器初始化完成');
            return Promise.resolve();
        } catch (error) {
            console.error('存储管理器初始化失败:', error);
            return Promise.reject(error);
        }
    }

    /**
     * 检查存储版本并进行必要的迁移
     */
    checkStorageVersion() {
        if (!this.supported) return;
        
        // 获取设置中的版本
        const settings = this.getSettings();
        
        // 如果版本不匹配，进行迁移
        if (settings.version !== this.storageVersion) {
            console.log(`存储版本不匹配，从 ${settings.version} 迁移到 ${this.storageVersion}`);
            
            // 在这里添加版本迁移逻辑
            // 例如：如果从0.9版本迁移到1.0版本，可能需要重新格式化某些数据
            
            // 更新版本号
            settings.version = this.storageVersion;
            this.saveSettings(settings);
        }
    }

    /**
     * 确保所有必要的存储项都存在，如果不存在则创建默认值
     */
    ensureStorageDefaults() {
        if (!this.supported) return;
        
        // 确保设置存在
        if (!this.getItem('settings')) {
            this.saveSettings(this.defaultSettings);
        }
        
        // 确保游戏统计存在
        if (!this.getItem('stats')) {
            this.saveStats(this.defaultStats);
        }
        
        // 确保成就存在
        if (!this.getItem('achievements')) {
            this.saveAchievements(this.defaultAchievements);
        }
        
        // 确保皮肤存在
        if (!this.getItem('skins')) {
            this.saveSkins(this.defaultSkins);
        }
    }

    /**
     * 获取存储项
     * @param {string} key - 存储键名（不包含前缀）
     * @returns {*} 存储的值，如果不存在则返回null
     */
    getItem(key) {
        if (!this.supported) return null;
        
        try {
            const value = localStorage.getItem(this.keyPrefix + key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`获取存储项 ${key} 失败:`, error);
            return null;
        }
    }

    /**
     * 设置存储项
     * @param {string} key - 存储键名（不包含前缀）
     * @param {*} value - 要存储的值
     * @returns {boolean} 是否成功设置
     */
    setItem(key, value) {
        if (!this.supported) return false;
        
        try {
            localStorage.setItem(this.keyPrefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`设置存储项 ${key} 失败:`, error);
            return false;
        }
    }

    /**
     * 删除存储项
     * @param {string} key - 存储键名（不包含前缀）
     * @returns {boolean} 是否成功删除
     */
    removeItem(key) {
        if (!this.supported) return false;
        
        try {
            localStorage.removeItem(this.keyPrefix + key);
            return true;
        } catch (error) {
            console.error(`删除存储项 ${key} 失败:`, error);
            return false;
        }
    }

    /**
     * 清除所有游戏相关的存储项
     * @returns {boolean} 是否成功清除
     */
    clearAll() {
        if (!this.supported) return false;
        
        try {
            // 获取所有以前缀开头的键
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.keyPrefix)) {
                    keysToRemove.push(key);
                }
            }
            
            // 删除所有相关键
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // 重新初始化默认值
            this.ensureStorageDefaults();
            
            return true;
        } catch (error) {
            console.error('清除所有存储失败:', error);
            return false;
        }
    }

    /**
     * 获取游戏设置
     * @returns {Object} 游戏设置对象
     */
    getSettings() {
        const settings = this.getItem('settings');
        return settings || {...this.defaultSettings};
    }

    /**
     * 保存游戏设置
     * @param {Object} settings - 游戏设置对象
     * @returns {boolean} 是否成功保存
     */
    saveSettings(settings) {
        // 确保版本号正确
        settings.version = this.storageVersion;
        return this.setItem('settings', settings);
    }

    /**
     * 获取游戏统计
     * @returns {Object} 游戏统计对象
     */
    getStats() {
        const stats = this.getItem('stats');
        return stats || {...this.defaultStats};
    }

    /**
     * 保存游戏统计
     * @param {Object} stats - 游戏统计对象
     * @returns {boolean} 是否成功保存
     */
    saveStats(stats) {
        // 确保版本号正确
        stats.version = this.storageVersion;
        return this.setItem('stats', stats);
    }

    /**
     * 更新游戏统计
     * @param {Object} newStats - 要更新的统计数据
     * @returns {boolean} 是否成功更新
     */
    updateStats(newStats) {
        const currentStats = this.getStats();
        const updatedStats = {...currentStats, ...newStats};
        return this.saveStats(updatedStats);
    }

    /**
     * 获取特定游戏模式的最高分
     * @param {string} mode - 游戏模式 (classic, timeAttack, obstacle)
     * @returns {number} 最高分
     */
    getHighScore(mode) {
        const stats = this.getStats();
        return stats.highScores[mode] || 0;
    }

    /**
     * 更新最高分（如果新分数更高）
     * @param {string} mode - 游戏模式 (classic, timeAttack, obstacle)
     * @param {number} score - 新分数
     * @returns {boolean} 是否是新的最高分
     */
    updateHighScore(mode, score) {
        const stats = this.getStats();
        const currentHighScore = stats.highScores[mode] || 0;
        
        if (score > currentHighScore) {
            stats.highScores[mode] = score;
            this.saveStats(stats);
            return true;
        }
        
        return false;
    }

    /**
     * 获取成就列表
     * @returns {Object} 成就对象
     */
    getAchievements() {
        const achievements = this.getItem('achievements');
        return achievements || {...this.defaultAchievements};
    }

    /**
     * 保存成就列表
     * @param {Object} achievements - 成就对象
     * @returns {boolean} 是否成功保存
     */
    saveAchievements(achievements) {
        return this.setItem('achievements', achievements);
    }

    /**
     * 更新成就进度
     * @param {string} achievementId - 成就ID
     * @param {number} progress - 新的进度值
     * @returns {Object|null} 如果成就刚解锁，返回成就对象；否则返回null
     */
    updateAchievementProgress(achievementId, progress) {
        const achievements = this.getAchievements();
        const achievement = achievements[achievementId];
        
        if (!achievement) {
            console.warn(`成就 ${achievementId} 不存在`);
            return null;
        }
        
        // 如果已经解锁，不需要更新
        if (achievement.unlocked) {
            return null;
        }
        
        // 更新进度
        achievement.progress = Math.max(achievement.progress, progress);
        
        // 检查是否达到解锁条件
        if (achievement.progress >= achievement.requirement) {
            achievement.unlocked = true;
            achievement.progress = achievement.requirement; // 确保不超过要求
            this.saveAchievements(achievements);
            return achievement; // 返回刚解锁的成就
        }
        
        this.saveAchievements(achievements);
        return null;
    }

    /**
     * 获取已解锁的成就数量
     * @returns {number} 已解锁的成就数量
     */
    getUnlockedAchievementsCount() {
        const achievements = this.getAchievements();
        return Object.values(achievements).filter(a => a.unlocked).length;
    }

    /**
     * 获取皮肤列表
     * @returns {Object} 皮肤对象
     */
    getSkins() {
        const skins = this.getItem('skins');
        return skins || {...this.defaultSkins};
    }

    /**
     * 保存皮肤列表
     * @param {Object} skins - 皮肤对象
     * @returns {boolean} 是否成功保存
     */
    saveSkins(skins) {
        return this.setItem('skins', skins);
    }

    /**
     * 解锁皮肤
     * @param {string} skinId - 皮肤ID
     * @returns {Object|null} 如果皮肤成功解锁，返回皮肤对象；否则返回null
     */
    unlockSkin(skinId) {
        const skins = this.getSkins();
        const skin = skins[skinId];
        
        if (!skin) {
            console.warn(`皮肤 ${skinId} 不存在`);
            return null;
        }
        
        // 如果已经解锁，不需要更新
        if (skin.unlocked) {
            return null;
        }
        
        // 解锁皮肤
        skin.unlocked = true;
        this.saveSkins(skins);
        return skin; // 返回刚解锁的皮肤
    }

    /**
     * 选择皮肤
     * @param {string} skinId - 皮肤ID
     * @returns {boolean} 是否成功选择
     */
    selectSkin(skinId) {
        const skins = this.getSkins();
        const skin = skins[skinId];
        
        if (!skin) {
            console.warn(`皮肤 ${skinId} 不存在`);
            return false;
        }
        
        if (!skin.unlocked) {
            console.warn(`皮肤 ${skinId} 尚未解锁`);
            return false;
        }
        
        // 取消当前选中的皮肤
        Object.values(skins).forEach(s => s.selected = false);
        
        // 选中新皮肤
        skin.selected = true;
        this.saveSkins(skins);
        return true;
    }

    /**
     * 获取当前选中的皮肤
     * @returns {Object} 当前选中的皮肤对象
     */
    getSelectedSkin() {
        const skins = this.getSkins();
        const selectedSkin = Object.values(skins).find(skin => skin.selected);
        return selectedSkin || skins.default; // 如果没有选中的皮肤，返回默认皮肤
    }

    /**
     * 检查皮肤是否可以解锁
     * @param {string} skinId - 皮肤ID
     * @returns {boolean} 是否可以解锁
     */
    canUnlockSkin(skinId) {
        const skins = this.getSkins();
        const skin = skins[skinId];
        
        if (!skin || skin.unlocked || !skin.unlockRequirement) {
            return false;
        }
        
        const req = skin.unlockRequirement;
        const stats = this.getStats();
        const achievements = this.getAchievements();
        
        switch (req.type) {
            case 'score':
                // 检查特定模式的分数
                return stats.highScores[req.mode] >= req.value;
                
            case 'food':
                // 检查吃掉的食物总数
                return stats.foodEaten >= req.value;
                
            case 'games':
                // 检查游戏局数
                return stats.gamesPlayed >= req.value;
                
            case 'survival':
                // 检查最长游戏时间（秒）
                return stats.longestGame >= req.value;
                
            case 'achievements':
                // 检查解锁的成就数量
                return this.getUnlockedAchievementsCount() >= req.value;
                
            default:
                return false;
        }
    }

    /**
     * 检查并解锁所有符合条件的皮肤
     * @returns {Array} 新解锁的皮肤数组
     */
    checkAndUnlockSkins() {
        const skins = this.getSkins();
        const newlyUnlocked = [];
        
        Object.keys(skins).forEach(skinId => {
            if (this.canUnlockSkin(skinId)) {
                const skin = this.unlockSkin(skinId);
                if (skin) {
                    newlyUnlocked.push(skin);
                }
            }
        });
        
        return newlyUnlocked;
    }

    /**
     * 获取存储使用摘要
     * @returns {Object} 存储使用摘要
     */
    getStorageSummary() {
        if (!this.supported) return { supported: false };
        
        try {
            const summary = {
                supported: true,
                version: this.storageVersion,
                items: {}
            };
            
            // 计算每个存储项的大小
            const keysToCheck = ['settings', 'stats', 'achievements', 'skins'];
            let totalSize = 0;
            
            keysToCheck.forEach(key => {
                const value = localStorage.getItem(this.keyPrefix + key);
                if (value) {
                    const size = new Blob([value]).size;
                    summary.items[key] = {
                        size: size,
                        sizeFormatted: this.formatBytes(size)
                    };
                    totalSize += size;
                }
            });
            
            summary.totalSize = totalSize;
            summary.totalSizeFormatted = this.formatBytes(totalSize);
            
            return summary;
        } catch (error) {
            console.error('获取存储摘要失败:', error);
            return { supported: true, error: error.message };
        }
    }

    /**
     * 格式化字节大小为人类可读格式
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的大小字符串
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 导出存储管理器
window.StorageManager = StorageManager;