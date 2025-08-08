/**
 * 游戏核心类 - 处理游戏逻辑、状态和规则
 * @version 1.0.0
 */
class Game {
    /**
     * 创建游戏实例
     * @param {Object} config - 游戏配置对象
     */
    constructor(config = {}) {
        // 默认配置
        this.config = {
            gridSize: 20, // 网格大小（像素）
            width: 30,    // 游戏区域宽度（格子数）
            height: 20,   // 游戏区域高度（格子数）
            speed: 150,   // 初始速度（毫秒/帧）
            speedIncrease: 2, // 每吃一个食物增加的速度
            maxSpeed: 50,    // 最大速度（最小帧间隔）
            initialSnakeLength: 3, // 初始蛇长度
            mode: 'classic',  // 游戏模式：classic, timeAttack, obstacle
            timeLimit: 120,    // 限时模式的时间限制（秒）
            obstacleCount: 5,  // 障碍模式的障碍物数量
            specialFoodChance: 0.1, // 特殊食物出现概率
            specialFoodDuration: 5000, // 特殊食物持续时间（毫秒）
            ...config
        };
        
        // 游戏状态
        this.state = {
            running: false,
            paused: false,
            gameOver: false,
            score: 0,
            time: 0,  // 游戏时间（秒）
            foodEaten: 0,
            specialFoodEaten: 0,
            powerUpActive: false,
            powerUpType: null,
            powerUpEndTime: 0
        };
        
        // 蛇的初始位置和方向
        this.snake = {
            body: [],
            direction: 'right',
            nextDirection: 'right',
            growing: false
        };
        
        // 食物位置
        this.food = {
            x: 0,
            y: 0,
            type: 'normal' // normal, special
        };
        
        // 障碍物数组
        this.obstacles = [];
        
        // 特殊食物计时器
        this.specialFoodTimer = null;
        
        // 游戏循环计时器
        this.gameLoopInterval = null;
        
        // 游戏时间计时器
        this.gameTimeInterval = null;
        
        // 事件回调
        this.callbacks = {
            onScoreChange: null,
            onGameOver: null,
            onPowerUpActivate: null,
            onPowerUpEnd: null,
            onFoodEaten: null,
            onSpecialFoodEaten: null,
            onTimeUpdate: null
        };
        
        // 初始化游戏
        this.init();
    }

    /**
     * 初始化游戏
     */
    init() {
        // 初始化蛇
        this.initSnake();
        
        // 初始化食物
        this.spawnFood();
        
        // 如果是障碍模式，初始化障碍物
        if (this.config.mode === 'obstacle') {
            this.initObstacles();
        }
        
        // 重置游戏状态
        this.resetState();
    }

    /**
     * 初始化蛇
     */
    initSnake() {
        // 清空蛇身体
        this.snake.body = [];
        
        // 设置蛇头在游戏区域中央
        const centerX = Math.floor(this.config.width / 2);
        const centerY = Math.floor(this.config.height / 2);
        
        // 创建初始蛇身体
        for (let i = 0; i < this.config.initialSnakeLength; i++) {
            this.snake.body.push({
                x: centerX - i,
                y: centerY
            });
        }
        
        // 设置初始方向
        this.snake.direction = 'right';
        this.snake.nextDirection = 'right';
    }

    /**
     * 初始化障碍物
     */
    initObstacles() {
        this.obstacles = [];
        
        // 创建指定数量的障碍物
        for (let i = 0; i < this.config.obstacleCount; i++) {
            this.spawnObstacle();
        }
    }

    /**
     * 生成障碍物
     */
    spawnObstacle() {
        let obstacle;
        let validPosition = false;
        
        // 尝试找到一个有效位置
        while (!validPosition) {
            obstacle = {
                x: Utils.getRandomInt(0, this.config.width - 1),
                y: Utils.getRandomInt(0, this.config.height - 1)
            };
            
            // 检查是否与蛇重叠
            const collidesWithSnake = Utils.checkCollisionWithArray(obstacle, this.snake.body, false);
            
            // 检查是否与食物重叠
            const collidesWithFood = Utils.checkCollision(obstacle, this.food);
            
            // 检查是否与其他障碍物重叠
            const collidesWithObstacles = this.obstacles.some(obs => 
                Utils.checkCollision(obstacle, obs)
            );
            
            // 如果没有碰撞，位置有效
            validPosition = !collidesWithSnake && !collidesWithFood && !collidesWithObstacles;
        }
        
        this.obstacles.push(obstacle);
    }

    /**
     * 重置游戏状态
     */
    resetState() {
        this.state = {
            running: false,
            paused: false,
            gameOver: false,
            score: 0,
            time: 0,
            foodEaten: 0,
            specialFoodEaten: 0,
            powerUpActive: false,
            powerUpType: null,
            powerUpEndTime: 0
        };
        
        // 清除所有计时器
        this.clearTimers();
    }

    /**
     * 清除所有计时器
     */
    clearTimers() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        
        if (this.gameTimeInterval) {
            clearInterval(this.gameTimeInterval);
            this.gameTimeInterval = null;
        }
        
        if (this.specialFoodTimer) {
            clearTimeout(this.specialFoodTimer);
            this.specialFoodTimer = null;
        }
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.state.running) return;
        
        // 设置游戏状态为运行中
        this.state.running = true;
        this.state.paused = false;
        this.state.gameOver = false;
        
        // 启动游戏循环
        this.gameLoopInterval = setInterval(() => this.gameLoop(), this.getCurrentSpeed());
        
        // 启动游戏时间计时器
        this.gameTimeInterval = setInterval(() => {
            this.state.time++;
            
            // 如果是限时模式，检查时间是否用完
            if (this.config.mode === 'timeAttack' && this.state.time >= this.config.timeLimit) {
                this.endGame();
            }
            
            // 触发时间更新回调
            if (this.callbacks.onTimeUpdate) {
                this.callbacks.onTimeUpdate(this.state.time);
            }
        }, 1000);
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.state.running || this.state.paused) return;
        
        this.state.paused = true;
        
        // 暂停游戏循环
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
        
        // 暂停游戏时间计时器
        clearInterval(this.gameTimeInterval);
        this.gameTimeInterval = null;
    }

    /**
     * 恢复游戏
     */
    resume() {
        if (!this.state.running || !this.state.paused) return;
        
        this.state.paused = false;
        
        // 恢复游戏循环
        this.gameLoopInterval = setInterval(() => this.gameLoop(), this.getCurrentSpeed());
        
        // 恢复游戏时间计时器
        this.gameTimeInterval = setInterval(() => {
            this.state.time++;
            
            // 如果是限时模式，检查时间是否用完
            if (this.config.mode === 'timeAttack' && this.state.time >= this.config.timeLimit) {
                this.endGame();
            }
            
            // 触发时间更新回调
            if (this.callbacks.onTimeUpdate) {
                this.callbacks.onTimeUpdate(this.state.time);
            }
        }, 1000);
    }

    /**
     * 结束游戏
     */
    endGame() {
        if (!this.state.running) return;
        
        this.state.running = false;
        this.state.gameOver = true;
        
        // 清除所有计时器
        this.clearTimers();
        
        // 触发游戏结束回调
        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver({
                score: this.state.score,
                time: this.state.time,
                foodEaten: this.state.foodEaten,
                specialFoodEaten: this.state.specialFoodEaten,
                mode: this.config.mode
            });
        }
    }

    /**
     * 重置游戏
     */
    reset() {
        // 清除所有计时器
        this.clearTimers();
        
        // 初始化游戏
        this.init();
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        // 更新蛇的方向
        this.snake.direction = this.snake.nextDirection;
        
        // 移动蛇
        this.moveSnake();
        
        // 检查碰撞
        if (this.checkCollision()) {
            this.endGame();
            return;
        }
        
        // 检查是否吃到食物
        this.checkFood();
        
        // 检查能力道具是否结束
        this.checkPowerUps();
    }

    /**
     * 移动蛇
     */
    moveSnake() {
        // 获取蛇头
        const head = {...this.snake.body[0]};
        
        // 根据方向移动蛇头
        switch (this.snake.direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // 如果启用了穿墙模式（特殊食物效果）
        if (this.state.powerUpActive && this.state.powerUpType === 'wallPass') {
            // 穿墙处理
            if (head.x < 0) head.x = this.config.width - 1;
            if (head.x >= this.config.width) head.x = 0;
            if (head.y < 0) head.y = this.config.height - 1;
            if (head.y >= this.config.height) head.y = 0;
        }
        
        // 将新头部添加到蛇身体的前面
        this.snake.body.unshift(head);
        
        // 如果蛇没有在生长，移除尾部
        if (!this.snake.growing) {
            this.snake.body.pop();
        } else {
            // 重置生长标志
            this.snake.growing = false;
        }
    }

    /**
     * 检查碰撞
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision() {
        const head = this.snake.body[0];
        
        // 检查是否撞墙（如果没有穿墙能力）
        if (!this.state.powerUpActive || this.state.powerUpType !== 'wallPass') {
            if (head.x < 0 || head.x >= this.config.width || head.y < 0 || head.y >= this.config.height) {
                return true;
            }
        }
        
        // 检查是否撞到自己（如果没有无敌能力）
        if (!this.state.powerUpActive || this.state.powerUpType !== 'invincible') {
            // 从第二个身体部分开始检查，避免误判头部
            for (let i = 1; i < this.snake.body.length; i++) {
                if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
                    return true;
                }
            }
        }
        
        // 检查是否撞到障碍物（如果是障碍模式且没有无敌能力）
        if (this.config.mode === 'obstacle' && (!this.state.powerUpActive || this.state.powerUpType !== 'invincible')) {
            for (const obstacle of this.obstacles) {
                if (head.x === obstacle.x && head.y === obstacle.y) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 检查是否吃到食物
     */
    checkFood() {
        const head = this.snake.body[0];
        
        // 检查蛇头是否与食物重叠
        if (head.x === this.food.x && head.y === this.food.y) {
            // 增加分数
            this.addScore(this.food.type === 'special' ? 5 : 1);
            
            // 增加食物计数
            this.state.foodEaten++;
            if (this.food.type === 'special') {
                this.state.specialFoodEaten++;
                
                // 激活特殊食物效果
                this.activatePowerUp();
                
                // 触发特殊食物吃到回调
                if (this.callbacks.onSpecialFoodEaten) {
                    this.callbacks.onSpecialFoodEaten(this.state.specialFoodEaten);
                }
            }
            
            // 触发食物吃到回调
            if (this.callbacks.onFoodEaten) {
                this.callbacks.onFoodEaten(this.state.foodEaten);
            }
            
            // 设置蛇生长标志
            this.snake.growing = true;
            
            // 生成新食物
            this.spawnFood();
            
            // 如果是障碍模式，有概率生成新障碍物
            if (this.config.mode === 'obstacle' && Math.random() < 0.3) {
                this.spawnObstacle();
            }
            
            // 增加游戏速度
            if (this.gameLoopInterval) {
                clearInterval(this.gameLoopInterval);
                this.gameLoopInterval = setInterval(() => this.gameLoop(), this.getCurrentSpeed());
            }
        }
    }

    /**
     * 生成食物
     */
    spawnFood() {
        let validPosition = false;
        
        // 清除特殊食物计时器
        if (this.specialFoodTimer) {
            clearTimeout(this.specialFoodTimer);
            this.specialFoodTimer = null;
        }
        
        // 决定是否生成特殊食物
        const isSpecial = Math.random() < this.config.specialFoodChance;
        
        // 尝试找到一个有效位置
        while (!validPosition) {
            this.food = {
                x: Utils.getRandomInt(0, this.config.width - 1),
                y: Utils.getRandomInt(0, this.config.height - 1),
                type: isSpecial ? 'special' : 'normal'
            };
            
            // 检查是否与蛇重叠
            const collidesWithSnake = Utils.checkCollisionWithArray(this.food, this.snake.body, false);
            
            // 检查是否与障碍物重叠
            const collidesWithObstacles = this.obstacles.some(obs => 
                Utils.checkCollision(this.food, obs)
            );
            
            // 如果没有碰撞，位置有效
            validPosition = !collidesWithSnake && !collidesWithObstacles;
        }
        
        // 如果是特殊食物，设置计时器使其消失
        if (isSpecial) {
            this.specialFoodTimer = setTimeout(() => {
                // 如果特殊食物还没被吃，生成新的普通食物
                if (this.food.type === 'special') {
                    this.spawnFood();
                }
            }, this.config.specialFoodDuration);
        }
    }

    /**
     * 激活特殊食物效果
     */
    activatePowerUp() {
        // 随机选择一种能力
        const powerUps = ['speedBoost', 'invincible', 'wallPass'];
        const powerUpType = powerUps[Utils.getRandomInt(0, powerUps.length - 1)];
        
        // 设置能力状态
        this.state.powerUpActive = true;
        this.state.powerUpType = powerUpType;
        this.state.powerUpEndTime = Date.now() + 5000; // 5秒持续时间
        
        // 触发能力激活回调
        if (this.callbacks.onPowerUpActivate) {
            this.callbacks.onPowerUpActivate(powerUpType);
        }
    }

    /**
     * 检查能力道具是否结束
     */
    checkPowerUps() {
        if (this.state.powerUpActive && Date.now() >= this.state.powerUpEndTime) {
            // 结束能力效果
            const powerUpType = this.state.powerUpType;
            this.state.powerUpActive = false;
            this.state.powerUpType = null;
            
            // 触发能力结束回调
            if (this.callbacks.onPowerUpEnd) {
                this.callbacks.onPowerUpEnd(powerUpType);
            }
        }
    }

    /**
     * 改变蛇的方向
     * @param {string} direction - 新方向 (up, down, left, right)
     */
    changeDirection(direction) {
        // 防止180度转弯（蛇不能直接掉头）
        if (
            (direction === 'up' && this.snake.direction !== 'down') ||
            (direction === 'down' && this.snake.direction !== 'up') ||
            (direction === 'left' && this.snake.direction !== 'right') ||
            (direction === 'right' && this.snake.direction !== 'left')
        ) {
            this.snake.nextDirection = direction;
        }
    }

    /**
     * 增加分数
     * @param {number} points - 增加的分数
     */
    addScore(points) {
        this.state.score += points;
        
        // 触发分数变化回调
        if (this.callbacks.onScoreChange) {
            this.callbacks.onScoreChange(this.state.score);
        }
    }

    /**
     * 获取当前游戏速度（毫秒/帧）
     * @returns {number} 当前速度
     */
    getCurrentSpeed() {
        // 基础速度减去（食物数量 * 速度增加值）
        let speed = this.config.speed - (this.state.foodEaten * this.config.speedIncrease);
        
        // 如果有速度提升能力，额外提高速度
        if (this.state.powerUpActive && this.state.powerUpType === 'speedBoost') {
            speed = speed * 0.7; // 提高30%的速度
        }
        
        // 确保不超过最大速度
        return Math.max(this.config.maxSpeed, speed);
    }

    /**
     * 获取游戏状态
     * @returns {Object} 游戏状态对象
     */
    getState() {
        return {...this.state};
    }

    /**
     * 获取游戏配置
     * @returns {Object} 游戏配置对象
     */
    getConfig() {
        return {...this.config};
    }

    /**
     * 设置游戏配置
     * @param {Object} config - 新的游戏配置
     */
    setConfig(config) {
        this.config = {...this.config, ...config};
        
        // 如果游戏没有运行，重置游戏
        if (!this.state.running) {
            this.reset();
        }
    }

    /**
     * 设置回调函数
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }

    /**
     * 获取游戏数据用于渲染
     * @returns {Object} 游戏渲染数据
     */
    getRenderData() {
        return {
            snake: [...this.snake.body],
            food: {...this.food},
            obstacles: [...this.obstacles],
            gridSize: this.config.gridSize,
            width: this.config.width,
            height: this.config.height,
            powerUp: this.state.powerUpActive ? this.state.powerUpType : null
        };
    }

    /**
     * 销毁游戏实例，清理资源
     */
    destroy() {
        // 清除所有计时器
        this.clearTimers();
        
        // 清空回调
        for (const key in this.callbacks) {
            this.callbacks[key] = null;
        }
    }
}

// 导出游戏类
window.Game = Game;