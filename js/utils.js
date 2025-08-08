/**
 * 工具类 - 提供游戏中使用的通用工具函数
 * @version 1.0.0
 */
class Utils {
    /**
     * 生成指定范围内的随机整数
     * @param {number} min - 最小值（包含）
     * @param {number} max - 最大值（包含）
     * @returns {number} 随机整数
     */
    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 检查两个对象是否有相同的坐标
     * @param {Object} obj1 - 第一个对象，包含x和y属性
     * @param {Object} obj2 - 第二个对象，包含x和y属性
     * @returns {boolean} 如果坐标相同返回true，否则返回false
     */
    static checkCollision(obj1, obj2) {
        return obj1.x === obj2.x && obj1.y === obj2.y;
    }

    /**
     * 检查对象是否与数组中的任何对象碰撞
     * @param {Object} obj - 要检查的对象，包含x和y属性
     * @param {Array} array - 对象数组，每个对象包含x和y属性
     * @param {boolean} [ignoreHead=true] - 是否忽略数组的第一个元素
     * @returns {boolean} 如果有碰撞返回true，否则返回false
     */
    static checkCollisionWithArray(obj, array, ignoreHead = true) {
        const startIndex = ignoreHead ? 1 : 0;
        for (let i = startIndex; i < array.length; i++) {
            if (this.checkCollision(obj, array[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * 防抖函数 - 限制函数在一定时间内只能执行一次
     * @param {Function} func - 要执行的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖处理后的函数
     */
    static debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    /**
     * 节流函数 - 限制函数在一定时间内最多执行一次
     * @param {Function} func - 要执行的函数
     * @param {number} limit - 限制时间（毫秒）
     * @returns {Function} 节流处理后的函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 格式化时间为分:秒格式
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串 (MM:SS)
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 检测设备类型
     * @returns {Object} 包含设备类型信息的对象
     */
    static detectDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // 检测移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        
        // 检测iOS设备
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
        
        // 检测Android设备
        const isAndroid = /Android/i.test(userAgent);
        
        // 检测平板设备
        const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent);
        
        return {
            isMobile,
            isIOS,
            isAndroid,
            isTablet,
            isDesktop: !isMobile && !isTablet
        };
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID字符串
     */
    static generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 深度克隆对象
     * @param {Object} obj - 要克隆的对象
     * @returns {Object} 克隆后的对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (obj instanceof Object) {
            const copy = {};
            Object.keys(obj).forEach(key => {
                copy[key] = this.deepClone(obj[key]);
            });
            return copy;
        }
        
        throw new Error('无法复制对象: ' + obj);
    }

    /**
     * 计算两点之间的距离
     * @param {Object} point1 - 第一个点，包含x和y属性
     * @param {Object} point2 - 第二个点，包含x和y属性
     * @returns {number} 两点之间的距离
     */
    static calculateDistance(point1, point2) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    /**
     * 检查浏览器是否支持某个特性
     * @param {string} feature - 要检查的特性名称
     * @returns {boolean} 如果支持返回true，否则返回false
     */
    static checkBrowserSupport(feature) {
        const features = {
            webAudio: !!window.AudioContext || !!window.webkitAudioContext,
            localStorage: !!window.localStorage,
            canvas: !!document.createElement('canvas').getContext,
            touchEvents: 'ontouchstart' in window,
            gamepad: !!navigator.getGamepads
        };
        
        return features[feature] || false;
    }

    /**
     * 获取当前时间戳
     * @returns {number} 当前时间戳（毫秒）
     */
    static getCurrentTimestamp() {
        return Date.now();
    }

    /**
     * 将RGB颜色值转换为十六进制颜色代码
     * @param {number} r - 红色值 (0-255)
     * @param {number} g - 绿色值 (0-255)
     * @param {number} b - 蓝色值 (0-255)
     * @returns {string} 十六进制颜色代码
     */
    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    /**
     * 将十六进制颜色代码转换为RGB颜色值
     * @param {string} hex - 十六进制颜色代码
     * @returns {Object} 包含r、g、b属性的对象
     */
    static hexToRgb(hex) {
        // 移除#前缀（如果有）
        hex = hex.replace(/^#/, '');
        
        // 处理3位十六进制
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        
        const bigint = parseInt(hex, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    /**
     * 检测碰撞 - 使用AABB（轴对齐边界框）碰撞检测
     * @param {Object} rect1 - 第一个矩形，包含x、y、width和height属性
     * @param {Object} rect2 - 第二个矩形，包含x、y、width和height属性
     * @returns {boolean} 如果碰撞返回true，否则返回false
     */
    static checkAABBCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * 线性插值 - 在两个值之间平滑过渡
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值因子 (0-1)
     * @returns {number} 插值结果
     */
    static lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    /**
     * 限制值在指定范围内
     * @param {number} value - 要限制的值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 限制后的值
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * 检查点是否在矩形内
     * @param {Object} point - 点，包含x和y属性
     * @param {Object} rect - 矩形，包含x、y、width和height属性
     * @returns {boolean} 如果点在矩形内返回true，否则返回false
     */
    static isPointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width && 
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }

    /**
     * 将角度转换为弧度
     * @param {number} degrees - 角度
     * @returns {number} 弧度
     */
    static degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * 将弧度转换为角度
     * @param {number} radians - 弧度
     * @returns {number} 角度
     */
    static radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * 获取两点之间的角度
     * @param {Object} point1 - 第一个点，包含x和y属性
     * @param {Object} point2 - 第二个点，包含x和y属性
     * @returns {number} 角度（度）
     */
    static getAngleBetweenPoints(point1, point2) {
        return this.radiansToDegrees(Math.atan2(point2.y - point1.y, point2.x - point1.x));
    }

    /**
     * 检查浏览器是否支持全屏模式
     * @returns {boolean} 如果支持返回true，否则返回false
     */
    static isFullscreenSupported() {
        return document.fullscreenEnabled || 
               document.webkitFullscreenEnabled || 
               document.mozFullScreenEnabled || 
               document.msFullscreenEnabled;
    }

    /**
     * 切换全屏模式
     * @param {HTMLElement} element - 要全屏显示的元素
     */
    static toggleFullscreen(element) {
        if (!this.isFullscreenSupported()) {
            console.warn('全屏模式不受支持');
            return;
        }
        
        if (!document.fullscreenElement && 
            !document.mozFullScreenElement && 
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            // 进入全屏
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
}

// 导出工具类
window.Utils = Utils;